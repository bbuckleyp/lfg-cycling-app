import { Router, Request, Response } from 'express';
import { RideService } from '../services/rideService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { createRideSchema, updateRideSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();
const rideService = new RideService();

// Create a new ride
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const validatedData = createRideSchema.parse(req.body);
    const ride = await rideService.createRide(req.user.userId, validatedData);
    
    res.status(201).json({
      message: 'Ride created successfully',
      ride,
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
      res.status(400).json({ error: error.message });
      return;
    }
    
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Get all public rides
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20')));
    const search = req.query.search as string || undefined;

    const result = await rideService.getAllRides(page, limit, req.user?.userId, search);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Get user's rides (organized or joined)
router.get('/my-rides', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const type = (req.query.type as 'organized' | 'joined') || 'organized';
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20')));

    if (type !== 'organized' && type !== 'joined') {
      res.status(400).json({ error: 'Type must be either "organized" or "joined"' });
      return;
    }

    const result = await rideService.getUserRides(req.user.userId, type, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching user rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Get ride by ID
router.get('/:rideId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));

    const ride = await rideService.getRideById(rideId, req.user?.userId);
    
    res.json({ ride });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid ride ID',
        details: error.errors,
      });
      return;
    }
    
    if (error instanceof Error && error.message === 'Ride not found') {
      res.status(404).json({ error: 'Ride not found' });
      return;
    }
    
    console.error('Error fetching ride:', error);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

// Update ride
router.put('/:rideId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));
    const validatedData = updateRideSchema.parse(req.body);

    const ride = await rideService.updateRide(rideId, req.user.userId, validatedData);
    
    res.json({
      message: 'Ride updated successfully',
      ride,
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
      if (error.message === 'Only the ride organizer can update this ride') {
        res.status(403).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }
    
    console.error('Error updating ride:', error);
    res.status(500).json({ error: 'Failed to update ride' });
  }
});

// Cancel ride
router.patch('/:rideId/cancel', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));

    const ride = await rideService.cancelRide(rideId, req.user.userId);
    
    res.json({
      message: 'Ride cancelled successfully',
      ride,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid ride ID',
        details: error.errors,
      });
      return;
    }
    
    if (error instanceof Error) {
      if (error.message === 'Ride not found') {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }
      if (error.message === 'Only the ride organizer can cancel this ride') {
        res.status(403).json({ error: error.message });
        return;
      }
      if (error.message === 'Ride is already cancelled') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message });
      return;
    }
    
    console.error('Error cancelling ride:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
});

// Delete ride
router.delete('/:rideId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const rideIdSchema = z.string().regex(/^\d+$/, 'Ride ID must be a number');
    const rideId = parseInt(rideIdSchema.parse(req.params.rideId));

    await rideService.deleteRide(rideId, req.user.userId);
    
    res.json({ message: 'Ride deleted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid ride ID',
        details: error.errors,
      });
      return;
    }
    
    if (error instanceof Error) {
      if (error.message === 'Ride not found') {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }
      if (error.message === 'Only the ride organizer can delete this ride') {
        res.status(403).json({ error: error.message });
        return;
      }
    }
    
    console.error('Error deleting ride:', error);
    res.status(500).json({ error: 'Failed to delete ride' });
  }
});

export default router;