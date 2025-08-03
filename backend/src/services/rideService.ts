import { PrismaClient } from '@prisma/client';
import { CreateRideRequest, UpdateRideRequest, RideWithDetails } from '../types/ride';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

export class RideService {
  async createRide(organizer_id: number, data: CreateRideRequest) {
    let routeId = data.routeId;

    // Handle existing route validation
    if (data.routeId) {
      const route = await prisma.routes.findUnique({
        where: { id: data.routeId },
      });
      if (!route) {
        throw new Error('Route not found');
      }
    }

    // Handle Strava route data - create route if provided
    if (data.stravaRouteData) {
      // Check if route already exists based on stravaRouteId
      const existingRoute = await prisma.routes.findUnique({
        where: { stravaRouteId: BigInt(data.stravaRouteData.stravaRouteId) },
      });

      if (existingRoute) {
        routeId = existingRoute.id;
      } else {
        // Create new route from Strava data
        const newRoute = await prisma.routes.create({
          data: {
            stravaRouteId: BigInt(data.stravaRouteData.stravaRouteId),
            name: data.stravaRouteData.name,
            distanceMeters: Math.round(data.stravaRouteData.distance),
            elevationGainMeters: Math.round(data.stravaRouteData.elevationGain),
            estimatedMovingTime: data.stravaRouteData.estimatedTime,
          },
        });
        routeId = newRoute.id;
      }
    }

    // Create the ride
    const ride = await prisma.rides.create({
      data: {
        organizer_id: organizer_id,
        routeId,
        title: data.title,
        description: data.description,
        start_date: new Date(data.startDate),
        start_time: new Date(`1970-01-01T${data.startTime}:00.000Z`),
        start_location: data.startLocation,
        pace: data.pace,
        is_public: data.isPublic ?? true,
        distance_meters: data.distanceMeters,
        elevation_gain_meters: data.elevationGainMeters,
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
            distance_meters: true,
            elevation_gain_meters: true,
            polyline: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: {
                status: 'going',
              },
            },
          },
        },
      },
    });

    return {
      id: ride.id,
      title: ride.title,
      description: ride.description,
      startLocation: ride.start_location,
      pace: ride.pace,
      isPublic: ride.is_public,
      status: ride.status,
      organizerId: ride.organizer_id,
      distanceMeters: ride.distance_meters,
      elevationGainMeters: ride.elevation_gain_meters,
      organizer: ride.users ? {
        id: ride.users.id,
        firstName: ride.users.first_name,
        lastName: ride.users.last_name,
        profilePhotoUrl: ride.users.profile_photo_url,
      } : undefined,
      route: ride.routes ? {
        id: ride.routes.id,
        name: ride.routes.name,
        distanceMeters: ride.routes.distance_meters,
        elevationGainMeters: ride.routes.elevation_gain_meters,
        polyline: ride.routes.polyline,
        stravaRouteId: ride.routes.strava_route_id ? ride.routes.strava_route_id.toString() : null,
      } : undefined,
      startDate: ride.start_date.toISOString().split('T')[0],
      startTime: ride.start_time.toTimeString().slice(0, 5),
      createdAt: ride.created_at.toISOString(),
      updatedAt: ride.updated_at.toISOString(),
      rsvpCount: ride._count.rsvps,
    };
  }

  async getRideById(rideId: number, userId?: number): Promise<RideWithDetails> {
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
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
            distance_meters: true,
            elevation_gain_meters: true,
            polyline: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: {
                status: 'going',
              },
            },
          },
        },
        rsvps: userId ? {
          where: {
            user_id: userId,
          },
          select: {
            status: true,
          },
        } : false,
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const userRsvp = userId && Array.isArray(ride.rsvps) && ride.rsvps[0];

    return {
      id: ride.id,
      title: ride.title,
      description: ride.description,
      startLocation: ride.start_location,
      pace: ride.pace,
      isPublic: ride.is_public,
      status: ride.status,
      organizerId: ride.organizer_id,
      distanceMeters: ride.distance_meters,
      elevationGainMeters: ride.elevation_gain_meters,
      organizer: ride.users ? {
        id: ride.users.id,
        firstName: ride.users.first_name,
        lastName: ride.users.last_name,
        profilePhotoUrl: ride.users.profile_photo_url,
      } : undefined,
      route: ride.routes ? {
        id: ride.routes.id,
        name: ride.routes.name,
        distanceMeters: ride.routes.distance_meters,
        elevationGainMeters: ride.routes.elevation_gain_meters,
        polyline: ride.routes.polyline,
        stravaRouteId: ride.routes.strava_route_id ? ride.routes.strava_route_id.toString() : null,
      } : undefined,
      startDate: ride.start_date.toISOString().split('T')[0],
      startTime: ride.start_time.toTimeString().slice(0, 5),
      createdAt: ride.created_at.toISOString(),
      updatedAt: ride.updated_at.toISOString(),
      rsvpCount: ride._count.rsvps,
      userRsvpStatus: userRsvp?.status as 'going' | 'maybe' | 'not_going' | undefined,
    };
  }

  async getAllRides(page = 1, limit = 20, userId?: number, searchQuery?: string) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      is_public: true,
      status: 'active',
      start_date: {
        gte: new Date(),
      },
    };

    // Add search functionality
    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { start_location: { contains: searchQuery, mode: 'insensitive' } },
        {
          users: {
            OR: [
              { first_name: { contains: searchQuery, mode: 'insensitive' } },
              { last_name: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }
    
    const [rides, total] = await Promise.all([
      prisma.rides.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { start_date: 'asc' },
          { start_time: 'asc' },
        ],
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
              distance_meters: true,
              elevation_gain_meters: true,
            },
          },
          _count: {
            select: {
              rsvps: {
                where: {
                  status: 'going',
                },
              },
            },
          },
          rsvps: userId ? {
            where: {
              user_id: userId,
            },
            select: {
              status: true,
            },
          } : false,
        },
      }),
      prisma.rides.count({
        where: whereClause,
      }),
    ]);

    const formattedRides = rides.map(ride => {
      const userRsvp = userId && Array.isArray(ride.rsvps) && ride.rsvps[0];
      return {
        id: ride.id,
        title: ride.title,
        description: ride.description,
        startLocation: ride.start_location,
        pace: ride.pace,
          isPublic: ride.is_public,
        status: ride.status,
        organizerId: ride.organizer_id,
        distanceMeters: ride.distance_meters,
        elevationGainMeters: ride.elevation_gain_meters,
        organizer: ride.users ? {
          id: ride.users.id,
          firstName: ride.users.first_name,
          lastName: ride.users.last_name,
          profilePhotoUrl: ride.users.profile_photo_url,
        } : undefined,
        route: ride.routes ? {
          id: ride.routes.id,
          name: ride.routes.name,
          distanceMeters: ride.routes.distance_meters,
          elevationGainMeters: ride.routes.elevation_gain_meters,
          stravaRouteId: ride.routes.strava_route_id ? ride.routes.strava_route_id.toString() : null,
        } : undefined,
        startDate: ride.start_date.toISOString().split('T')[0],
        startTime: ride.start_time.toTimeString().slice(0, 5),
        createdAt: ride.created_at.toISOString(),
        updatedAt: ride.updated_at.toISOString(),
        rsvpCount: ride._count.rsvps,
        userRsvpStatus: userRsvp?.status as 'going' | 'maybe' | 'not_going' | undefined,
      };
    });

    return {
      rides: formattedRides,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserRides(userId: number, type: 'organized' | 'joined' = 'organized', page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const whereClause = type === 'organized' 
      ? { organizer_id: userId }
      : {
          rsvps: {
            some: {
              user_id: userId,
              status: 'going',
            },
          },
        };

    const [rides, total] = await Promise.all([
      prisma.rides.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { start_date: 'desc' },
          { start_time: 'desc' },
        ],
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
              distance_meters: true,
              elevation_gain_meters: true,
            },
          },
          _count: {
            select: {
              rsvps: {
                where: {
                  status: 'going',
                },
              },
            },
          },
        },
      }),
      prisma.rides.count({ where: whereClause }),
    ]);

    const formattedRides = rides.map(ride => ({
      id: ride.id,
      title: ride.title,
      description: ride.description,
      startLocation: ride.start_location,
      pace: ride.pace,
      isPublic: ride.is_public,
      status: ride.status,
      organizerId: ride.organizer_id,
      distanceMeters: ride.distance_meters,
      elevationGainMeters: ride.elevation_gain_meters,
      organizer: ride.users ? {
        id: ride.users.id,
        firstName: ride.users.first_name,
        lastName: ride.users.last_name,
        profilePhotoUrl: ride.users.profile_photo_url,
      } : undefined,
      route: ride.routes ? {
        id: ride.routes.id,
        name: ride.routes.name,
        distanceMeters: ride.routes.distance_meters,
        elevationGainMeters: ride.routes.elevation_gain_meters,
        stravaRouteId: ride.routes.strava_route_id ? ride.routes.strava_route_id.toString() : null,
      } : undefined,
      startDate: ride.start_date.toISOString().split('T')[0],
      startTime: ride.start_time.toTimeString().slice(0, 5),
      createdAt: ride.created_at.toISOString(),
      updatedAt: ride.updated_at.toISOString(),
      rsvpCount: ride._count.rsvps,
    }));

    return {
      rides: formattedRides,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRide(rideId: number, organizer_id: number, data: UpdateRideRequest) {
    // Verify user owns the ride
    const existingRide = await prisma.rides.findUnique({
      where: { id: rideId },
      include: {
        rsvps: {
          where: { status: 'going' },
          include: {
            users: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingRide) {
      throw new Error('Ride not found');
    }

    if (existingRide.organizer_id !== organizer_id) {
      throw new Error('Only the ride organizer can update this ride');
    }

    let routeId = data.routeId;

    // Handle existing route validation
    if (data.routeId) {
      const route = await prisma.routes.findUnique({
        where: { id: data.routeId },
      });
      if (!route) {
        throw new Error('Route not found');
      }
    }

    // Handle Strava route data - create route if provided
    if (data.stravaRouteData) {
      // Check if route already exists based on stravaRouteId
      const existingRoute = await prisma.routes.findUnique({
        where: { strava_route_id: BigInt(data.stravaRouteData.stravaRouteId) },
      });

      if (existingRoute) {
        routeId = existingRoute.id;
      } else {
        // Create new route from Strava data
        const newRoute = await prisma.routes.create({
          data: {
            strava_route_id: BigInt(data.stravaRouteData.stravaRouteId),
            name: data.stravaRouteData.name,
            description: null,
            distance_meters: Math.round(data.stravaRouteData.distance),
            elevation_gain_meters: Math.round(data.stravaRouteData.elevationGain),
            estimated_moving_time: data.stravaRouteData.estimatedTime,
          },
        });
        routeId = newRoute.id;
      }
    }

    // Track what fields are being changed for notifications
    const changes: string[] = [];
    if (data.title && data.title !== existingRide.title) changes.push('title');
    if (data.startDate && data.startDate !== existingRide.start_date.toISOString().split('T')[0]) changes.push('date');
    if (data.startTime && data.startTime !== existingRide.start_time.toTimeString().slice(0, 5)) changes.push('time');
    if (data.startLocation && data.startLocation !== existingRide.start_location) changes.push('location');
    if (data.pace && data.pace !== existingRide.pace) changes.push('pace');

    const updateData: any = {
      title: data.title,
      description: data.description,
      start_location: data.startLocation,
      pace: data.pace,
      is_public: data.isPublic,
      route_id: routeId,
      distance_meters: data.distanceMeters,
      elevation_gain_meters: data.elevationGainMeters,
      updated_at: new Date(),
    };
    
    if (data.startDate) {
      updateData.start_date = new Date(data.startDate);
    }
    if (data.startTime) {
      updateData.start_time = new Date(`1970-01-01T${data.startTime}:00.000Z`);
    }

    const ride = await prisma.rides.update({
      where: { id: rideId },
      data: updateData,
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
            distance_meters: true,
            elevation_gain_meters: true,
            polyline: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: {
                status: 'going',
              },
            },
          },
        },
      },
    });

    // Send notifications to participants if there were meaningful changes
    if (changes.length > 0) {
      try {
        const participantIds = existingRide.rsvps.map(rsvp => rsvp.users.id);
        if (participantIds.length > 0) {
          await notificationService.notifyRideUpdated(rideId, participantIds, changes);
        }
      } catch (error) {
        console.error('Error sending ride update notifications:', error);
        // Don't fail the update if notification fails
      }
    }

    return {
      id: ride.id,
      title: ride.title,
      description: ride.description,
      startLocation: ride.start_location,
      pace: ride.pace,
      isPublic: ride.is_public,
      status: ride.status,
      organizerId: ride.organizer_id,
      distanceMeters: ride.distance_meters,
      elevationGainMeters: ride.elevation_gain_meters,
      organizer: ride.users ? {
        id: ride.users.id,
        firstName: ride.users.first_name,
        lastName: ride.users.last_name,
        profilePhotoUrl: ride.users.profile_photo_url,
      } : undefined,
      route: ride.routes ? {
        id: ride.routes.id,
        name: ride.routes.name,
        distanceMeters: ride.routes.distance_meters,
        elevationGainMeters: ride.routes.elevation_gain_meters,
        polyline: ride.routes.polyline,
        stravaRouteId: ride.routes.strava_route_id ? ride.routes.strava_route_id.toString() : null,
      } : undefined,
      startDate: ride.start_date.toISOString().split('T')[0],
      startTime: ride.start_time.toTimeString().slice(0, 5),
      createdAt: ride.created_at.toISOString(),
      updatedAt: ride.updated_at.toISOString(),
      rsvpCount: ride._count.rsvps,
    };
  }

  async cancelRide(rideId: number, organizer_id: number) {
    // Verify user owns the ride
    const existingRide = await prisma.rides.findUnique({
      where: { id: rideId },
      include: {
        rsvps: {
          where: { status: 'going' },
          include: {
            users: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingRide) {
      throw new Error('Ride not found');
    }

    if (existingRide.organizer_id !== organizer_id) {
      throw new Error('Only the ride organizer can cancel this ride');
    }

    if (existingRide.status === 'cancelled') {
      throw new Error('Ride is already cancelled');
    }

    // Update ride status to cancelled
    const ride = await prisma.rides.update({
      where: { id: rideId },
      data: { 
        status: 'cancelled',
        updated_at: new Date(),
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
            distance_meters: true,
            elevation_gain_meters: true,
            polyline: true,
          },
        },
        _count: {
          select: {
            rsvps: {
              where: {
                status: 'going',
              },
            },
          },
        },
      },
    });

    // Send cancellation notifications to participants
    try {
      const participantIds = existingRide.rsvps.map(rsvp => rsvp.users.id);
      if (participantIds.length > 0) {
        await notificationService.notifyRideCancelled(rideId, participantIds);
      }
    } catch (error) {
      console.error('Error sending ride cancellation notifications:', error);
      // Don't fail the cancellation if notification fails
    }

    return {
      ...ride,
      route: ride.routes ? {
        id: ride.routes.id,
        name: ride.routes.name,
        distanceMeters: ride.routes.distance_meters,
        elevationGainMeters: ride.routes.elevation_gain_meters,
        polyline: ride.routes.polyline,
        stravaRouteId: ride.routes.strava_route_id ? ride.routes.strava_route_id.toString() : null,
      } : undefined,
      startDate: ride.start_date.toISOString().split('T')[0],
      startTime: ride.start_time.toTimeString().slice(0, 5),
      createdAt: ride.created_at.toISOString(),
      updatedAt: ride.updated_at.toISOString(),
      rsvpCount: ride._count.rsvps,
    };
  }

  async deleteRide(rideId: number, organizer_id: number) {
    // Verify user owns the ride
    const existingRide = await prisma.rides.findUnique({
      where: { id: rideId },
      include: {
        rsvps: {
          where: { status: 'going' },
          include: {
            users: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingRide) {
      throw new Error('Ride not found');
    }

    if (existingRide.organizer_id !== organizer_id) {
      throw new Error('Only the ride organizer can delete this ride');
    }

    // Send cancellation notifications before deleting
    try {
      const participantIds = existingRide.rsvps.map(rsvp => rsvp.users.id);
      if (participantIds.length > 0) {
        await notificationService.notifyRideCancelled(rideId, participantIds);
      }
    } catch (error) {
      console.error('Error sending ride deletion notifications:', error);
      // Don't fail the deletion if notification fails
    }

    await prisma.rides.delete({
      where: { id: rideId },
    });
  }
}