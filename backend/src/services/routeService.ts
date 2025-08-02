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
      where: { stravaRouteId: BigInt(stravaRouteId) },
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
          createdAt: 'desc',
        },
      }),
      prisma.routes.count(),
    ]);

    return {
      routes,
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
          createdAt: 'desc',
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

    return {
      routes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      query,
    };
  }

  async getRouteStats(routeId: number) {
    const route = await this.getRoute(routeId);
    
    // Get usage stats
    const ridesCount = await prisma.ride.count({
      where: { routeId: routeId },
    });

    return {
      ...route,
      totalRides: ridesCount,
      distanceKm: Math.round(route.distanceMeters / 1000 * 100) / 100,
      elevationGainM: route.elevationGainMeters,
      estimatedTimeHours: route.estimatedMovingTime ? Math.round(route.estimatedMovingTime / 3600 * 100) / 100 : null,
    };
  }

  async deleteRoute(routeId: number) {
    // Check if route is being used by any rides
    const ridesUsingRoute = await prisma.ride.count({
      where: { routeId: routeId },
    });

    if (ridesUsingRoute > 0) {
      throw new Error('Cannot delete route that is being used by rides');
    }

    await prisma.routes.delete({
      where: { id: routeId },
    });
  }
}