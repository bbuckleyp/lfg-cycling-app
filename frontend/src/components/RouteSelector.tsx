import React, { useState, useEffect } from 'react';
import { routesApi, stravaApi } from '../services/api';
import type { Route } from '../types/ride';

interface RouteSelectorProps {
  selectedRouteId?: number;
  onRouteSelect: (routeId: number | undefined) => void;
  error?: string;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  selectedRouteId,
  onRouteSelect,
  error,
}) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stravaConnected, setStravaConnected] = useState(false);

  useEffect(() => {
    checkStravaConnection();
    fetchRoutes();
  }, []);

  const checkStravaConnection = async () => {
    try {
      const response = await stravaApi.getStatus();
      setStravaConnected(response.connected);
    } catch (error) {
      console.error('Error checking Strava status:', error);
    }
  };

  const fetchRoutes = async (query?: string) => {
    try {
      setLoading(true);
      const response = query 
        ? await routesApi.search(query, 1, 50)
        : await routesApi.getAll(1, 50);
      setRoutes(response.routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchRoutes(searchQuery);
    } else {
      fetchRoutes();
    }
  };

  const connectStrava = async () => {
    try {
      const response = await stravaApi.getAuthUrl('/create-ride');
      window.location.href = response.authUrl;
    } catch (error) {
      console.error('Error connecting to Strava:', error);
    }
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  };

  const formatElevation = (meters?: number) => {
    return meters ? `${Math.round(meters)} m` : 'N/A';
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Route (optional)
        </label>
        
        {!stravaConnected ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-500 mb-4">Connect your Strava account to import routes</p>
            <button
              type="button"
              onClick={connectStrava}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              Connect Strava
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search routes..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Search
              </button>
            </form>

            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              <div className="p-2">
                <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="route"
                    checked={!selectedRouteId}
                    onChange={() => onRouteSelect(undefined)}
                    className="mr-3"
                  />
                  <span className="text-gray-700">No route selected</span>
                </label>
              </div>
              
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading routes...
                </div>
              ) : routes.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No routes found
                </div>
              ) : (
                routes.map((route) => (
                  <div key={route.id} className="border-t border-gray-200">
                    <label className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="route"
                        checked={selectedRouteId === route.id}
                        onChange={() => onRouteSelect(route.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{route.name}</div>
                        <div className="text-sm text-gray-500 flex gap-4">
                          <span>{formatDistance(route.distanceMeters)}</span>
                          <span>{formatElevation(route.elevationGainMeters)} elevation</span>
                          {route.estimatedTimeHours && (
                            <span>{route.estimatedTimeHours}h estimated</span>
                          )}
                        </div>
                        {route.description && (
                          <div className="text-sm text-gray-600 mt-1 truncate">
                            {route.description}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};

export default RouteSelector;