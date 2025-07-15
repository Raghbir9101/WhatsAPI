#!/usr/bin/env node

import { connectDB } from '../config/database';
import { runSeed } from '../utils/seed';

// Run seed script
const main = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    await runSeed();
    
    console.log('✅ Seed script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  }
};

main(); 