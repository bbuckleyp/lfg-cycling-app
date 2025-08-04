import { PrismaClient, EventType, Pace, EventStatus } from '@prisma/client';
import { CreateEventRequest, UpdateEventRequest, Event, EventWithDetails, EventFilters } from '../types/event';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

export class EventService {
  async createEvent(organizerId: number, data: CreateEventRequest): Promise<Event> {
    // Create route if Strava route data is provided
    let routeId = data.routeId;
    if (data.stravaRouteData && !routeId) {
      const route = await prisma.routes.create({
        data: {
          strava_route_id: BigInt(data.stravaRouteData.stravaRouteId),
          name: data.stravaRouteData.name,
          distance_meters: Math.round(data.stravaRouteData.distance),
          elevation_gain_meters: Math.round(data.stravaRouteData.elevationGain),
          estimated_moving_time: Math.round(data.stravaRouteData.estimatedTime),
        },
      });
      routeId = route.id;
    }

    const event = await prisma.events.create({
      data: {
        event_type: data.eventType as EventType,
        organizer_id: organizerId,
        route_id: routeId,
        title: data.title,
        description: data.description,
        start_date: new Date(data.startDate),
        start_time: new Date(`1970-01-01T${data.startTime}:00.000Z`),
        start_location: data.startLocation,
        pace: data.pace as Pace,
        is_public: data.isPublic ?? true,
        distance_meters: data.distanceMeters,
        elevation_gain_meters: data.elevationGainMeters,
      },
    });

    return this.formatEvent(event);
  }

  async getEventById(eventId: number, userId?: number): Promise<EventWithDetails> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
        routes: {
          select: {
            id: true,
            strava_route_id: true,
            name: true,
            description: true,
            distance_meters: true,
            elevation_gain_meters: true,
            polyline: true,
            map_image_url: true,
            estimated_moving_time: true,
            difficulty_level: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: { status: 'going' },
            },
            comments: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Get user's RSVP status if userId provided
    let userRsvpStatus: 'going' | 'maybe' | 'not_going' | undefined;
    if (userId) {
      const userRsvp = await prisma.rsvps.findUnique({
        where: {
          event_id_user_id: {
            event_id: eventId,
            user_id: userId,
          },
        },
      });
      userRsvpStatus = userRsvp?.status as 'going' | 'maybe' | 'not_going' | undefined;
    }

    return this.formatEventWithDetails(event, userRsvpStatus);
  }

  async getAllEvents(filters: EventFilters = {}): Promise<{ events: EventWithDetails[]; total: number; page: number; totalPages: number }> {
    const {
      eventType,
      search,
      pace,
      status = 'active',
      startDate,
      endDate,
      organizerId,
      isPublic,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: status as EventStatus,
    };

    if (eventType) {
      where.event_type = eventType as EventType;
    }

    if (pace) {
      where.pace = pace as Pace;
    }

    if (organizerId) {
      where.organizer_id = organizerId;
    }

    if (isPublic !== undefined) {
      where.is_public = isPublic;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { start_location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.start_date = {};
      if (startDate) {
        where.start_date.gte = new Date(startDate);
      }
      if (endDate) {
        where.start_date.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.events.count({ where });

    // Get events
    const events = await prisma.events.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
        routes: {
          select: {
            id: true,
            strava_route_id: true,
            name: true,
            description: true,
            distance_meters: true,
            elevation_gain_meters: true,
            polyline: true,
            map_image_url: true,
            estimated_moving_time: true,
            difficulty_level: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: { status: 'going' },
            },
            comments: true,
          },
        },
      },
      orderBy: [
        { start_date: 'asc' },
        { start_time: 'asc' },
      ],
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      events: events.map(event => this.formatEventWithDetails(event)),
      total,
      page,
      totalPages,
    };
  }

  async getUserEvents(userId: number, filters: EventFilters = {}): Promise<EventWithDetails[]> {
    const events = await prisma.events.findMany({
      where: {
        organizer_id: userId,
        event_type: filters.eventType as EventType,
        status: (filters.status as EventStatus) || 'active',
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
          },
        },
        routes: {
          select: {
            id: true,
            strava_route_id: true,
            name: true,
            description: true,
            distance_meters: true,
            elevation_gain_meters: true,
            polyline: true,
            map_image_url: true,
            estimated_moving_time: true,
            difficulty_level: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: { status: 'going' },
            },
            comments: true,
          },
        },
      },
      orderBy: [
        { start_date: 'asc' },
        { start_time: 'asc' },
      ],
    });

    return events.map(event => this.formatEventWithDetails(event));
  }

  async updateEvent(eventId: number, organizerId: number, data: UpdateEventRequest): Promise<Event> {
    // Check if event exists and user is organizer
    const existingEvent = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error('Event not found');
    }

    if (existingEvent.organizer_id !== organizerId) {
      throw new Error('Only the organizer can update this event');
    }

    // Create route if Strava route data is provided
    let routeId = data.routeId;
    if (data.stravaRouteData && !routeId) {
      const route = await prisma.routes.create({
        data: {
          strava_route_id: BigInt(data.stravaRouteData.stravaRouteId),
          name: data.stravaRouteData.name,
          distance_meters: Math.round(data.stravaRouteData.distance),
          elevation_gain_meters: Math.round(data.stravaRouteData.elevationGain),
          estimated_moving_time: Math.round(data.stravaRouteData.estimatedTime),
        },
      });
      routeId = route.id;
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.start_date = new Date(data.startDate);
    if (data.startTime !== undefined) updateData.start_time = new Date(`1970-01-01T${data.startTime}:00.000Z`);
    if (data.startLocation !== undefined) updateData.start_location = data.startLocation;
    if (data.pace !== undefined) updateData.pace = data.pace as Pace;
    if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
    if (data.status !== undefined) updateData.status = data.status as EventStatus;
    if (routeId !== undefined) updateData.route_id = routeId;
    if (data.distanceMeters !== undefined) updateData.distance_meters = data.distanceMeters;
    if (data.elevationGainMeters !== undefined) updateData.elevation_gain_meters = data.elevationGainMeters;

    const updatedEvent = await prisma.events.update({
      where: { id: eventId },
      data: updateData,
    });

    // Send notifications to participants about the update
    try {
      await notificationService.notifyEventUpdated(eventId, organizerId);
    } catch (error) {
      console.error('Error sending event update notification:', error);
    }

    return this.formatEvent(updatedEvent);
  }

  async cancelEvent(eventId: number, organizerId: number): Promise<Event> {
    const event = await this.updateEvent(eventId, organizerId, { status: 'cancelled' });

    // Send cancellation notifications
    try {
      await notificationService.notifyEventCancelled(eventId, organizerId);
    } catch (error) {
      console.error('Error sending event cancellation notification:', error);
    }

    return event;
  }

  async deleteEvent(eventId: number, organizerId: number): Promise<void> {
    // Check if event exists and user is organizer
    const existingEvent = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error('Event not found');
    }

    if (existingEvent.organizer_id !== organizerId) {
      throw new Error('Only the organizer can delete this event');
    }

    await prisma.events.delete({
      where: { id: eventId },
    });
  }

  private formatEvent(event: any): Event {
    return {
      id: event.id,
      eventType: event.event_type,
      organizerId: event.organizer_id,
      routeId: event.route_id,
      title: event.title,
      description: event.description,
      startDate: event.start_date.toISOString().split('T')[0],
      startTime: event.start_time.toTimeString().slice(0, 5),
      startLocation: event.start_location,
      pace: event.pace,
      isPublic: event.is_public,
      status: event.status,
      distanceMeters: event.distance_meters,
      elevationGainMeters: event.elevation_gain_meters,
      createdAt: event.created_at.toISOString(),
      updatedAt: event.updated_at.toISOString(),
    };
  }

  private formatEventWithDetails(event: any, userRsvpStatus?: 'going' | 'maybe' | 'not_going'): EventWithDetails {
    return {
      ...this.formatEvent(event),
      organizer: {
        id: event.users.id,
        firstName: event.users.first_name,
        lastName: event.users.last_name,
        profilePhotoUrl: event.users.profile_photo_url || undefined,
      },
      route: event.routes ? {
        id: event.routes.id,
        stravaRouteId: event.routes.strava_route_id.toString(),
        name: event.routes.name,
        description: event.routes.description || undefined,
        distanceMeters: event.routes.distance_meters,
        elevationGainMeters: event.routes.elevation_gain_meters || undefined,
        polyline: event.routes.polyline || undefined,
        mapImageUrl: event.routes.map_image_url || undefined,
        estimatedMovingTime: event.routes.estimated_moving_time || undefined,
        difficultyLevel: event.routes.difficulty_level || undefined,
      } : undefined,
      rsvpCount: event._count.rsvps,
      commentCount: event._count.comments,
      userRsvpStatus,
    };
  }
}

export const eventService = new EventService();