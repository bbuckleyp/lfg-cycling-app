import React, { useState, useEffect } from 'react';
import { stravaApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface StravaRoute {
  id: number;
  id_str?: string;
  name: string;
  description: string;
  distance: number;
  elevation_gain: number;
  estimated_moving_time: number;
  map: {
    summary_polyline: string;
  };
  map_urls?: {
    url: string;
    retina_url: string;
    light_url: string;
    dark_url: string;
  };
}

interface SelectedRoute {
  stravaId: string;
  name: string;
  distance: number;
  elevationGain: number;
  estimatedTime: number;
}

interface StravaRouteSelectorProps {
  selectedRoute?: SelectedRoute;
  onRouteSelect: (route: SelectedRoute | undefined) => void;
  error?: string;
}

const StravaRouteSelector: React.FC<StravaRouteSelectorProps> = ({
  selectedRoute,
  onRouteSelect,
  error,
}) => {
  const { user } = useAuth();
  const [stravaRoutes, setStravaRoutes] = useState<StravaRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [connectError, setConnectError] = useState<string>('');

  useEffect(() => {
    if (user) {
      initializeStravaData();
    }
  }, [user]);

  const initializeStravaData = async () => {
    try {
      setLoading(true);
      setConnectError('');
      
      // Check Strava connection status
      const statusResponse = await stravaApi.getStatus();
      setStravaConnected(statusResponse.connected);
      
      if (statusResponse.connected) {
        // Fetch routes from Strava
        const routesResponse = await stravaApi.getRoutes(1, 50);
        setStravaRoutes(routesResponse.routes);
      }
    } catch (err: any) {
      setConnectError(err.response?.data?.error || 'Failed to load Strava routes');
      setStravaConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const connectStrava = async () => {
    try {
      setConnectError('');
      const response = await stravaApi.getAuthUrl('/create-ride');
      window.location.href = response.authUrl;
    } catch (error) {
      setConnectError('Failed to connect to Strava');
    }
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  };

  const formatElevation = (meters: number) => {
    return `${Math.round(meters)} m`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleRouteSelect = (route: StravaRoute) => {
    const routeId = route.id_str || route.id.toString();
    const selectedRouteData: SelectedRoute = {
      stravaId: routeId,
      name: route.name,
      distance: route.distance,
      elevationGain: route.elevation_gain,
      estimatedTime: route.estimated_moving_time,
    };
    onRouteSelect(selectedRouteData);
  };

  const handleClearSelection = () => {
    onRouteSelect(undefined);
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Route (optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <p className="text-gray-500">Please sign in to select a route from Strava</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Route (optional)
      </label>
      
      {connectError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {connectError}
          <button
            onClick={() => setConnectError('')}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!stravaConnected ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Connect to Strava</h3>
          <p className="text-gray-500 mb-4">Connect your Strava account to select a route for this ride</p>
          <button
            type="button"
            onClick={connectStrava}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            Connect Strava Account
          </button>
        </div>
      ) : loading ? (
        <div className="border border-gray-300 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading your Strava routes...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedRoute ? (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Selected Route</h4>
                  <p className="text-sm font-medium text-primary-800">{selectedRoute.name}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <span>{formatDistance(selectedRoute.distance)}</span>
                    <span>{formatElevation(selectedRoute.elevationGain)} elevation</span>
                    {selectedRoute.estimatedTime > 0 && (
                      <span>{formatTime(selectedRoute.estimatedTime)} estimated</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="ml-4 text-sm text-primary-600 hover:text-primary-800 underline"
                >
                  Change Route
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h4 className="font-medium text-gray-900">Select a Route from Strava</h4>
                <p className="text-sm text-gray-600">Choose one of your saved Strava routes for this ride</p>
              </div>
              
              {stravaRoutes.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No routes found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    You don't have any saved routes in your Strava account yet.
                  </p>
                  <a
                    href="https://www.strava.com/routes/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Create Route on Strava
                  </a>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Skip route selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded border-b border-gray-100"
                    >
                      <span className="text-gray-700 font-medium">No route - just a meetup</span>
                      <p className="text-sm text-gray-500">Riders will meet but no specific route is planned</p>
                    </button>
                  </div>
                  
                  {stravaRoutes.map((route) => (
                    <div key={route.id} className="border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleRouteSelect(route)}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex">
                          {/* Route Thumbnail */}
                          <div className="flex-shrink-0 w-20 h-16 mr-4">
                            {route.map_urls?.url ? (
                              <img
                                src={route.map_urls.url}
                                alt={`Map of ${route.name}`}
                                className="w-full h-full object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-gray-100 rounded border flex items-center justify-center ${route.map_urls?.url ? 'hidden' : ''}`}>
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Route Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{route.name}</h4>
                            {route.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{route.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                              <span>{formatDistance(route.distance)}</span>
                              <span>{formatElevation(route.elevation_gain)} elevation</span>
                              {route.estimated_moving_time > 0 && (
                                <span>{formatTime(route.estimated_moving_time)} estimated</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default StravaRouteSelector;