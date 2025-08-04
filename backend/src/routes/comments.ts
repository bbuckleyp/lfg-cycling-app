import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { commentService } from '../services/commentService';
import { createCommentSchema, updateCommentSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

// GET /api/events/:eventId/comments - Get all comments for an event
router.get('/events/:eventId/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventIdSchema = z.string().regex(/^\d+$/, 'Event ID must be a number');
    const eventId = parseInt(eventIdSchema.parse(req.params.eventId));

    const comments = await commentService.getEventComments(eventId);
    res.json({ comments });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error fetching comments:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message || 'Failed to fetch comments' });
    } else {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }
});

// POST /api/events/:eventId/comments - Create a new comment for an event
router.post('/events/:eventId/comments', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const eventIdSchema = z.string().regex(/^\d+$/, 'Event ID must be a number');
    const eventId = parseInt(eventIdSchema.parse(req.params.eventId));

    const validatedData = createCommentSchema.parse(req.body);

    const comment = await commentService.createComment(eventId, req.user.id, validatedData);
    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error creating comment:', error);
    if (error instanceof Error) {
      if (error.message === 'Event not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || 'Failed to create comment' });
      }
    } else {
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
});

// PUT /api/comments/:commentId - Update a comment
router.put('/comments/:commentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const commentIdSchema = z.string().regex(/^\d+$/, 'Comment ID must be a number');
    const commentId = parseInt(commentIdSchema.parse(req.params.commentId));

    const validatedData = updateCommentSchema.parse(req.body);

    const comment = await commentService.updateComment(commentId, req.user.id, validatedData);
    res.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error updating comment:', error);
    if (error instanceof Error) {
      if (error.message === 'Comment not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'You can only update your own comments') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || 'Failed to update comment' });
      }
    } else {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  }
});

// DELETE /api/comments/:commentId - Delete a comment
router.delete('/comments/:commentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const commentIdSchema = z.string().regex(/^\d+$/, 'Comment ID must be a number');
    const commentId = parseInt(commentIdSchema.parse(req.params.commentId));

    await commentService.deleteComment(commentId, req.user.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error deleting comment:', error);
    if (error instanceof Error) {
      if (error.message === 'Comment not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'You can only delete your own comments') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message || 'Failed to delete comment' });
      }
    } else {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
});

// GET /api/comments/:commentId - Get a specific comment
router.get('/comments/:commentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const commentIdSchema = z.string().regex(/^\d+$/, 'Comment ID must be a number');
    const commentId = parseInt(commentIdSchema.parse(req.params.commentId));

    const comment = await commentService.getCommentById(commentId);
    
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    res.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

export default router;