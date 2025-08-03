import { PrismaClient } from '@prisma/client';
import { StravaService } from './stravaService';

const prisma = new PrismaClient();

export class RouteService {
  private stravaService: StravaService;

  constructor() {
    this.stravaService = StravaService.getInstance();
  }

  async getRoute(routeId: number) {
    const route = await prisma.routes.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    return route;
  }

  async getRouteByStravaId(stravaRouteId: number) {
    const route = await prisma.routes.findUnique({
      where: { strava_route_id: BigInt(stravaRouteId) },
    });

    return route;
  }

  async getAllRoutes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [routes, total] = await Promise.all([
      prisma.routes.findMany({
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.routes.count(),
    ]);

    // Transform routes to match frontend expectations
    const formattedRoutes = routes.map(route => ({
      id: route.id,
      name: route.name,
      description: route.description,
      distanceMeters: route.distance_meters,
      elevationGainMeters: route.elevation_gain_meters,
      polyline: route.polyline,
      estimatedMovingTime: route.estimated_moving_time,
      stravaRouteId: route.strava_route_id ? route.strava_route_id.toString() : null,
      createdAt: route.created_at.toISOString(),
    }));

    return {
      routes: formattedRoutes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchRoutes(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [routes, total] = await Promise.all([
      prisma.routes.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.routes.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    // Transform routes to match frontend expectations
    const formattedRoutes = routes.map(route => ({
      id: route.id,
      name: route.name,
      description: route.description,
      distanceMeters: route.distance_meters,
      elevationGainMeters: route.elevation_gain_meters,
      polyline: route.polyline,
      estimatedMovingTime: route.estimated_moving_time,
      stravaRouteId: route.strava_route_id ? route.strava_route_id.toString() : null,
      createdAt: route.created_at.toISOString(),
    }));

    return {
      routes: formattedRoutes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      query,
    };
  }

  async getRouteStats(routeId: number) {
    const route = await this.getRoute(routeId);
    
    // Get usage stats
    const ridesCount = await prisma.rides.count({
      where: { route_id: routeId },
    });

    return {
      ...route,
      stravaRouteId: route.strava_route_id ? route.strava_route_id.toString() : null,
      totalRides: ridesCount,
      distanceKm: Math.round(route.distance_meters / 1000 * 100) / 100,
      elevationGainM: route.elevation_gain_meters,
      estimatedTimeHours: route.estimated_moving_time ? Math.round(route.estimated_moving_time / 3600 * 100) / 100 : null,
    };
  }

  async deleteRoute(routeId: number) {
    // Check if route is being used by any rides
    const ridesUsingRoute = await prisma.rides.count({
      where: { route_id: routeId },
    });

    if (ridesUsingRoute > 0) {
      throw new Error('Cannot delete route that is being used by rides');
    }

    await prisma.routes.delete({
      where: { id: routeId },
    });
  }
}