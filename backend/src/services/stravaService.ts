import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { StravaTokenResponse, StravaAthlete, StravaRoute, StravaRouteStream } from '../types/strava';

const prisma = new PrismaClient();

export class StravaService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl = 'https://www.strava.com/api/v3';
  private static instance: StravaService;
  private static credentialsLogged = false;

  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID || 'placeholder';
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET || 'placeholder';
    this.redirectUri = process.env.STRAVA_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/strava/callback`;

    // Only throw error in production if Strava is required
    if ((!this.clientId || this.clientId === 'placeholder') && process.env.NODE_ENV === 'production' && process.env.REQUIRE_STRAVA === 'true') {
      throw new Error('Strava API credentials are not properly configured');
    }
    
    // Only log credentials status once
    if (!StravaService.credentialsLogged) {
      if (this.clientId === 'placeholder') {
        console.warn('⚠️  Strava API credentials not configured - Strava features will not work');
      } else {
        console.log('✅ Strava API credentials configured successfully');
      }
      StravaService.credentialsLogged = true;
    }
  }

  static getInstance(): StravaService {
    if (!StravaService.instance) {
      StravaService.instance = new StravaService();
    }
    return StravaService.instance;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      approval_prompt: 'force',
      scope: 'read,activity:read,profile:read_all',
      state,
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async getAthlete(accessToken: string): Promise<StravaAthlete> {
    try {
      const response = await axios.get(`${this.baseUrl}/athlete`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching athlete:', error);
      throw new Error('Failed to fetch athlete data');
    }
  }

  async getAthleteRoutes(accessToken: string, page = 1, perPage = 30): Promise<StravaRoute[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/athlete/routes`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page,
          per_page: perPage,
        },
      });


      return response.data;
    } catch (error: any) {
      console.error('Error fetching routes:', error?.response?.data || error?.message || error);
      if (error?.response?.status === 401) {
        throw new Error('Strava authentication expired. Please reconnect to Strava.');
      }
      if (error?.response?.status === 403) {
        throw new Error('Access to Strava routes denied. Please check your Strava permissions.');
      }
      throw new Error(`Failed to fetch routes: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
    }
  }

  async getRoute(routeId: string, accessToken: string): Promise<StravaRoute> {
    try {
      console.log(`📡 Fetching route details for ID: ${routeId}`);
      console.log(`🔗 API URL: ${this.baseUrl}/routes/${routeId}`);
      
      const response = await axios.get(`${this.baseUrl}/routes/${routeId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(`✅ Route details fetched successfully for ID: ${routeId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching route details:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        
        if (error.response?.status === 401) {
          throw new Error('Invalid or expired Strava access token');
        }
        if (error.response?.status === 404) {
          throw new Error('Route not found on Strava');
        }
        if (error.response?.status === 403) {
          throw new Error('Access denied to this Strava route');
        }
      }
      throw new Error('Failed to fetch route details');
    }
  }

  async getRouteStreams(routeId: string, accessToken: string): Promise<StravaRouteStream> {
    try {
      const response = await axios.get(`${this.baseUrl}/routes/${routeId}/streams`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          keys: 'latlng,distance,altitude',
          key_by_type: true,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching route streams:', error);
      throw new Error('Failed to fetch route streams');
    }
  }

  async connectUserToStrava(userId: number, tokenData: StravaTokenResponse): Promise<void> {
    try {
      const athlete = await this.getAthlete(tokenData.access_token);

      await prisma.users.update({
        where: { id: userId },
        data: {
          strava_user_id: BigInt(athlete.id),
          strava_access_token: tokenData.access_token,
          strava_refresh_token: tokenData.refresh_token,
          profile_photo_url: athlete.profile || undefined,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Error connecting user to Strava:', error);
      throw new Error('Failed to connect user to Strava');
    }
  }

  async importRoute(routeIdString: string, accessToken: string): Promise<any> {
    try {
      console.log(`🔄 Starting route import for Strava route ID: ${routeIdString}`);
      
      // Check if route already exists
      const existingRoute = await prisma.routes.findUnique({
        where: { strava_route_id: BigInt(routeIdString) },
      });

      if (existingRoute) {
        console.log(`✅ Route ${routeIdString} already exists in database`);
        return existingRoute;
      }

      // Fetch route details and streams
      console.log(`📡 Fetching route data from Strava API...`);
      const [routeData, routeStreams] = await Promise.all([
        this.getRoute(routeIdString, accessToken),
        this.getRouteStreams(routeIdString, accessToken).catch((err) => {
          console.log(`⚠️ Could not fetch route streams (this is optional):`, err.message);
          return null;
        }),
      ]);

      console.log(`📊 Route data received:`, {
        id: routeData.id,
        id_str: routeData.id_str,
        name: routeData.name,
        distance: routeData.distance,
        elevation_gain: routeData.elevation_gain,
        estimated_moving_time: routeData.estimated_moving_time,
        hasMap: !!routeData.map,
        hasSummaryPolyline: !!routeData.map?.summary_polyline,
        hasPolyline: !!routeData.map?.polyline
      });

      // Use id_str if available, otherwise fall back to id
      const correctRouteId = routeData.id_str || routeData.id.toString();
      
      // Validate required fields
      if (!routeData.id || !routeData.name || routeData.distance === undefined) {
        throw new Error(`Missing required route data: id=${routeData.id}, name="${routeData.name}", distance=${routeData.distance}`);
      }

      // Create route in database
      const routeCreateData = {
        strava_route_id: BigInt(correctRouteId),
        name: routeData.name,
        description: routeData.description || null,
        distance_meters: Math.round(routeData.distance),
        elevation_gain_meters: Math.round(routeData.elevation_gain || 0),
        polyline: routeData.map?.summary_polyline || routeData.map?.polyline || null,
        estimated_moving_time: routeData.estimated_moving_time || null,
      };

      console.log(`💾 Creating route in database with data:`, routeCreateData);
      
      const route = await prisma.routes.create({
        data: routeCreateData,
      });

      console.log(`✅ Route ${routeIdString} imported successfully with database ID: ${route.id}`);
      
      // Convert BigInt back to string for frontend compatibility
      const routeForFrontend = {
        ...route,
        stravaRouteId: route.strava_route_id.toString(),
      };

      return routeForFrontend;
    } catch (error) {
      console.error('❌ Error importing route:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        routeId: routeIdString,
      });
      
      if (error instanceof Error) {
        throw new Error(`Failed to import route from Strava: ${error.message}`);
      }
      throw new Error('Failed to import route from Strava');
    }
  }

  async getUserAccessToken(userId: number): Promise<string> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        strava_access_token: true,
        strava_refresh_token: true,
      },
    });

    if (!user?.strava_access_token) {
      throw new Error('User is not connected to Strava');
    }

    // TODO: Check if token is expired and refresh if needed
    // For now, return the stored token
    return user.strava_access_token;
  }

  async disconnectUserFromStrava(userId: number): Promise<void> {
    try {
      await prisma.users.update({
        where: { id: userId },
        data: {
          strava_user_id: null,
          strava_access_token: null,
          strava_refresh_token: null,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Error disconnecting user from Strava:', error);
      throw new Error('Failed to disconnect user from Strava');
    }
  }
}