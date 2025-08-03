import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { commentService } from '../services/commentService';
import { createCommentSchema, updateCommentSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

// GET /api/rides/:rideId/comments - Get all comments for a ride
router.get('/rides/:rideId/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));

    const comments = await commentService.getRideComments(rideId);
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

// POST /api/rides/:rideId/comments - Create a new comment
router.post('/rides/:rideId/comments', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));
    const validatedData = createCommentSchema.parse(req.body);

    const comment = await commentService.createComment(rideId, req.user.userId, validatedData);
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
      res.status(500).json({ error: error.message || 'Failed to create comment' });
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

    const comment = await commentService.updateComment(commentId, req.user.userId, validatedData);
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
        return;
      }
      if (error.message === 'Only the comment author can update this comment') {
        res.status(403).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to update comment' });
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

    await commentService.deleteComment(commentId, req.user.userId);
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
        return;
      }
      if (error.message === 'Only the comment author can delete this comment') {
        res.status(403).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to delete comment' });
    } else {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  }
});

export default router;