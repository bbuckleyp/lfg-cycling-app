import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { StravaService } from '../services/stravaService';
import { loginSchema, registerSchema, updateProfileSchema } from '../utils/validation';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const authService = new AuthService();
const stravaService = StravaService.getInstance();

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    
    res.status(201).json({
      message: 'User registered successfully',
      ...result,
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
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    
    res.json({
      message: 'Login successful',
      ...result,
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
      res.status(401).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const user = await authService.getUserById(req.user.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user.userId, validatedData);
    
    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal, but we can add token blacklisting later)
router.post('/logout', authenticateToken, (req: Request, res: Response): void => {
  res.json({ message: 'Logout successful' });
});

// Strava OAuth authentication routes

// Generate Strava authorization URL for login/signup
router.get('/strava/auth-url', (req: Request, res: Response): void => {
  try {
    const action = req.query.action as string; // 'login' or 'signup'
    const redirectUrl = req.query.redirect_url as string;

    if (!action || !['login', 'signup'].includes(action)) {
      res.status(400).json({ error: 'Invalid or missing action parameter. Must be "login" or "signup"' });
      return;
    }

    // Validate redirect URL to prevent open redirect vulnerabilities
    const allowedDomains = [
      'localhost:5173',
      'localhost:3000', 
      process.env.FRONTEND_URL?.replace(/^https?:\/\//, '')
    ].filter(Boolean);
    
    const defaultRedirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let validatedRedirectUrl = defaultRedirectUrl;
    
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        const isAllowed = allowedDomains.some(domain => 
          url.hostname === domain || url.host === domain
        );
        if (isAllowed) {
          validatedRedirectUrl = redirectUrl;
        }
      } catch {
        // Invalid URL, use default
      }
    }

    const state = Buffer.from(JSON.stringify({
      action,
      redirectUrl: validatedRedirectUrl,
    })).toString('base64');

    const authUrl = stravaService.getAuthUrl(state);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Strava auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

// Handle Strava OAuth callback for authentication
router.get('/strava/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${redirectUrl}/login?strava=error&message=${encodeURIComponent(error as string)}`);
      return;
    }

    if (!code || !state) {
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${redirectUrl}/login?strava=error&message=${encodeURIComponent('Missing authorization code or state')}`);
      return;
    }

    // Decode state
    let authState: { action: string; redirectUrl: string };
    try {
      authState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch {
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${redirectUrl}/login?strava=error&message=${encodeURIComponent('Invalid state parameter')}`);
      return;
    }

    // Exchange code for token
    const tokenData = await stravaService.exchangeCodeForToken(code as string);
    
    // Get athlete data
    const athlete = await stravaService.getAthlete(tokenData.access_token);
    
    // Create or find user and generate JWT
    const authResult = await authService.findOrCreateUserFromStrava(
      athlete,
      tokenData.access_token,
      tokenData.refresh_token
    );

    // Validate redirect URL again to prevent tampering
    const allowedDomains = [
      'localhost:5173',
      'localhost:3000', 
      process.env.FRONTEND_URL?.replace(/^https?:\/\//, '')
    ].filter(Boolean);
    
    const defaultRedirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let validatedRedirectUrl = defaultRedirectUrl;
    
    if (authState.redirectUrl) {
      try {
        const url = new URL(authState.redirectUrl);
        const isAllowed = allowedDomains.some(domain => 
          url.hostname === domain || url.host === domain
        );
        if (isAllowed) {
          validatedRedirectUrl = authState.redirectUrl;
        }
      } catch {
        // Invalid URL, use default
      }
    }
    
    // Redirect to a dedicated auth callback route for Strava authentication
    res.redirect(`${validatedRedirectUrl}/auth/strava/callback?strava=success&token=${encodeURIComponent(authResult.token)}&action=${authState.action}`);
  } catch (error) {
    console.error('Error handling Strava callback:', error);
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${redirectUrl}/login?strava=error&message=${encodeURIComponent('Authentication failed')}`);
  }
});

export default router;