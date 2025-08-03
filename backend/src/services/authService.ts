import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import { StravaAthlete } from '../types/strava';

const prisma = new PrismaClient();

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.users.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        location: data.location,
        bike_type: data.bikeType,
        experience_level: data.experienceLevel,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        strava_user_id: true,
        profile_photo_url: true,
        location: true,
        bike_type: true,
        experience_level: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Convert BigInt fields to strings for JSON serialization and map snake_case to camelCase
    const userForJson = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      stravaUserId: user.strava_user_id ? user.strava_user_id.toString() : undefined,
      profilePhotoUrl: user.profile_photo_url || undefined,
      location: user.location || undefined,
      bikeType: user.bike_type || undefined,
      experienceLevel: user.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return { user: userForJson, token };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Return user without password and convert BigInt to string
    const { password_hash, strava_access_token, strava_refresh_token, ...userWithoutSensitiveData } = user;

    // Convert BigInt fields to strings for JSON serialization and map snake_case to camelCase
    const userForJson = {
      id: userWithoutSensitiveData.id,
      email: userWithoutSensitiveData.email,
      firstName: userWithoutSensitiveData.first_name,
      lastName: userWithoutSensitiveData.last_name,
      stravaUserId: userWithoutSensitiveData.strava_user_id ? userWithoutSensitiveData.strava_user_id.toString() : undefined,
      profilePhotoUrl: userWithoutSensitiveData.profile_photo_url || undefined,
      location: userWithoutSensitiveData.location || undefined,
      bikeType: userWithoutSensitiveData.bike_type || undefined,
      experienceLevel: userWithoutSensitiveData.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      createdAt: userWithoutSensitiveData.created_at,
      updatedAt: userWithoutSensitiveData.updated_at,
    };

    return { user: userForJson, token };
  }

  async getUserById(userId: number): Promise<User | null> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        strava_user_id: true,
        profile_photo_url: true,
        location: true,
        bike_type: true,
        experience_level: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) return null;

    // Convert BigInt fields to strings for JSON serialization and map snake_case to camelCase
    const userForJson = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      stravaUserId: user.strava_user_id ? user.strava_user_id.toString() : undefined,
      profilePhotoUrl: user.profile_photo_url || undefined,
      location: user.location || undefined,
      bikeType: user.bike_type || undefined,
      experienceLevel: user.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return userForJson;
  }

  async updateProfile(userId: number, data: Partial<User>): Promise<User> {
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        location: data.location,
        bike_type: data.bikeType,
        experience_level: data.experienceLevel,
        profile_photo_url: data.profilePhotoUrl,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        strava_user_id: true,
        profile_photo_url: true,
        location: true,
        bike_type: true,
        experience_level: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Convert BigInt fields to strings for JSON serialization and map snake_case to camelCase
    const userForJson = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      stravaUserId: user.strava_user_id ? user.strava_user_id.toString() : undefined,
      profilePhotoUrl: user.profile_photo_url || undefined,
      location: user.location || undefined,
      bikeType: user.bike_type || undefined,
      experienceLevel: user.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return userForJson;
  }

  async findOrCreateUserFromStrava(athlete: StravaAthlete, accessToken: string, refreshToken: string): Promise<AuthResponse> {
    // First, try to find user by Strava ID
    let user = await prisma.users.findUnique({
      where: { strava_user_id: BigInt(athlete.id) },
    });

    // Strava doesn't provide email, so we can't link by email automatically

    // If still not found, create new user
    if (!user) {
      // Generate a secure random identifier for email
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = await prisma.users.create({
        data: {
          email: `strava_user_${randomId}@noemail.local`,
          password_hash: '', // Empty password for Strava-only accounts
          first_name: athlete.firstname || '',
          last_name: athlete.lastname || '',
          strava_user_id: BigInt(athlete.id),
          strava_access_token: accessToken,
          strava_refresh_token: refreshToken,
          profile_photo_url: athlete.profile,
          location: `${athlete.city || ''} ${athlete.state || ''} ${athlete.country || ''}`.trim() || null,
        },
      });
    } else if (user.strava_user_id) {
      // Update existing Strava user tokens
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          strava_access_token: accessToken,
          strava_refresh_token: refreshToken,
          profile_photo_url: athlete.profile || user.profile_photo_url,
          updated_at: new Date(),
        },
      });
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    // Convert BigInt fields to strings for JSON serialization and map snake_case to camelCase
    const userForJson = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      stravaUserId: user.strava_user_id ? user.strava_user_id.toString() : undefined,
      profilePhotoUrl: user.profile_photo_url || undefined,
      location: user.location || undefined,
      bikeType: user.bike_type || undefined,
      experienceLevel: user.experience_level as 'beginner' | 'intermediate' | 'advanced' | undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return { user: userForJson, token };
  }
}