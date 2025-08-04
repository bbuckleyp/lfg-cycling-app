import { PrismaClient } from '@prisma/client';
import { subHours, addHours } from 'date-fns';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: number;
  eventId?: number;
  type: 'event_reminder' | 'event_updated' | 'event_cancelled' | 'new_participant' | 'participant_left';
  title: string;
  message: string;
  sendAt?: Date;
}

export interface NotificationWithEvent {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sendAt: string | null;
  sentAt: string | null;
  event: {
    id: number;
    title: string;
    eventType: string;
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
        event_id: data.eventId,
        type: data.type,
        title: data.title,
        message: data.message,
        send_at: data.sendAt,
      },
    });
  }

  async getUserNotifications(userId: number): Promise<NotificationWithEvent[]> {
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: userId,
      },
      include: {
        events: {
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
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
    });

    return notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      createdAt: notification.created_at.toISOString(),
      sendAt: notification.send_at?.toISOString() || null,
      sentAt: notification.sent_at?.toISOString() || null,
      event: notification.events ? {
        id: notification.events.id,
        title: notification.events.title,
        eventType: notification.events.event_type,
        startDate: notification.events.start_date,
        startTime: notification.events.start_time,
        startLocation: notification.events.start_location,
        organizer: {
          firstName: notification.events.users.first_name,
          lastName: notification.events.users.last_name,
        },
      } : null as any,
    }));
  }

  async getUnreadCount(userId: number): Promise<number> {
    return await prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await prisma.notifications.updateMany({
      where: {
        id: notificationId,
        user_id: userId,
      },
      data: {
        is_read: true,
      },
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }

  // Event-specific notification methods
  async notifyEventUpdated(eventId: number, organizerId: number): Promise<void> {
    // Get all participants except organizer
    const participants = await prisma.rsvps.findMany({
      where: {
        event_id: eventId,
        user_id: { not: organizerId },
        status: { in: ['going', 'maybe'] },
      },
      include: {
        events: {
          select: {
            title: true,
            event_type: true,
          },
        },
      },
    });

    for (const participant of participants) {
      await this.createNotification({
        userId: participant.user_id,
        eventId: eventId,
        type: 'event_updated',
        title: `${participant.events.event_type === 'race' ? 'Race' : 'Ride'} Updated`,
        message: `"${participant.events.title}" has been updated by the organizer.`,
      });
    }
  }

  async notifyEventCancelled(eventId: number, organizerId: number): Promise<void> {
    // Get all participants except organizer
    const participants = await prisma.rsvps.findMany({
      where: {
        event_id: eventId,
        user_id: { not: organizerId },
        status: { in: ['going', 'maybe'] },
      },
      include: {
        events: {
          select: {
            title: true,
            event_type: true,
          },
        },
      },
    });

    for (const participant of participants) {
      await this.createNotification({
        userId: participant.user_id,
        eventId: eventId,
        type: 'event_cancelled',
        title: `${participant.events.event_type === 'race' ? 'Race' : 'Ride'} Cancelled`,
        message: `"${participant.events.title}" has been cancelled by the organizer.`,
      });
    }
  }

  async notifyNewEventParticipant(eventId: number, organizerId: number, participantName: string): Promise<void> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { title: true, event_type: true },
    });

    if (event) {
      await this.createNotification({
        userId: organizerId,
        eventId: eventId,
        type: 'new_participant',
        title: `New ${event.event_type === 'race' ? 'Race' : 'Ride'} Participant`,
        message: `${participantName} has joined "${event.title}".`,
      });
    }
  }

  async notifyEventParticipantLeft(eventId: number, organizerId: number, participantName: string): Promise<void> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: { title: true, event_type: true },
    });

    if (event) {
      await this.createNotification({
        userId: organizerId,
        eventId: eventId,
        type: 'participant_left',
        title: `${event.event_type === 'race' ? 'Race' : 'Ride'} Participant Left`,
        message: `${participantName} has left "${event.title}".`,
      });
    }
  }

  async scheduleEventReminders(): Promise<void> {
    // Find events starting in 24 hours that don't have reminders scheduled yet
    const tomorrow = addHours(new Date(), 24);
    const reminderWindow = subHours(tomorrow, 1); // 1 hour window

    const events = await prisma.events.findMany({
      where: {
        start_date: {
          gte: reminderWindow,
          lte: addHours(reminderWindow, 2),
        },
        status: 'active',
      },
      include: {
        rsvps: {
          where: {
            status: { in: ['going', 'maybe'] },
          },
          select: {
            user_id: true,
          },
        },
      },
    });

    for (const event of events) {
      // Check if reminders already exist
      const existingReminders = await prisma.notifications.count({
        where: {
          event_id: event.id,
          type: 'event_reminder',
        },
      });

      if (existingReminders === 0) {
        // Schedule reminders for all participants
        for (const rsvp of event.rsvps) {
          const reminderTime = subHours(new Date(`${event.start_date.toISOString().split('T')[0]}T${event.start_time.toISOString().split('T')[1]}`), 24);
          
          await this.createNotification({
            userId: rsvp.user_id,
            eventId: event.id,
            type: 'event_reminder',
            title: `${event.event_type === 'race' ? 'Race' : 'Ride'} Reminder`,
            message: `Don't forget about "${event.title}" tomorrow at ${event.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            sendAt: reminderTime,
          });
        }
      }
    }
  }

  async processPendingNotifications(): Promise<void> {
    const pendingNotifications = await prisma.notifications.findMany({
      where: {
        send_at: {
          lte: new Date(),
        },
        sent_at: null,
      },
    });

    for (const notification of pendingNotifications) {
      // Mark as sent (in a real app, you'd send via email/push notification here)
      await prisma.notifications.update({
        where: { id: notification.id },
        data: { sent_at: new Date() },
      });
    }
  }
}

export const notificationService = new NotificationService();