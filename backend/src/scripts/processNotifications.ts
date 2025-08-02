import { notificationService } from '../services/notificationService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Background process to handle notification management:
 * 1. Create ride reminders for upcoming rides
 * 2. Send pending notifications
 * 
 * This script should be run via cron job every hour or so.
 */
async function processNotifications() {
  console.log('🔔 Starting notification processing...');
  
  try {
    // Create reminders for upcoming rides
    console.log('📅 Creating ride reminders...');
    await notificationService.createUpcomingRideReminders();
    console.log('✅ Ride reminders created');

    // Send pending notifications
    console.log('📤 Sending pending notifications...');
    const sentCount = await notificationService.sendPendingNotifications();
    console.log(`✅ Sent ${sentCount} notifications`);

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