export interface Rsvp {
  id: number;
  rideId: number;
  userId: number;
  status: 'going' | 'maybe' | 'not_going';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRsvpRequest {
  status: 'going' | 'maybe' | 'not_going';
  message?: string;
}

export interface UpdateRsvpRequest {
  status?: 'going' | 'maybe' | 'not_going';
  message?: string;
}

export interface RsvpWithUser extends Rsvp {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}