export interface Ride {
  id: number;
  organizerId: number;
  routeId?: number;
  title: string;
  description?: string;
  startDate: string;
  startTime: string;
  startLocation: string;
  pace: 'social' | 'tempo' | 'race';
  isPublic: boolean;
  status: 'active' | 'cancelled' | 'completed';
  distanceMeters?: number;
  elevationGainMeters?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRideRequest {
  title: string;
  description?: string;
  startDate: string;
  startTime: string;
  startLocation: string;
  pace: 'social' | 'tempo' | 'race';
  routeId?: number;
  stravaRouteData?: {
    stravaRouteId: string;
    name: string;
    distance: number;
    elevationGain: number;
    estimatedTime: number;
  };
  distanceMeters?: number;
  elevationGainMeters?: number;
  isPublic?: boolean;
}

export interface UpdateRideRequest {
  title?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  startLocation?: string;
  pace?: 'social' | 'tempo' | 'race';
  routeId?: number;
  stravaRouteData?: {
    stravaRouteId: string;
    name: string;
    distance: number;
    elevationGain: number;
    estimatedTime: number;
  };
  distanceMeters?: number;
  elevationGainMeters?: number;
  isPublic?: boolean;
  status?: 'active' | 'cancelled' | 'completed';
}

export interface RideWithDetails extends Ride {
  organizer: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
  };
  route?: {
    id: number;
    stravaRouteId: string;
    name: string;
    distanceMeters: number;
    elevationGainMeters?: number;
    polyline?: string;
  };
  rsvpCount: number;
  commentCount: number;
  userRsvpStatus?: 'going' | 'maybe' | 'not_going';
}