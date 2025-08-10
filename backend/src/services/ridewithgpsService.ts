export interface RideWithGPSRouteData {
  id: string;
  name: string;
  description?: string;
  distance: number;
  elevationGain?: number;
  estimatedTime?: number;
}

export class RideWithGPSService {
  /**
   * Parse RideWithGPS URL to extract route ID
   * Supports URLs like:
   * - https://ridewithgps.com/routes/12345
   * - https://ridewithgps.com/routes/12345/something-else
   * - https://www.ridewithgps.com/routes/12345
   */
  parseRouteUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a RideWithGPS domain
      if (!urlObj.hostname.includes('ridewithgps.com')) {
        return null;
      }
      
      // Extract route ID from path
      const pathParts = urlObj.pathname.split('/');
      const routeIndex = pathParts.findIndex(part => part === 'routes');
      
      if (routeIndex !== -1 && routeIndex + 1 < pathParts.length) {
        const routeId = pathParts[routeIndex + 1];
        // Validate that it's a numeric ID
        if (/^\d+$/.test(routeId)) {
          return routeId;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create route data from RideWithGPS URL
   * Attempts to fetch basic route information from the RideWithGPS page
   */
  async createRouteFromUrl(url: string, customName?: string): Promise<RideWithGPSRouteData | null> {
    const routeId = this.parseRouteUrl(url);
    if (!routeId) {
      throw new Error('Invalid RideWithGPS URL format');
    }

    let routeData: RideWithGPSRouteData = {
      id: routeId,
      name: customName || `RideWithGPS Route ${routeId}`,
      description: `Imported from RideWithGPS: ${url}`,
      distance: 0,
      elevationGain: 0,
      estimatedTime: 0,
    };

    try {
      // Attempt to fetch route metadata from RideWithGPS page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LFG-Cycling-App/1.0)',
        },
      });

      if (response.ok) {
        const html = await response.text();
        
        // Extract route name from page title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1] && !customName) {
          routeData.name = titleMatch[1].replace(' | RideWithGPS', '').trim();
        }

        // Extract distance (look for patterns like "45.2 mi" or "72.8 km")
        const distanceMatch = html.match(/(\d+\.?\d*)\s*(mi|miles|km|kilometers)/i);
        if (distanceMatch) {
          const value = parseFloat(distanceMatch[1]);
          const unit = distanceMatch[2].toLowerCase();
          // Convert to meters
          if (unit.startsWith('mi')) {
            routeData.distance = value * 1609.34; // miles to meters
          } else if (unit.startsWith('km')) {
            routeData.distance = value * 1000; // km to meters
          }
        }

        // Extract elevation gain (look for patterns like "2,584 ft" or "788 m")
        const elevationMatch = html.match(/(\d+,?\d*)\s*(ft|feet|m|meters)/i);
        if (elevationMatch) {
          const value = parseFloat(elevationMatch[1].replace(',', ''));
          const unit = elevationMatch[2].toLowerCase();
          // Convert to meters
          if (unit.startsWith('ft')) {
            routeData.elevationGain = value * 0.3048; // feet to meters
          } else if (unit.startsWith('m')) {
            routeData.elevationGain = value; // already meters
          }
        }

        console.log(`RideWithGPS: Successfully scraped route data for ${routeId}:`, routeData);
      }
    } catch (error) {
      console.warn(`RideWithGPS: Failed to fetch route metadata for ${routeId}:`, error);
      // Continue with placeholder data
    }

    return routeData;
  }

  /**
   * Validate that a RideWithGPS URL is accessible
   * This is a basic check - we could enhance it with actual HTTP requests
   */
  validateRouteUrl(url: string): boolean {
    return this.parseRouteUrl(url) !== null;
  }
}

export const ridewithgpsService = new RideWithGPSService();