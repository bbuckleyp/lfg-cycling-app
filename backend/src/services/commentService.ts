import { PrismaClient } from '@prisma/client';
import { CreateCommentRequest, UpdateCommentRequest, CommentWithUser } from '../types/comment';

const prisma = new PrismaClient();

export class CommentService {
  async createComment(rideId: number, userId: number, data: CreateCommentRequest) {
    // Check if ride exists
    const ride = await prisma.rides.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const comment = await prisma.comments.create({
      data: {
        ride_id: rideId,
        user_id: userId,
        content: data.content,
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
            experience_level: true,
          },
        },
      },
    });

    return {
      id: comment.id,
      rideId: comment.ride_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
      user: {
        id: comment.users.id,
        firstName: comment.users.first_name,
        lastName: comment.users.last_name,
        profilePhotoUrl: comment.users.profile_photo_url,
        experienceLevel: comment.users.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      },
    };
  }

  async getRideComments(rideId: number): Promise<CommentWithUser[]> {
    const comments = await prisma.comments.findMany({
      where: { ride_id: rideId },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
            experience_level: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return comments.map(comment => ({
      id: comment.id,
      rideId: comment.ride_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
      user: {
        id: comment.users.id,
        firstName: comment.users.first_name,
        lastName: comment.users.last_name,
        profilePhotoUrl: comment.users.profile_photo_url,
        experienceLevel: comment.users.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      },
    }));
  }

  async updateComment(commentId: number, userId: number, data: UpdateCommentRequest) {
    // Check if comment exists and user owns it
    const existingComment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.user_id !== userId) {
      throw new Error('Only the comment author can update this comment');
    }

    const comment = await prisma.comments.update({
      where: { id: commentId },
      data: {
        content: data.content,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profile_photo_url: true,
            experience_level: true,
          },
        },
      },
    });

    return {
      id: comment.id,
      rideId: comment.ride_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
      user: {
        id: comment.users.id,
        firstName: comment.users.first_name,
        lastName: comment.users.last_name,
        profilePhotoUrl: comment.users.profile_photo_url,
        experienceLevel: comment.users.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      },
    };
  }

  async deleteComment(commentId: number, userId: number) {
    // Check if comment exists and user owns it
    const existingComment = await prisma.comments.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.user_id !== userId) {
      throw new Error('Only the comment author can delete this comment');
    }

    await prisma.comments.delete({
      where: { id: commentId },
    });
  }
}

export const commentService = new CommentService();