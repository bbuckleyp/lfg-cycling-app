import { PrismaClient } from '@prisma/client';
import { subHours, addHours } from 'date-fns';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  user_id: number;
  ride_id: number;
  type: 'ride_reminder' | 'ride_updated' | 'ride_cancelled' | 'new_participant' | 'participant_left';
  title: string;
  message: string;
  sendAt?: Date;
}

export interface NotificationWithRide {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  send_at: Date | null;
  sent_at: Date | null;
  ride: {
    id: number;
    title: string;
    startDate: Date;
    startTime: Date;
    startLocation: string;
    organizer: {
      firstName: string;
      lastName: string;
    };
  };
}

class NotificationService {
  async createNotification(data: CreateNotificationData) {
    return await prisma.notifications.create({
      data: {
        user_id: data.userId,
        ride_id: data.rideId,
        type: data.type,
        title: data.title,
        message: data.message,
        send_at: data.sendAt,
      },
    });
  }

  async getUserNotifications(userId: number, limit = 50, offset = 0): Promise<NotificationWithRide[]> {
    return await prisma.notifications.findMany({
      where: { user_id: userId },
      include: {
        ride: {
          include: {
            users: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    return await prisma.notifications.updateMany({
      where: {
        id: notificationId,
        user_id: userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        is_read: true,
      },
    });
  }

  async markAllAsRead(userId: number) {
    return await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }

  async scheduleRideReminder(rideId: number, userIds: number[], reminderTime: Date) {
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const notifications = userIds.map(userId => ({
      user_id: userId,
      ride_id: rideId,
      type: 'ride_reminder' as const,
      title: `Ride Reminder: ${ride.title}`,
      message: `Don't forget about the ride "${ride.title}" organized by ${ride.users.first_name} ${ride.users.last_name} tomorrow at ${ride.start_time}!`,
      send_at: reminderTime,
    }));

    return await prisma.notifications.createMany({
      data: notifications,
    });
  }

  async notifyRideUpdated(rideId: number, userIds: number[], changes: string[]) {
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const changesText = changes.join(', ');
    const notifications = userIds.map(userId => ({
      user_id: userId,
      ride_id: rideId,
      type: 'ride_updated' as const,
      title: `Ride Updated: ${ride.title}`,
      message: `The ride "${ride.title}" has been updated. Changes: ${changesText}`,
    }));

    return await prisma.notifications.createMany({
      data: notifications,
    });
  }

  async notifyRideCancelled(rideId: number, userIds: number[]) {
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const notifications = userIds.map(userId => ({
      user_id: userId,
      ride_id: rideId,
      type: 'ride_cancelled' as const,
      title: `Ride Cancelled: ${ride.title}`,
      message: `Unfortunately, the ride "${ride.title}" organized by ${ride.users.first_name} ${ride.users.last_name} has been cancelled.`,
    }));

    return await prisma.notifications.createMany({
      data: notifications,
    });
  }

  async notifyNewParticipant(rideId: number, organizerId: number, participantName: string) {
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
      select: { title: true },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    return await this.createNotification({
      user_id: organizerId,
      ride_id: rideId,
      type: 'new_participant',
      title: `New Participant: ${ride.title}`,
      message: `${participantName} has joined your ride "${ride.title}"!`,
    });
  }

  async notifyParticipantLeft(rideId: number, organizerId: number, participantName: string) {
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
      select: { title: true },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    return await this.createNotification({
      user_id: organizerId,
      ride_id: rideId,
      type: 'participant_left',
      title: `Participant Left: ${ride.title}`,
      message: `${participantName} has left your ride "${ride.title}".`,
    });
  }

  // Background job to create ride reminders for upcoming rides
  async createUpcomingRideReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Find rides happening tomorrow that don't already have reminders
    const upcomingRides = await prisma.rides.findMany({
      where: {
        startDate: {
          gte: tomorrow,
          lt: dayAfter,
        },
        status: 'active',
        // Only rides that don't already have reminders scheduled
        notifications: {
          none: {
            type: 'ride_reminder',
            send_at: {
              not: null,
            },
          },
        },
      },
      include: {
        rsvps: {
          where: {
            status: 'going',
          },
          include: {
            user: true,
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    for (const ride of upcomingRides) {
      // Schedule reminder for 24 hours before ride
      const reminderTime = subHours(new Date(`${ride.startDate}T${ride.startTime}`), 24);
      
      // Only schedule if the reminder time is in the future
      if (reminderTime > new Date()) {
        const participantIds = ride.rsvps.map(rsvp => rsvp.userId);
        
        // Include organizer in reminders
        if (!participantIds.includes(ride.usersId)) {
          participantIds.push(ride.usersId);
        }

        if (participantIds.length > 0) {
          await this.scheduleRideReminder(ride.id, participantIds, reminderTime);
        }
      }
    }
  }

  // Send pending notifications (would be called by a cron job)
  async sendPendingNotifications() {
    const now = new Date();
    
    const pendingNotifications = await prisma.notifications.findMany({
      where: {
        send_at: {
          lte: now,
        },
        sent_at: null,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
        ride: {
          select: {
            title: true,
            startDate: true,
            startTime: true,
          },
        },
      },
    });

    for (const notification of pendingNotifications) {
      try {
        // In a real app, you would send email/push notification here
        console.log(`Sending notification to ${notification.user.email}:`, {
          title: notification.title,
          message: notification.message,
        });

        // Mark as sent
        await prisma.notifications.update({
          where: { id: notification.id },
          data: { sent_at: now },
        });
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
      }
    }

    return pendingNotifications.length;
  }
}

export const notificationService = new NotificationService();