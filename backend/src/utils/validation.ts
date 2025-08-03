import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  location: z.string().max(255, 'Location too long').optional(),
  bikeType: z.string().max(50, 'Bike type too long').optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  location: z.string().max(255, 'Location too long').optional(),
  bikeType: z.string().max(50, 'Bike type too long').optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  profilePhotoUrl: z.string().url('Invalid URL format').optional(),
});

export const createRideSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  startLocation: z.string().min(1, 'Start location is required').max(255, 'Location too long'),
  pace: z.enum(['social', 'tempo', 'race'], { 
    errorMap: () => ({ message: 'Pace must be social, tempo, or race' })
  }),
  routeId: z.number().int().positive('Invalid route ID').optional(),
  stravaRouteData: z.object({
    stravaRouteId: z.string().min(1, 'Strava route ID is required'),
    name: z.string().min(1, 'Route name is required'),
    distance: z.number().positive('Distance must be positive'),
    elevationGain: z.number().min(0, 'Elevation gain must be non-negative'),
    estimatedTime: z.number().min(0, 'Estimated time must be non-negative'),
  }).optional(),
  distanceMeters: z.number().int().min(0, 'Distance must be non-negative').optional(),
  elevationGainMeters: z.number().int().min(0, 'Elevation gain must be non-negative').optional(),
  isPublic: z.boolean().optional(),
});

export const updateRideSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  startLocation: z.string().min(1, 'Start location is required').max(255, 'Location too long').optional(),
  pace: z.enum(['social', 'tempo', 'race']).optional(),
  routeId: z.number().int().positive().optional(),
  stravaRouteData: z.object({
    stravaRouteId: z.string().min(1, 'Strava route ID is required'),
    name: z.string().min(1, 'Route name is required'),
    distance: z.number().positive('Distance must be positive'),
    elevationGain: z.number().min(0, 'Elevation gain must be non-negative'),
    estimatedTime: z.number().min(0, 'Estimated time must be non-negative'),
  }).optional(),
  distanceMeters: z.number().int().min(0, 'Distance must be non-negative').optional(),
  elevationGainMeters: z.number().int().min(0, 'Elevation gain must be non-negative').optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(['active', 'cancelled', 'completed']).optional(),
});

export const createRsvpSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going'], {
    errorMap: () => ({ message: 'Status must be going, maybe, or not_going' })
  }),
  message: z.string().max(500, 'Message too long').optional(),
});

export const updateRsvpSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']).optional(),
  message: z.string().max(500, 'Message too long').optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});