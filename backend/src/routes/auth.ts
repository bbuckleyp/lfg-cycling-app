import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema, registerSchema, updateProfileSchema } from '../utils/validation';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const authService = new AuthService();

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
    console.log('🔐 Login attempt for email:', req.body.email);
    const validatedData = loginSchema.parse(req.body);
    console.log('✅ Login data validated');
    const result = await authService.login(validatedData);
    console.log('✅ Login successful for user:', result.user.email);
    
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

export default router;