import { Router, Request, Response } from 'express';
import { eventService } from '../services/eventService';
import { createEventSchema, updateEventSchema } from '../utils/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all events with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      type: eventType,
      search,
      pace,
      status,
      startDate,
      endDate,
      organizerId,
      isPublic,
      page,
      limit,
    } = req.query;

    const filters = {
      eventType: eventType as 'ride' | 'race' | undefined,
      search: search as string | undefined,
      pace: pace as 'social' | 'tempo' | 'race' | undefined,
      status: status as 'active' | 'cancelled' | 'completed' | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      organizerId: organizerId ? parseInt(organizerId as string) : undefined,
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await eventService.getAllEvents(filters);
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by ID
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const userId = req.user?.id; // Optional - will be undefined if not authenticated

    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await eventService.getEventById(eventId, userId);
    res.json({ event });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    if (error.message === 'Event not found') {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  }
});

// Create new event (protected)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validation = createEventSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const event = await eventService.createEvent(req.user!.id, validation.data);
    res.status(201).json({ event });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (protected)
router.put('/:eventId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const validation = updateEventSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const event = await eventService.updateEvent(eventId, req.user!.id, validation.data);
    res.json({ event });
  } catch (error: any) {
    console.error('Error updating event:', error);
    if (error.message === 'Event not found') {
      res.status(404).json({ error: 'Event not found' });
    } else if (error.message === 'Only the organizer can update this event') {
      res.status(403).json({ error: 'Only the organizer can update this event' });
    } else {
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
});

// Cancel event (protected)
router.patch('/:eventId/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await eventService.cancelEvent(eventId, req.user!.id);
    res.json({ event });
  } catch (error: any) {
    console.error('Error cancelling event:', error);
    if (error.message === 'Event not found') {
      res.status(404).json({ error: 'Event not found' });
    } else if (error.message === 'Only the organizer can update this event') {
      res.status(403).json({ error: 'Only the organizer can cancel this event' });
    } else {
      res.status(500).json({ error: 'Failed to cancel event' });
    }
  }
});

// Delete event (protected)
router.delete('/:eventId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    await eventService.deleteEvent(eventId, req.user!.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting event:', error);
    if (error.message === 'Event not found') {
      res.status(404).json({ error: 'Event not found' });
    } else if (error.message === 'Only the organizer can delete this event') {
      res.status(403).json({ error: 'Only the organizer can delete this event' });
    } else {
      res.status(500).json({ error: 'Failed to delete event' });
    }
  }
});

// Get user's events (protected)
router.get('/user/my-events', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type: eventType, status } = req.query;
    
    const filters = {
      eventType: eventType as 'ride' | 'race' | undefined,
      status: status as 'active' | 'cancelled' | 'completed' | undefined,
    };

    const events = await eventService.getUserEvents(req.user!.id, filters);
    res.json({ events });
  } catch (error: any) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

export default router;