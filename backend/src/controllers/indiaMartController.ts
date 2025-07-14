const axios = require('axios');
const { IndiaMartLead, IndiaMartConfig, IndiaMartLog, LeadSource, LeadData } = require('../models');

// Get IndiaMART configuration
const getConfig = async (req, res) => {
  try {
    // Try new LeadSource model first
    let config = await LeadSource.findOne({ 
      userId: req.user._id, 
      name: 'indiamart' 
    });
    
    // Fallback to old IndiaMartConfig for backward compatibility
    if (!config) {
      const oldConfig = await IndiaMartConfig.findOne({ userId: req.user._id });
      if (oldConfig) {
        // Migrate old config to new model
        config = await LeadSource.create({
          userId: req.user._id,
          name: 'indiamart',
          displayName: 'IndiaMART',
          apiKey: oldConfig.crmKey,
          isActive: oldConfig.isActive,
          settings: {
            fetchInterval: oldConfig.fetchInterval,
            overlapDuration: oldConfig.overlapDuration,
            autoFetch: oldConfig.settings?.autoFetch || true,
            retryFailedCalls: oldConfig.settings?.retryFailedCalls || true,
            maxRetries: oldConfig.settings?.maxRetries || 3,
            notifications: oldConfig.settings?.notifications || true
          },
          metadata: {
            lastFetchTime: oldConfig.lastFetchTime,
            nextFetchTime: oldConfig.nextFetchTime,
            totalLeadsFetched: oldConfig.totalLeadsFetched,
            totalApiCalls: oldConfig.totalApiCalls,
            lastApiCallStatus: oldConfig.lastApiCallStatus,
            lastApiCallError: oldConfig.lastApiCallError
          }
        });
      }
    }
    
    if (!config) {
      return res.json({
        configured: false,
        message: 'IndiaMART not configured'
      });
    }

    // Hide sensitive information
    const sanitizedConfig = {
      ...config.toObject(),
      crmKey: config.apiKey ? '***' + config.apiKey.slice(-4) : null,
      apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : null
    };

    res.json({
      configured: true,
      config: sanitizedConfig
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
};

// Save IndiaMART configuration
const saveConfig = async (req, res) => {
  try {
    const { crmKey, fetchInterval, overlapDuration, settings } = req.body;
    
    if (!crmKey || typeof crmKey !== 'string' || crmKey.length < 10) {
      return res.status(400).json({ error: 'Valid CRM key is required' });
    }

    const configData = {
      userId: req.user._id,
      name: 'indiamart',
      displayName: 'IndiaMART',
      apiKey: crmKey,
      isActive: true,
      settings: {
        fetchInterval: fetchInterval || 15,
        overlapDuration: overlapDuration || 5,
        autoFetch: settings?.autoFetch !== undefined ? settings.autoFetch : true,
        retryFailedCalls: settings?.retryFailedCalls !== undefined ? settings.retryFailedCalls : true,
        maxRetries: settings?.maxRetries || 3,
        notifications: settings?.notifications !== undefined ? settings.notifications : true
      }
    };

    const config = await LeadSource.findOneAndUpdate(
      { userId: req.user._id, name: 'indiamart' },
      configData,
      { upsert: true, new: true }
    );

    // Log the configuration update
    await IndiaMartLog.create({
      userId: req.user._id,
      action: 'config_update',
      status: 'success',
      startTime: new Date(),
      endTime: new Date(),
      metadata: {
        crmKey: crmKey.slice(-4),
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      message: 'Configuration saved successfully',
      config: {
        ...config.toObject(),
        crmKey: '***' + crmKey.slice(-4),
        apiKey: '***' + crmKey.slice(-4)
      }
    });
  } catch (error) {
    console.error('Save config error:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
};

// Fetch leads from IndiaMART API
const fetchLeads = async (req, res) => {
  console.log('🚀 [BACKEND] fetchLeads function called');
  console.log('🚀 [BACKEND] User ID:', req.user._id);
  console.log('🚀 [BACKEND] Request headers:', req.headers);
  
  const startTime = new Date();
  let logEntry = null;

  try {
    console.log('🔍 [BACKEND] Looking for IndiaMART config...');
    const config = await LeadSource.findOne({ 
      userId: req.user._id,
      name: 'indiamart'
    });
    
    console.log('🔍 [BACKEND] Config found:', config ? 'YES' : 'NO');
    if (config) {
      console.log('🔍 [BACKEND] Config details:', {
        id: config._id,
        name: config.name,
        hasApiKey: !!config.apiKey,
        apiKey: config.apiKey,
        apiKeyLength: config.apiKey ? config.apiKey.length : 0,
        settings: config.settings,
        metadata: config.metadata
      });
    }
    
    if (!config) {
      console.log('❌ [BACKEND] IndiaMART not configured for user');
      return res.status(400).json({ error: 'IndiaMART not configured' });
    }

    console.log('📝 [BACKEND] Creating log entry...');
    // Create log entry
    logEntry = await IndiaMartLog.create({
      userId: req.user._id,
      action: 'manual_sync',
      status: 'pending',
      startTime: startTime,
      metadata: {
        crmKey: config.apiKey.slice(-4),
        userAgent: req.headers['user-agent']
      }
    });
    console.log('✅ [BACKEND] Log entry created:', logEntry._id);

    // Calculate time range
    const now = new Date();
    const endTime = formatDateTime(now);
    console.log('⏰ [BACKEND] Current time:', now);
    console.log('⏰ [BACKEND] End time formatted:', endTime);
    
    let startTimeFormatted;
    if (config.lastFetchTime) {
      console.log('⏰ [BACKEND] Using overlap strategy with lastFetchTime:', config.lastFetchTime);
      // Use overlap strategy
      const overlapTime = new Date(config.lastFetchTime.getTime() - (config.overlapDuration * 60 * 1000));
      startTimeFormatted = formatDateTime(overlapTime);
      console.log('⏰ [BACKEND] Overlap time calculated:', overlapTime);
    } else {
      console.log('⏰ [BACKEND] First fetch - getting last 24 hours');
      // First fetch - get last 24 hours
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      startTimeFormatted = formatDateTime(yesterday);
      console.log('⏰ [BACKEND] Yesterday time calculated:', yesterday);
    }
    console.log('⏰ [BACKEND] Start time formatted:', startTimeFormatted);

    // Make API request
    const apiUrl = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${config.apiKey}&start_time=${startTimeFormatted}&end_time=${endTime}`;
    console.log('🌐 [BACKEND] API URL (masked):', apiUrl.replace(config.apiKey, '***'));
    console.log('🌐 [BACKEND] API URL length:', apiUrl.length);
    
    logEntry.metadata.requestUrl = apiUrl.replace(config.apiKey, '***');
    logEntry.metadata.startTimestamp = startTimeFormatted;
    logEntry.metadata.endTimestamp = endTime;
    await logEntry.save();
    console.log('✅ [BACKEND] Log entry updated with request details');

    console.log('🌐 [BACKEND] Making API request to IndiaMART...');

    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'WhatsAPI-IndiaMart-Integration'
      }
    });

    console.log('✅ [BACKEND] API response received');
    console.log('✅ [BACKEND] Response status:', response.status);
    console.log('✅ [BACKEND] Response headers:', response.headers);
    console.log('✅ [BACKEND] Response data type:', typeof response.data);
    console.log('✅ [BACKEND] Response data is array:', Array.isArray(response.data));
    console.log('✅ [BACKEND] Response data length:', response.data ? response.data.length : 'null');
    console.log('✅ [BACKEND] Response object keys:', Object.keys(response));
    console.log('✅ [BACKEND] Response.data constructor:', response.data ? response.data.constructor.name : 'null');
    
    // Additional debugging for the response structure
    if (response.data) {
      console.log('✅ [BACKEND] First few chars of response.data:', JSON.stringify(response.data).substring(0, 200));
      console.log('✅ [BACKEND] Response.data keys:', Object.keys(response.data));
      
      // Check if data is nested in a property
      if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        for (const key of Object.keys(response.data)) {
          const value = response.data[key];
          console.log(`✅ [BACKEND] response.data.${key}:`, {
            type: typeof value,
            isArray: Array.isArray(value),
            length: Array.isArray(value) ? value.length : 'N/A'
          });
        }
      }
    }

    const endTimeLog = new Date();
    console.log('⏰ [BACKEND] API request completed at:', endTimeLog);
    console.log('⏰ [BACKEND] Total request duration:', endTimeLog.getTime() - startTime.getTime(), 'ms');
    
    // Process the response
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('🔄 [BACKEND] Starting to process leads...');
    // Determine the actual leads array
    let leadsArray = null;
    
    if (Array.isArray(response.data)) {
      // Direct array response
      leadsArray = response.data;
      console.log('✅ [BACKEND] Direct array response detected');
    } else if (response.data && typeof response.data === 'object') {
      // Object response - check common property names for the leads array
      const possibleKeys = ['data', 'results', 'leads', 'items', 'records'];
      for (const key of possibleKeys) {
        if (response.data[key] && Array.isArray(response.data[key])) {
          leadsArray = response.data[key];
          console.log(`✅ [BACKEND] Found leads array in response.data.${key}`);
          break;
        }
      }
      
      // If no standard key found, check all keys
      if (!leadsArray) {
        for (const key of Object.keys(response.data)) {
          if (Array.isArray(response.data[key])) {
            leadsArray = response.data[key];
            console.log(`✅ [BACKEND] Found leads array in response.data.${key} (fallback)`);
            break;
          }
        }
      }
    }
    
    console.log('🔍 [BACKEND] Response data check:', {
      'response.data exists': !!response.data,
      'response.data type': typeof response.data,
      'Array.isArray(response.data)': Array.isArray(response.data),
      'response.data length': response.data ? response.data.length : 'N/A',
      'leadsArray found': !!leadsArray,
      'leadsArray length': leadsArray ? leadsArray.length : 'N/A'
    });
    console.log({response: response.data});
    
    if (leadsArray && Array.isArray(leadsArray)) {
      console.log('✅ [BACKEND] Processing', leadsArray.length, 'leads from API');
      for (const lead of leadsArray) {
        try {
          console.log('🔍 [BACKEND] Processing lead:', {
            uniqueQueryId: lead.UNIQUE_QUERY_ID,
            senderName: lead.SENDER_NAME,
            senderMobile: lead.SENDER_MOBILE,
            queryTime: lead.QUERY_TIME
          });

          if (!lead.UNIQUE_QUERY_ID) {
            console.log('⏭️ [BACKEND] Skipping lead - no UNIQUE_QUERY_ID');
            skippedCount++;
            continue;
          }

          // Check if lead already exists
          console.log('🔍 [BACKEND] Checking if lead already exists...');
          const existingLead = await LeadData.findOne({
            uniqueId: lead.UNIQUE_QUERY_ID,
            sourceName: 'indiamart'
          });

          if (existingLead) {
            console.log('⏭️ [BACKEND] Skipping lead - already exists:', lead.UNIQUE_QUERY_ID);
            skippedCount++;
            continue;
          }

          console.log('✅ [BACKEND] Creating new lead in universal format...');
          // Create new lead in universal format
          const newLeadData = await LeadData.create({
            userId: req.user._id,
            leadSourceId: config._id,
            sourceName: 'indiamart',
            uniqueId: lead.UNIQUE_QUERY_ID,
            contact: {
              name: lead.SENDER_NAME || '',
              email: lead.SENDER_EMAIL || '',
              phone: lead.SENDER_MOBILE || '',
              alternatePhone: lead.SENDER_MOBILE_ALT || '',
              alternateEmail: lead.SENDER_EMAIL_ALT || '',
              company: lead.SENDER_COMPANY || '',
              designation: ''
            },
            address: {
              street: lead.SENDER_ADDRESS || '',
              city: lead.SENDER_CITY || '',
              state: lead.SENDER_STATE || '',
              country: '',
              pincode: lead.SENDER_PINCODE || '',
              countryCode: lead.SENDER_COUNTRY_ISO || ''
            },
            leadDetails: {
              queryTime: new Date(lead.QUERY_TIME),
              queryType: lead.QUERY_TYPE || '',
              querySource: 'IndiaMART',
              subject: lead.SUBJECT || '',
              message: lead.QUERY_MESSAGE || '',
              productName: lead.QUERY_PRODUCT_NAME || lead.PRODUCT_NAME || '',
              category: lead.QUERY_MCAT_NAME || lead.MCATNAME || '',
              budget: '',
              quantity: '',
              unit: ''
            },
            status: 'new',
            priority: 'medium',
            rawData: lead,
            notes: `Call Duration: ${lead.CALL_DURATION || 'N/A'}, Receiver: ${lead.RECEIVER_MOBILE || 'N/A'}`
          });
          console.log('✅ [BACKEND] LeadData created:', newLeadData._id);
          
          console.log('✅ [BACKEND] Creating legacy IndiaMartLead...');
          // Also store in legacy IndiaMartLead for backward compatibility
          const newLegacyLead = await IndiaMartLead.create({
            userId: req.user._id,
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
            productName: lead.QUERY_PRODUCT_NAME || lead.PRODUCT_NAME || '',
            callDuration: lead.CALL_DURATION || '',
            receiverMobile: lead.RECEIVER_MOBILE || ''
          });
          console.log('✅ [BACKEND] Legacy IndiaMartLead created:', newLegacyLead._id);

          processedCount++;
          console.log('✅ [BACKEND] Lead processed successfully. Total processed:', processedCount);
        } catch (leadError) {
          console.error('❌ [BACKEND] Lead processing error:', leadError);
          console.error('❌ [BACKEND] Error details:', {
            message: leadError.message,
            stack: leadError.stack,
            leadData: {
              uniqueQueryId: lead.UNIQUE_QUERY_ID,
              senderName: lead.SENDER_NAME
            }
          });
          errorCount++;
        }
      }
    } else {
      console.log('⚠️ [BACKEND] No leads array found in response');
      console.log('⚠️ [BACKEND] Response data:', response.data);
    }

    console.log('📊 [BACKEND] Processing summary:', {
      processedCount,
      skippedCount,
      errorCount,
      totalPulled: leadsArray ? leadsArray.length : 0,
      responseDataExists: !!response.data,
      responseDataType: typeof response.data,
      responseDataIsArray: Array.isArray(response.data),
      leadsArrayFound: !!leadsArray,
      leadsArrayLength: leadsArray ? leadsArray.length : 0
    });

    // Update configuration
    console.log('💾 [BACKEND] Updating LeadSource configuration...');
    await LeadSource.findOneAndUpdate(
      { userId: req.user._id, name: 'indiamart' },
      {
        'metadata.lastFetchTime': now,
        'metadata.nextFetchTime': new Date(now.getTime() + (config.settings.fetchInterval * 60 * 1000)),
        'metadata.totalLeadsFetched': config.metadata.totalLeadsFetched + processedCount,
        'metadata.totalApiCalls': config.metadata.totalApiCalls + 1,
        'metadata.lastApiCallStatus': 'success',
        'metadata.lastApiCallError': null
      }
    );
    console.log('✅ [BACKEND] LeadSource configuration updated');

    // Update log entry
    console.log('📝 [BACKEND] Updating log entry...');
    await IndiaMartLog.findByIdAndUpdate(logEntry._id, {
      status: 'success',
      endTime: endTimeLog,
      duration: endTimeLog.getTime() - startTime.getTime(),
      recordsPulled: leadsArray ? leadsArray.length : 0,
      recordsProcessed: processedCount,
      recordsSkipped: skippedCount,
      recordsErrors: errorCount,
      apiResponse: {
        statusCode: response.status,
        message: 'Success',
        data: { recordCount: leadsArray ? leadsArray.length : 0 }
      }
    });
    console.log('✅ [BACKEND] Log entry updated');

    console.log(`🎉 [BACKEND] Fetch completed for user ${req.user._id}: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`);

    const totalRecords = leadsArray ? leadsArray.length : 0;
    const responseData = {
      message: 'Leads fetched successfully',
      totalRecords: totalRecords,
      processedCount,
      skippedCount,
      errorCount,
      duration: endTimeLog.getTime() - startTime.getTime()
    };
    
    console.log('🔍 [BACKEND] Final response calculation:', {
      'response.data exists': !!response.data,
      'response.data type': typeof response.data,
      'Array.isArray(response.data)': Array.isArray(response.data),
      'leadsArray found': !!leadsArray,
      'leadsArray length': leadsArray ? leadsArray.length : 'N/A',
      'calculated totalRecords': totalRecords
    });
    
    console.log('📤 [BACKEND] Sending response to frontend:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ [BACKEND] Fetch leads error:', error);
    console.error('❌ [BACKEND] Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    
    const endTimeLog = new Date();
    console.log('⏰ [BACKEND] Error occurred at:', endTimeLog);
    
    // Update config with error
    console.log('💾 [BACKEND] Updating config with error status...');
    await LeadSource.findOneAndUpdate(
      { userId: req.user._id, name: 'indiamart' },
      {
        'metadata.lastApiCallStatus': 'error',
        'metadata.lastApiCallError': error.message,
        'metadata.totalApiCalls': await LeadSource.findOne({ userId: req.user._id, name: 'indiamart' }).then(c => c ? c.metadata.totalApiCalls + 1 : 1)
      }
    );
    console.log('✅ [BACKEND] Config updated with error status');

    // Update log entry
    if (logEntry) {
      console.log('📝 [BACKEND] Updating log entry with error...');
      await IndiaMartLog.findByIdAndUpdate(logEntry._id, {
        status: 'error',
        endTime: endTimeLog,
        duration: endTimeLog.getTime() - startTime.getTime(),
        error: error.message,
        errorCode: error.response?.status?.toString() || 'UNKNOWN',
        apiResponse: {
          statusCode: error.response?.status || 0,
          message: error.message,
          data: error.response?.data || null
        }
      });
      console.log('✅ [BACKEND] Log entry updated with error');
    }

    // Handle specific error types
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid or expired CRM key' });
    } else if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (error.response?.status === 204) {
      return res.json({ message: 'No new leads found', totalRecords: 0 });
    }

    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

// Get leads with filters
const getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      dateFrom,
      dateTo,
      senderName,
      senderMobile,
      queryType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      source = 'all' // 'all' or specific source like 'indiamart'
    } = req.query;

    const filters = { userId: req.user._id } as any;
    
    // Filter by source if specified
    if (source !== 'all') {
      filters.sourceName = source;
    }
    
    if (status) filters.status = status;
    if (senderName) filters['contact.name'] = new RegExp(senderName, 'i');
    if (senderMobile) filters['contact.phone'] = new RegExp(senderMobile, 'i');
    if (queryType) filters['leadDetails.queryType'] = queryType;
    
    if (dateFrom || dateTo) {
      filters['leadDetails.queryTime'] = {};
      if (dateFrom) filters['leadDetails.queryTime'].$gte = new Date(dateFrom);
      if (dateTo) filters['leadDetails.queryTime'].$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [leads, totalCount] = await Promise.all([
      LeadData.find(filters)
        .populate('leadSourceId', 'name displayName')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      LeadData.countDocuments(filters)
    ]);

    // Transform leads to match frontend expectations
    const transformedLeads = leads.map(lead => ({
      _id: lead._id,
      uniqueQueryId: lead.uniqueId,
      queryTime: lead.leadDetails.queryTime,
      queryType: lead.leadDetails.queryType,
      queryMessage: lead.leadDetails.message,
      senderName: lead.contact.name,
      senderMobile: lead.contact.phone,
      senderEmail: lead.contact.email,
      senderCompany: lead.contact.company,
      senderAddress: lead.address.street,
      senderCity: lead.address.city,
      senderState: lead.address.state,
      senderPincode: lead.address.pincode,
      status: lead.status,
      notes: lead.notes,
      followUpDate: lead.followUpDate,
      productName: lead.leadDetails.productName,
      createdAt: lead.createdAt,
      sourceName: lead.sourceName,
      leadAge: lead.leadAge
    }));

    res.json({
      leads: transformedLeads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to get leads' });
  }
};

// Get dashboard statistics
const getDashboard = async (req, res) => {
  try {
    const config = await LeadSource.findOne({ 
      userId: req.user._id,
      name: 'indiamart'
    });
    
    if (!config) {
      return res.json({
        configured: false,
        message: 'IndiaMART not configured'
      });
    }

    // Get statistics
    const [
      totalLeads,
      todayLeads,
      weekLeads,
      monthLeads,
      statusCounts,
      recentLogs
    ] = await Promise.all([
      LeadData.countDocuments({ userId: req.user._id, sourceName: 'indiamart' }),
      LeadData.countDocuments({
        userId: req.user._id,
        sourceName: 'indiamart',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      LeadData.countDocuments({
        userId: req.user._id,
        sourceName: 'indiamart',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      LeadData.countDocuments({
        userId: req.user._id,
        sourceName: 'indiamart',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      LeadData.aggregate([
        { $match: { userId: req.user._id, sourceName: 'indiamart' } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      IndiaMartLog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate next fetch time
    const nextFetch = config.metadata.nextFetchTime || new Date(Date.now() + (config.settings.fetchInterval * 60 * 1000));
    const timeUntilNextFetch = Math.max(0, nextFetch - Date.now());

    res.json({
      configured: true,
      statistics: {
        totalLeads,
        todayLeads,
        weekLeads,
        monthLeads,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      fetchInfo: {
        lastFetch: config.metadata.lastFetchTime,
        nextFetch: nextFetch,
        timeUntilNextFetch: Math.floor(timeUntilNextFetch / 1000 / 60), // in minutes
        totalApiCalls: config.metadata.totalApiCalls,
        lastApiCallStatus: config.metadata.lastApiCallStatus,
        lastApiCallError: config.metadata.lastApiCallError
      },
      recentActivity: recentLogs
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

// Update lead status
const updateLeadStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status, notes, followUpDate } = req.body;

    const validStatuses = ['new', 'contacted', 'qualified', 'negotiation', 'converted', 'lost', 'junk'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lead = await LeadData.findOneAndUpdate(
      { _id: leadId, userId: req.user._id },
      { 
        status, 
        notes, 
        followUpDate,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Transform lead to match frontend expectations
    const transformedLead = {
      _id: lead._id,
      uniqueQueryId: lead.uniqueId,
      queryTime: lead.leadDetails.queryTime,
      queryType: lead.leadDetails.queryType,
      queryMessage: lead.leadDetails.message,
      senderName: lead.contact.name,
      senderMobile: lead.contact.phone,
      senderEmail: lead.contact.email,
      senderCompany: lead.contact.company,
      senderAddress: lead.address.street,
      senderCity: lead.address.city,
      senderState: lead.address.state,
      senderPincode: lead.address.pincode,
      status: lead.status,
      notes: lead.notes,
      followUpDate: lead.followUpDate,
      productName: lead.leadDetails.productName,
      createdAt: lead.createdAt
    };

    res.json({ message: 'Lead updated successfully', lead: transformedLead });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

// Get activity logs
const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      status,
      dateFrom,
      dateTo
    } = req.query;

    const filters = { userId: req.user._id } as any;
    
    if (action) filters.action = action;
    if (status) filters.status = status;
    
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filters.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, totalCount] = await Promise.all([
      IndiaMartLog.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      IndiaMartLog.countDocuments(filters)
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
};

// Helper function to format date time for IndiaMART API
const formatDateTime = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

export {
  getConfig,
  saveConfig,
  fetchLeads,
  getLeads,
  getDashboard,
  updateLeadStatus,
  getLogs
}; 