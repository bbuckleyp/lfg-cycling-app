import { notificationService } from '../services/notificationService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Background process to handle notification management:
 * 1. Create event reminders for upcoming events
 * 2. Send pending notifications
 * 
 * This script should be run via cron job every hour or so.
 */
async function processNotifications() {
  console.log('🔔 Starting notification processing...');
  
  try {
    // Create reminders for upcoming events
    console.log('📅 Creating event reminders...');
    await notificationService.scheduleEventReminders();
    console.log('✅ Event reminders created');

    // Send pending notifications
    console.log('📤 Sending pending notifications...');
    await notificationService.processPendingNotifications();
    console.log('✅ Pending notifications processed');

    console.log('🎉 Notification processing completed successfully');
  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  processNotifications()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { processNotifications };