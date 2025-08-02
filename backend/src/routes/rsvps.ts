import { Router, Request, Response } from 'express';
import { RsvpService } from '../services/rsvpService';
import { authenticateToken } from '../middleware/auth';
import { createRsvpSchema, updateRsvpSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();
const rsvpService = new RsvpService();

// Create or update RSVP for a ride
router.post('/rides/:rideId/rsvp', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));
    const validatedData = createRsvpSchema.parse(req.body);

    const rsvp = await rsvpService.createOrUpdateRsvp(rideId, req.user.userId, validatedData);
    
    res.json({
      message: 'RSVP updated successfully',
      rsvp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    if (error instanceof Error) {
      if (error.message === 'Ride not found') {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }
      if (error.message === 'Cannot RSVP to inactive ride') {
        res.status(400).json({ error: 'Cannot RSVP to inactive ride' });
        return;
      }
      if (error.message === 'Ride is full') {
        res.status(400).json({ error: 'Ride is full' });
        return;
      }
      if (error.message === 'Cannot RSVP to your own ride') {
        res.status(400).json({ error: 'Cannot RSVP to your own ride' });
        return;
      }
    }
    
    console.error('Error creating RSVP:', error);
    res.status(500).json({ error: 'Failed to create RSVP' });
  }
});

// Get all RSVPs for a ride
router.get('/rides/:rideId/rsvps', async (req: Request, res: Response): Promise<void> => {
  try {
    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));
    const status = req.query.status as string || undefined;

    if (status && !['going', 'maybe', 'not_going'].includes(status)) {
      res.status(400).json({ error: 'Invalid status filter' });
      return;
    }

    const rsvps = await rsvpService.getRideRsvps(rideId, status);
    
    res.json({ rsvps });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid ride ID',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error fetching RSVPs:', error);
    res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

// Get user's RSVP for a specific ride
router.get('/rides/:rideId/rsvp', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));

    const rsvp = await rsvpService.getUserRsvp(rideId, req.user.userId);
    
    res.json({ rsvp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid ride ID',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error fetching user RSVP:', error);
    res.status(500).json({ error: 'Failed to fetch RSVP' });
  }
});

// Delete user's RSVP for a ride
router.delete('/rides/:rideId/rsvp', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));

    await rsvpService.deleteRsvp(rideId, req.user.userId);
    
    res.json({ message: 'RSVP deleted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid ride ID',
        details: error.errors,
      });
      return;
    }
    
    if (error instanceof Error && error.message === 'RSVP not found') {
      res.status(404).json({ error: 'RSVP not found' });
      return;
    }
    
    console.error('Error deleting RSVP:', error);
    res.status(500).json({ error: 'Failed to delete RSVP' });
  }
});

// Get RSVP statistics for a ride
router.get('/rides/:rideId/rsvp-stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));

    const stats = await rsvpService.getRsvpStats(rideId);
    
    res.json({ stats });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid ride ID',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error fetching RSVP stats:', error);
    res.status(500).json({ error: 'Failed to fetch RSVP statistics' });
  }
});

export default router;