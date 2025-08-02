import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

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
      stravaUserId: user.strava_user_id ? user.strava_user_id.toString() : null,
      profilePhotoUrl: user.profile_photo_url,
      location: user.location,
      bikeType: user.bike_type,
      experienceLevel: user.experience_level,
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
      stravaUserId: userWithoutSensitiveData.strava_user_id ? userWithoutSensitiveData.strava_user_id.toString() : null,
      profilePhotoUrl: userWithoutSensitiveData.profile_photo_url,
      location: userWithoutSensitiveData.location,
      bikeType: userWithoutSensitiveData.bike_type,
      experienceLevel: userWithoutSensitiveData.experience_level,
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
      stravaUserId: user.strava_user_id ? user.strava_user_id.toString() : null,
      profilePhotoUrl: user.profile_photo_url,
      location: user.location,
      bikeType: user.bike_type,
      experienceLevel: user.experience_level,
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
      stravaUserId: user.strava_user_id ? user.strava_user_id.toString() : null,
      profilePhotoUrl: user.profile_photo_url,
      location: user.location,
      bikeType: user.bike_type,
      experienceLevel: user.experience_level,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return userForJson;
  }
}