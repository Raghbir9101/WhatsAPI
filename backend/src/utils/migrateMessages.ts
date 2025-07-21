import { Message } from '../models';

export async function migrateMessagesSource() {
  try {
    console.log('Starting message source migration...');
    
    // Update all messages without a source field to have 'frontend' as default
    const result = await Message.updateMany(
      { source: { $exists: false } },
      { $set: { source: 'frontend' } }
    );
    
    console.log(`Migration completed: Updated ${result.modifiedCount} messages with default source 'frontend'`);
    
    return result;
  } catch (error) {
    console.error('Error during message migration:', error);
    throw error;
  }
} 