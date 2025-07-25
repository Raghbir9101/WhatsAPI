import { User, Package, WhatsAppInstance, Message, BulkCampaign, AssignedPackages, Usage } from '../models';
import { Request, Response } from 'express';

// Get admin statistics
const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [
      totalClients,
      activeClients,
      expiredClients,
      suspendedClients,
      totalCreditsIssued,
      totalCreditsUsed,
      totalMessagesSent,
      totalWhatsAppInstances,
      connectedWhatsAppInstances,
      totalCampaigns
    ] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'USER', status: 'ACTIVE' }),
      User.countDocuments({ role: 'USER', status: 'EXPIRED' }),
      User.countDocuments({ role: 'USER', status: 'SUSPENDED' }),
      User.aggregate([
        { $match: { role: 'USER' } },
        { $group: { _id: null, total: { $sum: '$creditsTotal' } } }
      ]),
      User.aggregate([
        { $match: { role: 'USER' } },
        { $group: { _id: null, total: { $sum: '$creditsUsed' } } }
      ]),
      User.aggregate([
        { $match: { role: 'USER' } },
        { $group: { _id: null, total: { $sum: '$messagesSent' } } }
      ]),
      WhatsAppInstance.countDocuments(),
      WhatsAppInstance.countDocuments({ isActive: true, status: 'ready' }),
      BulkCampaign.countDocuments()
    ]);
    // Get real-time connected instances from WhatsAppManager
    const { whatsappManager } = req.app.locals;
    let activeConnectedInstances = 0;
    
    if (whatsappManager) {
      // Get all instances and check their real-time status
      const allInstances = await WhatsAppInstance.find({ isActive: true });
      for (const instance of allInstances) {
        const status = whatsappManager.getClientStatus(instance.userId, instance.instanceId);
        if (status === 'ready' || status === 'authenticated') {
          activeConnectedInstances++;
        }
      }
    } else {
      // Fallback to database status if manager not available
      activeConnectedInstances = connectedWhatsAppInstances;
    }

    // Calculate monthly revenue (simplified calculation)
    const packages = await Package.find({ isActive: true });
    const monthlyRevenue = activeClients * 199; // Simplified calculation

    // New clients this month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const newClientsThisMonth = await User.countDocuments({
      role: 'USER',
      createdAt: { $gte: lastMonth }
    });

    res.json({
      totalClients,
      activeClients,
      expiredClients,
      suspendedClients,
      totalCreditsIssued: totalCreditsIssued[0]?.total || 0,
      totalCreditsUsed: totalCreditsUsed[0]?.total || 0,
      totalMessagesSent: totalMessagesSent[0]?.total || 0,
      totalWhatsAppInstances,
      connectedWhatsAppInstances: activeConnectedInstances,
      totalCampaigns,
      monthlyRevenue,
      newClientsThisMonth
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin statistics' });
  }
};

// Get all clients
const getClients = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query: any = { role: 'USER' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalClients = await User.countDocuments(query);

    // Get users without population since assignedPackages uses userId reference
    const clients = await User.find(query)
      .select('-password -apiKey')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .exec();
      
    // Manually fetch assignedPackages for each user since the relationship is userId-based
    const clientsWithPackages = await Promise.all(
      clients.map(async (client) => {
        const assignedPackages = await AssignedPackages.find({ _id: { $in: client.assignedPackages } })
          .populate('package')
          .exec();
        
        return {
          ...client.toObject(),
          assignedPackages
        };
      })
    );

    // Get WhatsApp instances count for each client
    const clientsWithInstances = await Promise.all(
      clientsWithPackages.map(async (client) => {
        const whatsappInstances = await WhatsAppInstance.countDocuments({ userId: client._id });
        
        // Find the current active package
        const currentPackage = await AssignedPackages.findOne({
          _id: { $in: client.assignedPackages },
          lastDate: { $gte: new Date() }
        }).populate('package');

        // Calculate credits remaining by counting usage entries for the current package
        const creditsUsed = currentPackage 
          ? await Usage.countDocuments({ 
              userId: client._id, 
              assignedPackage: currentPackage._id 
            }) 
          : 0;

        const creditsTotal = currentPackage ? (currentPackage.package as any).credits : 0;
        const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);

        return {
          id: client._id,
          email: client.email,
          name: client.name,
          company: client.company,
          packageType: client.packageType,
          validityDate: client.validityDate.toISOString().split('T')[0],
          creditsTotal,
          creditsUsed,
          creditsRemaining,
          messagesSent: client.messagesSent,
          status: client.status,
          createdAt: client.createdAt.toISOString().split('T')[0],
          lastLogin: client.lastLogin.toISOString().split('T')[0],
          whatsappInstances,
          assignedPackages: (client.assignedPackages)
        };
      })
    );

    res.json({
      clients: clientsWithInstances,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalClients,
        pages: Math.ceil(totalClients / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to retrieve clients' });
  }
};

// loop through all users, create a new assignedPackages with package of id: 6870f43c564218b06c96fff2, retrieve it's _id and save it in user's assignedPackage array of object ids
// async function looper(){
//   const allUsers = await User.find({})
//   const packages = await Package.findById("6870f43c564218b06c96fff2")
//   let today = new Date()
//   //add package validity days to today's date i.e if 256 days then add 256 days to today's date
//   let lastDate = new Date(today.getTime() + packages.validityDays * 24 * 60 * 60 * 1000)
//   console.log(lastDate)
//   allUsers.map(async (el)=>{
//     let user = el
//     const newPackage = new AssignedPackages({
//       package:"6870f43c564218b06c96fff2",
//       lastDate:lastDate
//     })
//     const obj = await newPackage.save();
//     user.assignedPackages = [obj._id];
//     await user.save();
//   })
// }
// looper()

// Get client by ID
const getClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await User.findById(id).select('-password -apiKey');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const whatsappInstances = await WhatsAppInstance.countDocuments({ userId: client._id });

    // Find the current active package
    const currentPackage = await AssignedPackages.findOne({
      _id: { $in: client.assignedPackages },
      lastDate: { $gte: new Date() }
    }).populate('package');

    // Calculate credits remaining by counting usage entries for the current package
    const creditsUsed = currentPackage 
      ? await Usage.countDocuments({ 
          userId: client._id, 
          assignedPackage: currentPackage._id 
        }) 
      : 0;

    const creditsTotal = currentPackage ? (currentPackage.package as any).credits : 0;
    const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);

    res.json({
      id: client._id,
      email: client.email,
      name: client.name,
      company: client.company,
      package: client.packageType,
      validityDate: client.validityDate.toISOString().split('T')[0],
      creditsTotal,
      creditsUsed,
      creditsRemaining,
      messagesSent: client.messagesSent,
      status: client.status,
      createdAt: client.createdAt.toISOString().split('T')[0],
      lastLogin: client.lastLogin.toISOString().split('T')[0],
      whatsappInstances
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to retrieve client' });
  }
};

// Update client status
const updateClientStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'EXPIRED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password -apiKey');

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client status updated successfully', client });
  } catch (error) {
    console.error('Update client status error:', error);
    res.status(500).json({ error: 'Failed to update client status' });
  }
};

// Extend client validity
const extendClientValidity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    if (!days || days <= 0) {
      return res.status(400).json({ error: 'Valid number of days required' });
    }

    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const newValidityDate = new Date(client.validityDate);
    newValidityDate.setDate(newValidityDate.getDate() + Number(days));

    await User.findByIdAndUpdate(id, { validityDate: newValidityDate });

    res.json({ message: 'Client validity extended successfully' });
  } catch (error) {
    console.error('Extend client validity error:', error);
    res.status(500).json({ error: 'Failed to extend client validity' });
  }
};

// Add credits to client
const addCredits = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { credits } = req.body;

    if (!credits || credits <= 0) {
      return res.status(400).json({ error: 'Valid number of credits required' });
    }

    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await User.findByIdAndUpdate(id, {
      $inc: { creditsTotal: Number(credits) }
    });

    res.json({ message: 'Credits added successfully' });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
};

// Get all packages
const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    res.json(packages);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Failed to retrieve packages' });
  }
};

// Create package
const createPackage = async (req: Request, res: Response) => {
  try {
    const { name, credits, price, validityDays, features } = req.body;

    const packageData = new Package({
      name,
      credits,
      price,
      validityDays,
      features
    });

    await packageData.save();

    res.status(201).json({ message: 'Package created successfully', package: packageData });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
};

// Update package
const updatePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, credits, price, validityDays, features } = req.body;

    const packageData = await Package.findByIdAndUpdate(
      id,
      { name, credits, price, validityDays, features },
      { new: true }
    );

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ message: 'Package updated successfully', package: packageData });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
};

// Delete package
const deletePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const packageData = await Package.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!packageData) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
};

// Get system settings
const getSystemSettings = async (req: Request, res: Response) => {
  try {
    // This is a simplified version - in a real app, you'd store these in a settings model
    const settings = {
      platformName: 'CEOITBOX WhatsApp Connector',
      supportEmail: 'support@ceoitbox.com',
      maxInstancesPerUser: 10,
      maintenanceMode: false,
      emailNotifications: true,
      smsNotifications: false,
      twoFactorAuth: false,
      ipRestriction: false,
      sessionTimeout: 60,
      allowedIps: [],
      smtpHost: '',
      smtpPort: 587,
      smtpEncryption: 'TLS',
      smtpUsername: '',
      smtpPassword: '',
      rateLimitPerHour: 1000,
      apiRateLimitPerMinute: 60
    };

    res.json(settings);
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve system settings' });
  }
};

// Update system settings
const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    
    // In a real app, you'd save these to a settings model
    // For now, we'll just return success
    
    res.json({ message: 'System settings updated successfully' });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
};

// Assign package to client
const assignPackageToClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { packageId } = req.body;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Find the package
    const packageToAssign = await Package.findById(packageId);
    if (!packageToAssign) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Create a new AssignedPackage
    const today = new Date();
    const lastDate = new Date(today.getTime() + packageToAssign.validityDays * 24 * 60 * 60 * 1000);

    const newAssignedPackage = new AssignedPackages({
      package: packageId,
      lastDate: lastDate
    });

    // Save the new assigned package
    const savedAssignedPackage = await newAssignedPackage.save();

    // Add the new assigned package to user's assignedPackages
    user.assignedPackages.push(savedAssignedPackage._id);
    await user.save();

    res.json({ 
      message: 'Package assigned successfully',
      assignedPackage: savedAssignedPackage
    });
  } catch (error) {
    console.error('Assign package to client error:', error);
    res.status(500).json({ error: 'Failed to assign package to client' });
  }
};

export {
  getAdminStats,
  getClients,
  getClient,
  updateClientStatus,
  extendClientValidity,
  addCredits,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getSystemSettings,
  updateSystemSettings,
  assignPackageToClient
}; 