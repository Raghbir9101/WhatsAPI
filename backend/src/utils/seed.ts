import { User, Package } from '../models';
import bcrypt from 'bcrypt';
import { generateApiKey } from './helpers';

// Seed default packages
const seedPackages = async () => {
  try {
    const existingPackages = await Package.countDocuments();
    
    if (existingPackages === 0) {
      const defaultPackages = [
        {
          name: 'BASIC',
          credits: 5000,
          price: 99,
          validityDays: 30,
          features: ['5,000 messages', '1 WhatsApp number', 'Basic support'],
          isActive: true
        },
        {
          name: 'PREMIUM',
          credits: 15000,
          price: 199,
          validityDays: 30,
          features: ['15,000 messages', '5 WhatsApp numbers', 'Priority support', 'Analytics'],
          isActive: true
        },
        {
          name: 'ENTERPRISE',
          credits: 50000,
          price: 499,
          validityDays: 30,
          features: ['50,000 messages', 'Unlimited WhatsApp numbers', '24/7 support', 'Advanced analytics', 'API access'],
          isActive: true
        }
      ];

      await Package.insertMany(defaultPackages);
      console.log('✅ Default packages seeded successfully');
    } else {
      console.log('📦 Packages already exist, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding packages:', error);
  }
};

// Seed admin user
const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const apiKey = generateApiKey();
      
      const adminUser = new User({
        email: 'admin@ceoitbox.com',
        name: 'Admin User',
        company: 'CEOITBOX',
        password: hashedPassword,
        apiKey,
        role: 'ADMIN',
        packageType: 'ENTERPRISE',
        creditsTotal: 100000,
        creditsUsed: 0,
        validityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        status: 'ACTIVE'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
      console.log('📧 Admin email: admin@ceoitbox.com');
      console.log('🔑 Admin password: admin123');
      console.log('🚨 Please change the admin password after first login!');
    } else {
      console.log('👤 Admin user already exists, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
};

// Main seed function
const runSeed = async () => {
  console.log('🌱 Starting database seeding...');
  
  await seedPackages();
  await seedAdminUser();
  
  console.log('🎉 Database seeding completed!');
};

export { runSeed, seedPackages, seedAdminUser }; 