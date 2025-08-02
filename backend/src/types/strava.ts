export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  state: string;
  country: string;
}

export interface StravaRoute {
  id: number;
  id_str?: string; // String representation of the ID for large numbers
  name: string;
  description: string;
  distance: number;
  elevation_gain: number;
  map: {
    id: string;
    polyline: string;
    resource_state: number;
    summary_polyline: string;
  };
  map_urls: {
    url: string;
    retina_url: string;
    light_url: string;
    dark_url: string;
  };
  type: number;
  sub_type: number;
  private: boolean;
  starred: boolean;
  timestamp: string;
  segments: any[];
  estimated_moving_time: number;
}

export interface StravaRouteStream {
  latlng?: {
    type: 'latlng';
    data: [number, number][];
    series_type: 'distance';
    original_size: number;
    resolution: 'high' | 'medium' | 'low';
  };
  distance?: {
    type: 'distance';
    data: number[];
    series_type: 'distance';
    original_size: number;
    resolution: 'high' | 'medium' | 'low';
  };
  altitude?: {
    type: 'altitude';
    data: number[];
    series_type: 'distance';
    original_size: number;
    resolution: 'high' | 'medium' | 'low';
  };
}

export interface StravaAuthState {
  userId: number;
  redirectUrl?: string;
}