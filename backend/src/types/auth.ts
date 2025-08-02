export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  stravaUserId?: number;
  profilePhotoUrl?: string;
  location?: string;
  bikeType?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  location?: string;
  bikeType?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}