import { PrismaClient } from '@prisma/client';
import { CreateRsvpRequest, UpdateRsvpRequest, RsvpWithUser } from '../types/rsvp';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

export class RsvpService {
  async createOrUpdateRsvp(rideId: number, userId: number, data: CreateRsvpRequest) {
    // Check if ride exists and is still active
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
      include: {
        _count: {
          select: {
            rsvps: {
              where: { status: 'going' },
            },
          },
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.status !== 'active') {
      throw new Error('Cannot RSVP to inactive ride');
    }

    // Check if ride is full (only for 'going' status)
    if (data.status === 'going' && ride.maxParticipants) {
      const currentCount = ride._count.rsvps;
      if (currentCount >= ride.maxParticipants) {
        throw new Error('Ride is full');
      }
    }

    // Check if user is trying to RSVP to their own ride
    if (ride.organizer_id === userId) {
      throw new Error('Cannot RSVP to your own ride');
    }

    // Check if this is a new RSVP or status change
    const existingRsvp = await prisma.rsvps.findUnique({
      where: {
        ride_id_user_id: {
          ride_id: rideId,
          user_id: userId,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const isNewParticipant = !existingRsvp && data.status === 'going';
    const wasGoing = existingRsvp?.status === 'going';
    const isNowGoing = data.status === 'going';
    const isLeavingRide = existingRsvp && (data.status === 'not_going' || (wasGoing && !isNowGoing));

    // Create or update RSVP
    const rsvp = await prisma.rsvps.upsert({
      where: {
        ride_id_user_id: {
          ride_id: rideId,
          user_id: userId,
        },
      },
      update: {
        status: data.status,
        message: data.message,
        updated_at: new Date(),
      },
      create: {
        ride_id: rideId,
        user_id: userId,
        status: data.status,
        message: data.message,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            experienceLevel: true,
          },
        },
      },
    });

    // Send notifications to organizer
    try {
      if (isNewParticipant || (!existingRsvp && isNowGoing)) {
        await notificationService.notifyNewParticipant(
          rideId,
          ride.organizer_id,
          `${rsvp.user.first_name} ${rsvp.user.last_name}`
        );
      } else if (isLeavingRide) {
        const userName = existingRsvp?.user ? 
          `${existingRsvp.user.first_name} ${existingRsvp.user.last_name}` :
          `${rsvp.user.first_name} ${rsvp.user.last_name}`;
        
        await notificationService.notifyParticipantLeft(
          rideId,
          ride.organizer_id,
          userName
        );
      }
    } catch (error) {
      console.error('Error sending RSVP notification:', error);
      // Don't fail the RSVP if notification fails
    }

    return {
      ...rsvp,
      created_at: rsvp.createdAt.toISOString(),
      updated_at: rsvp.updatedAt.toISOString(),
    };
  }

  async getRideRsvps(rideId: number, status?: string): Promise<RsvpWithUser[]> {
    const whereClause: any = { rideId };
    if (status) {
      whereClause.status = status;
    }

    const rsvps = await prisma.rsvps.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            experienceLevel: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // going first, then maybe, then not_going
        { created_at: 'asc' },
      ],
    });

    return rsvps.map(rsvp => ({
      ...rsvp,
      created_at: rsvp.createdAt.toISOString(),
      updated_at: rsvp.updatedAt.toISOString(),
    }));
  }

  async getUserRsvp(rideId: number, userId: number) {
    const rsvp = await prisma.rsvps.findUnique({
      where: {
        ride_id_user_id: {
          ride_id: rideId,
          user_id: userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            experienceLevel: true,
          },
        },
      },
    });

    if (!rsvp) {
      return null;
    }

    return {
      ...rsvp,
      created_at: rsvp.createdAt.toISOString(),
      updated_at: rsvp.updatedAt.toISOString(),
    };
  }

  async deleteRsvp(rideId: number, userId: number) {
    // Check if RSVP exists
    const existingRsvp = await prisma.rsvps.findUnique({
      where: {
        ride_id_user_id: {
          ride_id: rideId,
          user_id: userId,
        },
      },
    });

    if (!existingRsvp) {
      throw new Error('RSVP not found');
    }

    await prisma.rsvps.delete({
      where: {
        ride_id_user_id: {
          ride_id: rideId,
          user_id: userId,
        },
      },
    });
  }

  async getRsvpStats(rideId: number) {
    const stats = await prisma.rsvps.groupBy({
      by: ['status'],
      where: { rideId },
      _count: {
        status: true,
      },
    });

    const result = {
      going: 0,
      maybe: 0,
      not_going: 0,
      total: 0,
    };

    stats.forEach(stat => {
      result[stat.status as keyof typeof result] = stat._count.status;
      result.total += stat._count.status;
    });

    return result;
  }
}