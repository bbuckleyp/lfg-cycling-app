export interface Event {
  id: number;
  eventType: 'ride' | 'race';
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

export interface EventWithDetails extends Event {
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
    description?: string;
    distanceMeters: number;
    elevationGainMeters?: number;
    polyline?: string;
    mapImageUrl?: string;
    estimatedMovingTime?: number;
    difficultyLevel?: string;
  };
  rsvpCount: number;
  commentCount: number;
  userRsvpStatus?: 'going' | 'maybe' | 'not_going';
}

export interface CreateEventRequest {
  eventType: 'ride' | 'race';
  title: string;
  description?: string;
  startDate: string;
  startTime: string;
  startLocation: string;
  pace: 'social' | 'tempo' | 'race';
  isPublic?: boolean;
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
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  startLocation?: string;
  pace?: 'social' | 'tempo' | 'race';
  isPublic?: boolean;
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
  status?: 'active' | 'cancelled' | 'completed';
}

export interface EventFilters {
  eventType?: 'ride' | 'race';
  search?: string;
  pace?: 'social' | 'tempo' | 'race';
  status?: 'active' | 'cancelled' | 'completed';
  startDate?: string;
  endDate?: string;
  organizerId?: number;
  isPublic?: boolean;
  page?: number;
  limit?: number;
}