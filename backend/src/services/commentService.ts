import { PrismaClient } from '@prisma/client';
import { CreateCommentRequest, UpdateCommentRequest, CommentWithUser } from '../types/comment';

const prisma = new PrismaClient();

export class CommentService {
  async createComment(eventId: number, userId: number, data: CreateCommentRequest) {
    // Check if event exists
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const comment = await prisma.comments.create({
      data: {
        event_id: eventId,
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
      eventId: comment.event_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
      user: {
        id: comment.users.id,
        firstName: comment.users.first_name,
        lastName: comment.users.last_name,
        profilePhotoUrl: comment.users.profile_photo_url || undefined,
        experienceLevel: comment.users.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      },
    };
  }

  async getEventComments(eventId: number): Promise<CommentWithUser[]> {
    const comments = await prisma.comments.findMany({
      where: { event_id: eventId },
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
      orderBy: { created_at: 'asc' },
    });

    return comments.map(comment => ({
      id: comment.id,
      eventId: comment.event_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
      user: {
        id: comment.users.id,
        firstName: comment.users.first_name,
        lastName: comment.users.last_name,
        profilePhotoUrl: comment.users.profile_photo_url || undefined,
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
      throw new Error('You can only update your own comments');
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
      eventId: comment.event_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
      user: {
        id: comment.users.id,
        firstName: comment.users.first_name,
        lastName: comment.users.last_name,
        profilePhotoUrl: comment.users.profile_photo_url || undefined,
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
      throw new Error('You can only delete your own comments');
    }

    await prisma.comments.delete({
      where: { id: commentId },
    });
  }

  async getCommentById(commentId: number): Promise<CommentWithUser | null> {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
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

    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      eventId: comment.event_id,
      userId: comment.user_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
      user: {
        id: comment.users.id,
        firstName: comment.users.first_name,
        lastName: comment.users.last_name,
        profilePhotoUrl: comment.users.profile_photo_url || undefined,
        experienceLevel: comment.users.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      },
    };
  }
}

export const commentService = new CommentService();