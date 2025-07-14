const axios = require('axios');
const { IndiaMartLead, IndiaMartConfig, IndiaMartLog } = require('../models');

class IndiaMartScheduler {
  constructor() {
    this.intervals = new Map();
    this.isRunning = false;
  }

  // Start the scheduler
  async start() {
    if (this.isRunning) {
      console.log('IndiaMART Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting IndiaMART Scheduler...');

    // Initial setup of all user schedules
    await this.setupAllUserSchedules();

    // Check for new configs every 5 minutes
    this.configCheckInterval = setInterval(async () => {
      await this.setupAllUserSchedules();
    }, 5 * 60 * 1000);

    console.log('IndiaMART Scheduler started successfully');
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('IndiaMART Scheduler is not running');
      return;
    }

    this.isRunning = false;
    console.log('Stopping IndiaMART Scheduler...');

    // Clear all user intervals
    this.intervals.forEach((interval, userId) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    // Clear config check interval
    if (this.configCheckInterval) {
      clearInterval(this.configCheckInterval);
    }

    console.log('IndiaMART Scheduler stopped');
  }

  // Setup schedules for all users
  async setupAllUserSchedules() {
    try {
      const configs = await IndiaMartConfig.find({ 
        isActive: true,
        'settings.autoFetch': true 
      });

      // Clear existing intervals for users not in the current config
      const activeUserIds = new Set(configs.map(config => config.userId.toString()));
      
      for (const [userId, interval] of this.intervals) {
        if (!activeUserIds.has(userId)) {
          clearInterval(interval);
          this.intervals.delete(userId);
          console.log(`Cleared schedule for user ${userId}`);
        }
      }

      // Setup or update schedules for active users
      for (const config of configs) {
        const userId = config.userId.toString();
        
        // If user already has a schedule, check if it needs updating
        if (this.intervals.has(userId)) {
          // For now, we'll just continue. In a production system, you might want to
          // check if the interval has changed and update accordingly
          continue;
        }

        // Setup new schedule
        await this.setupUserSchedule(config);
      }

    } catch (error) {
      console.error('Error setting up user schedules:', error);
    }
  }

  // Setup schedule for a specific user
  async setupUserSchedule(config) {
    const userId = config.userId.toString();
    const intervalMs = config.fetchInterval * 60 * 1000; // Convert minutes to milliseconds

    console.log(`Setting up schedule for user ${userId} with interval ${config.fetchInterval} minutes`);

    const interval = setInterval(async () => {
      await this.fetchLeadsForUser(config.userId);
    }, intervalMs);

    this.intervals.set(userId, interval);

    // If it's time for the next fetch, trigger it now
    if (config.nextFetchTime && new Date() >= config.nextFetchTime) {
      setTimeout(async () => {
        await this.fetchLeadsForUser(config.userId);
      }, 1000); // Wait 1 second before triggering
    }
  }

  // Fetch leads for a specific user
  async fetchLeadsForUser(userId) {
    const startTime = new Date();
    let logEntry = null;

    try {
      console.log(`Fetching leads for user ${userId}`);

      const config = await IndiaMartConfig.findOne({ userId, isActive: true });
      
      if (!config) {
        console.log(`No active config found for user ${userId}`);
        return;
      }

      // Create log entry
      logEntry = await IndiaMartLog.create({
        userId: userId,
        action: 'scheduled_sync',
        status: 'pending',
        startTime: startTime,
        metadata: {
          crmKey: config.crmKey.slice(-4),
          userAgent: 'IndiaMART-Scheduler-Service'
        }
      });

      // Calculate time range
      const now = new Date();
      const endTime = this.formatDateTime(now);
      
      let startTimeFormatted;
      if (config.lastFetchTime) {
        // Use overlap strategy
        const overlapTime = new Date(config.lastFetchTime.getTime() - (config.overlapDuration * 60 * 1000));
        startTimeFormatted = this.formatDateTime(overlapTime);
      } else {
        // First fetch - get last 24 hours
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        startTimeFormatted = this.formatDateTime(yesterday);
      }

      // Make API request
      const apiUrl = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${config.crmKey}&start_time=${startTimeFormatted}&end_time=${endTime}`;
      
      logEntry.metadata.requestUrl = apiUrl.replace(config.crmKey, '***');
      logEntry.metadata.startTimestamp = startTimeFormatted;
      logEntry.metadata.endTimestamp = endTime;
      await logEntry.save();

      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'WhatsAPI-IndiaMart-Integration-Scheduler'
        }
      });

      const endTimeLog = new Date();
      
      // Process the response
      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      if (response.data && Array.isArray(response.data)) {
        for (const lead of response.data) {
          try {
            if (!lead.UNIQUE_QUERY_ID) {
              skippedCount++;
              continue;
            }

            // Check if lead already exists
            const existingLead = await IndiaMartLead.findOne({
              uniqueQueryId: lead.UNIQUE_QUERY_ID
            });

            if (existingLead) {
              skippedCount++;
              continue;
            }

            // Create new lead
            await IndiaMartLead.create({
              userId: userId,
              uniqueQueryId: lead.UNIQUE_QUERY_ID,
              queryTime: new Date(lead.QUERY_TIME),
              queryType: lead.QUERY_TYPE || '',
              queryMessage: lead.QUERY_MESSAGE || '',
              senderName: lead.SENDER_NAME || '',
              senderMobile: lead.SENDER_MOBILE || '',
              senderEmail: lead.SENDER_EMAIL || '',
              senderCompany: lead.SENDER_COMPANY || '',
              senderAddress: lead.SENDER_ADDRESS || '',
              senderCity: lead.SENDER_CITY || '',
              senderState: lead.SENDER_STATE || '',
              senderPincode: lead.SENDER_PINCODE || '',
              senderCountryIso: lead.SENDER_COUNTRY_ISO || '',
              senderMobileAlt: lead.SENDER_MOBILE_ALT || '',
              senderEmailAlt: lead.SENDER_EMAIL_ALT || '',
              subject: lead.SUBJECT || '',
              productName: lead.PRODUCT_NAME || '',
              callDuration: lead.CALL_DURATION || '',
              receiverMobile: lead.RECEIVER_MOBILE || ''
            });

            processedCount++;
          } catch (leadError) {
            console.error('Lead processing error:', leadError);
            errorCount++;
          }
        }
      }

      // Update configuration
      await IndiaMartConfig.findOneAndUpdate(
        { userId: userId },
        {
          lastFetchTime: now,
          nextFetchTime: new Date(now.getTime() + (config.fetchInterval * 60 * 1000)),
          totalLeadsFetched: config.totalLeadsFetched + processedCount,
          totalApiCalls: config.totalApiCalls + 1,
          lastApiCallStatus: 'success',
          lastApiCallError: null
        }
      );

      // Update log entry
      await IndiaMartLog.findByIdAndUpdate(logEntry._id, {
        status: 'success',
        endTime: endTimeLog,
        duration: endTimeLog - startTime,
        recordsPulled: response.data ? response.data.length : 0,
        recordsProcessed: processedCount,
        recordsSkipped: skippedCount,
        recordsErrors: errorCount,
        apiResponse: {
          statusCode: response.status,
          message: 'Success',
          data: { recordCount: response.data ? response.data.length : 0 }
        }
      });

      console.log(`Scheduled sync completed for user ${userId}: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`);

    } catch (error) {
      console.error(`Scheduled sync error for user ${userId}:`, error);
      
      const endTimeLog = new Date();
      
      // Update config with error
      await IndiaMartConfig.findOneAndUpdate(
        { userId: userId },
        {
          lastApiCallStatus: 'error',
          lastApiCallError: error.message,
          totalApiCalls: await IndiaMartConfig.findOne({ userId: userId }).then(c => c ? c.totalApiCalls + 1 : 1)
        }
      );

      // Update log entry
      if (logEntry) {
        await IndiaMartLog.findByIdAndUpdate(logEntry._id, {
          status: 'error',
          endTime: endTimeLog,
          duration: endTimeLog - startTime,
          error: error.message,
          errorCode: error.response?.status?.toString() || 'UNKNOWN',
          apiResponse: {
            statusCode: error.response?.status || 0,
            message: error.message,
            data: error.response?.data || null
          }
        });
      }

      // Handle retries if enabled
      if (config?.settings?.retryFailedCalls) {
        const retryCount = logEntry?.retryCount || 0;
        const maxRetries = config.settings.maxRetries || 3;
        
        if (retryCount < maxRetries) {
          console.log(`Scheduling retry ${retryCount + 1} for user ${userId}`);
          
          setTimeout(async () => {
            if (logEntry) {
              await IndiaMartLog.findByIdAndUpdate(logEntry._id, {
                retryCount: retryCount + 1,
                action: 'error_retry'
              });
            }
            await this.fetchLeadsForUser(userId);
          }, 5 * 60 * 1000); // Retry after 5 minutes
        }
      }
    }
  }

  // Format date time for IndiaMART API
  formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeUsers: this.intervals.size,
      activeUserIds: Array.from(this.intervals.keys())
    };
  }

  // Manually trigger fetch for a specific user
  async triggerFetchForUser(userId) {
    console.log(`Manually triggering fetch for user ${userId}`);
    await this.fetchLeadsForUser(userId);
  }
}

// Export singleton instance
const indiaMartScheduler = new IndiaMartScheduler();

module.exports = indiaMartScheduler; 