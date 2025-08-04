import { Router, Request, Response } from 'express';
import { rsvpService } from '../services/rsvpService';
import { authenticateToken } from '../middleware/auth';
import { createRsvpSchema, updateRsvpSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();

// Create or update RSVP for an event
router.post('/events/:eventId/rsvp', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const eventIdSchema = z.string().regex(/^\d+$/, 'Event ID must be a number');
    const eventId = parseInt(eventIdSchema.parse(req.params.eventId));
    const validatedData = createRsvpSchema.parse(req.body);

    const rsvp = await rsvpService.createOrUpdateRsvp(eventId, req.user.id, validatedData);
    
    res.json({
      message: 'RSVP updated successfully',
      rsvp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error creating/updating RSVP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update RSVP';
    
    if (errorMessage === 'Event not found') {
      res.status(404).json({ error: errorMessage });
    } else if (errorMessage === 'Cannot RSVP to inactive event' || errorMessage === 'Cannot RSVP to your own event') {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to update RSVP' });
    }
  }
});

// Get RSVPs for an event
router.get('/events/:eventId/rsvps', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventIdSchema = z.string().regex(/^\d+$/, 'Event ID must be a number');
    const eventId = parseInt(eventIdSchema.parse(req.params.eventId));
    const status = req.query.status as string | undefined;

    if (status && !['going', 'maybe', 'not_going'].includes(status)) {
      res.status(400).json({ error: 'Invalid status filter' });
      return;
    }

    const rsvps = await rsvpService.getEventRsvps(eventId, status);
    res.json({ rsvps });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error fetching RSVPs:', error);
    res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

// Get user's RSVP for an event
router.get('/events/:eventId/rsvp/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const eventIdSchema = z.string().regex(/^\d+$/, 'Event ID must be a number');
    const eventId = parseInt(eventIdSchema.parse(req.params.eventId));

    const rsvp = await rsvpService.getUserRsvp(eventId, req.user.id);
    res.json({ rsvp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error fetching user RSVP:', error);
    res.status(500).json({ error: 'Failed to fetch RSVP' });
  }
});

// Get RSVP stats for an event
router.get('/events/:eventId/rsvp-stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventIdSchema = z.string().regex(/^\d+$/, 'Event ID must be a number');
    const eventId = parseInt(eventIdSchema.parse(req.params.eventId));

    const stats = await rsvpService.getRsvpStats(eventId);
    res.json({ stats });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error fetching RSVP stats:', error);
    res.status(500).json({ error: 'Failed to fetch RSVP stats' });
  }
});

// Delete RSVP for an event
router.delete('/events/:eventId/rsvp', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const eventIdSchema = z.string().regex(/^\d+$/, 'Event ID must be a number');
    const eventId = parseInt(eventIdSchema.parse(req.params.eventId));

    await rsvpService.deleteRsvp(eventId, req.user.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Error deleting RSVP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete RSVP';
    
    if (errorMessage === 'RSVP not found') {
      res.status(404).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to delete RSVP' });
    }
  }
});

export default router;