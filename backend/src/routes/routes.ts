import { Router, Request, Response } from 'express';
import { RouteService } from '../services/routeService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const routeService = new RouteService();

// Get all routes (public)
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20')));

    const result = await routeService.getAllRoutes(page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Search routes (public)
router.get('/search', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const querySchema = z.object({
      q: z.string().min(1, 'Search query is required'),
      page: z.string().optional(),
      limit: z.string().optional(),
    });

    const { q, page: pageStr, limit: limitStr } = querySchema.parse(req.query);
    const page = Math.max(1, parseInt(pageStr || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(limitStr || '20')));

    const result = await routeService.searchRoutes(q, page, limit);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid search parameters',
        details: error.errors,
      });
      return;
    }
    
    console.error('Error searching routes:', error);
    res.status(500).json({ error: 'Failed to search routes' });
  }
});

// Get route by ID (public)
router.get('/:routeId', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const routeIdSchema = z.string().regex(/^\d+$/, 'Route ID must be a number');
    const routeId = parseInt(routeIdSchema.parse(req.params.routeId));

    const route = await routeService.getRouteStats(routeId);
    
    res.json({ route });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid route ID',
        details: error.errors,
      });
      return;
    }
    
    if (error instanceof Error && error.message === 'Route not found') {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// Delete route (authenticated, admin or route creator only)
router.delete('/:routeId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const routeIdSchema = z.string().regex(/^\d+$/, 'Route ID must be a number');
    const routeId = parseInt(routeIdSchema.parse(req.params.routeId));

    await routeService.deleteRoute(routeId);
    
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid route ID',
        details: error.errors,
      });
      return;
    }
    
    if (error instanceof Error) {
      if (error.message === 'Route not found') {
        res.status(404).json({ error: 'Route not found' });
        return;
      }
      if (error.message === 'Cannot delete route that is being used by rides') {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

export default router;