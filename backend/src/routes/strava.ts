import { Router, Request, Response } from 'express';
import { StravaService } from '../services/stravaService';
import { authenticateToken } from '../middleware/auth';
import { StravaAuthState } from '../types/strava';
import { z } from 'zod';

const router = Router();
const stravaService = StravaService.getInstance();

// Generate Strava authorization URL
router.get('/auth-url', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const state: StravaAuthState = {
      userId: req.user.userId,
      redirectUrl: req.query.redirect_url as string,
    };

    const authUrl = stravaService.getAuthUrl(Buffer.from(JSON.stringify(state)).toString('base64'));
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Strava auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Connect to Strava (handle callback in frontend)
router.post('/connect', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { code, state } = req.body;
    console.log('🔗 Strava connect request:', { code: code ? 'PROVIDED' : 'MISSING', state: state ? 'PROVIDED' : 'MISSING', userId: req.user.userId });

    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state' });
      return;
    }

    // Decode state
    let authState: StravaAuthState;
    try {
      authState = JSON.parse(Buffer.from(state as string, 'base64').toString());
      console.log('🔓 Decoded state:', authState);
    } catch (error) {
      console.error('❌ Failed to decode state:', error);
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    // Use the authenticated user's ID instead of the state userId for security
    const userId = req.user.userId;
    console.log('👤 Using authenticated user ID:', userId);

    // Exchange code for token
    console.log('🔄 Exchanging code for token...');
    const tokenData = await stravaService.exchangeCodeForToken(code as string);
    console.log('✅ Token exchange successful');
    
    // Connect user to Strava
    console.log('🔗 Connecting user to Strava...');
    await stravaService.connectUserToStrava(userId, tokenData);
    console.log('✅ User connected to Strava successfully');

    res.json({ success: true, message: 'Successfully connected to Strava' });
  } catch (error) {
    console.error('❌ Error connecting to Strava:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message, error.stack);
    }
    res.status(500).json({ error: 'Failed to connect to Strava' });
  }
});

// Handle Strava OAuth callback
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      res.status(400).json({ error: `Strava authorization failed: ${error}` });
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state' });
      return;
    }

    // Decode state
    let authState: StravaAuthState;
    try {
      authState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    // Exchange code for token
    const tokenData = await stravaService.exchangeCodeForToken(code as string);
    
    // Connect user to Strava
    await stravaService.connectUserToStrava(authState.userId, tokenData);

    // Redirect to frontend with success
    const redirectUrl = authState.redirectUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${redirectUrl}/dashboard?strava=connected`);
  } catch (error) {
    console.error('Error handling Strava callback:', error);
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${redirectUrl}/dashboard?strava=error`);
  }
});

// Get user's Strava routes
router.get('/routes', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string || '1');
    const perPage = Math.min(parseInt(req.query.per_page as string || '30'), 100);

    const accessToken = await stravaService.getUserAccessToken(req.user.userId);
    const routes = await stravaService.getAthleteRoutes(accessToken, page, perPage);

    res.json({ routes, page, perPage });
  } catch (error) {
    console.error('Error fetching Strava routes:', error);
    if (error instanceof Error && error.message === 'User is not connected to Strava') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Import a specific route
router.post('/routes/:routeId/import', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const routeIdSchema = z.string().regex(/^\d+$/, 'Route ID must be a number');
    const routeIdString = routeIdSchema.parse(req.params.routeId);

    console.log(`🔄 Import request for route ID: ${routeIdString}`);

    const accessToken = await stravaService.getUserAccessToken(req.user.userId);
    const route = await stravaService.importRoute(routeIdString, accessToken);

    res.json({ 
      message: 'Route imported successfully',
      route 
    });
  } catch (error) {
    console.error('Error importing route:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid route ID',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error && error.message === 'User is not connected to Strava') {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Pass through specific error messages from the service
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Failed to import route' });
  }
});

// Get route details
router.get('/routes/:routeId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const routeIdSchema = z.string().regex(/^\d+$/, 'Route ID must be a number');
    const routeId = routeIdSchema.parse(req.params.routeId);

    const accessToken = await stravaService.getUserAccessToken(req.user.userId);
    const route = await stravaService.getRoute(routeId, accessToken);

    res.json({ route });
  } catch (error) {
    console.error('Error fetching route details:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid route ID',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error && error.message === 'User is not connected to Strava') {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch route details' });
  }
});

// Disconnect from Strava
router.delete('/disconnect', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await stravaService.disconnectUserFromStrava(req.user.userId);
    
    res.json({ message: 'Successfully disconnected from Strava' });
  } catch (error) {
    console.error('Error disconnecting from Strava:', error);
    res.status(500).json({ error: 'Failed to disconnect from Strava' });
  }
});

// Get connection status
router.get('/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      await stravaService.getUserAccessToken(req.user.userId);
      res.json({ connected: true });
    } catch {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Error checking Strava status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

export default router;