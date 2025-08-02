export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  stravaUserId?: string;
  profilePhotoUrl?: string;
  location?: string;
  bikeType?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
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
  user: User;
  token: string;
  message: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}