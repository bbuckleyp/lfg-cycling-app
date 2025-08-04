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
  isNoRoute?: boolean;
}

interface StravaRouteSelectorProps {
  selectedRoute?: SelectedRoute;
  onRouteSelect: (route: SelectedRoute | undefined) => void;
  error?: string;
}

type RouteSelectionMode = 'choose' | 'manual' | 'strava';

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
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [selectionMode, setSelectionMode] = useState<RouteSelectionMode>('choose');

  useEffect(() => {
    // Set initial mode based on whether a route is already selected
    if (selectedRoute) {
      if (selectedRoute.isNoRoute) {
        setSelectionMode('manual');
      } else {
        setSelectionMode('strava');
      }
    } else {
      setSelectionMode('choose');
    }
  }, [selectedRoute]);

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
    setShowRouteSelector(false);
  };

  const handleClearSelection = () => {
    onRouteSelect(undefined);
    setSelectionMode('choose');
    setShowRouteSelector(false);
  };

  const handleChangeRoute = () => {
    setSelectionMode('choose');
    setShowRouteSelector(false);
  };

  const handleManualEntry = () => {
    const noRouteSelection = {
      stravaId: 'manual',
      name: 'Manual Entry',
      distance: 0,
      elevationGain: 0,
      estimatedTime: 0,
      isNoRoute: true,
    };
    onRouteSelect(noRouteSelection);
    setSelectionMode('manual');
  };

  const handleStravaImport = async () => {
    setSelectionMode('strava');
    if (user && !stravaConnected) {
      await initializeStravaData();
    }
    setShowRouteSelector(true);
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

  // Render initial choice screen
  if (selectionMode === 'choose') {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Route (optional)
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleManualEntry}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Manual Entry</h3>
            <p className="text-sm text-gray-500">Enter distance and elevation manually</p>
          </button>
          
          <button
            type="button"
            onClick={handleStravaImport}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Import from Strava</h3>
            <p className="text-sm text-gray-500">Choose from your saved Strava routes</p>
          </button>
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Render manual entry mode
  if (selectionMode === 'manual') {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Route (optional)
        </label>
        
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Manual Entry</h4>
              <p className="text-sm text-gray-600 mb-3">Enter your route information</p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Distance (miles)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                      onChange={(e) => {
                        const miles = parseFloat(e.target.value) || 0;
                        const meters = miles * 1609.34;
                        const updatedRoute = {
                          ...selectedRoute!,
                          distance: meters
                        };
                        onRouteSelect(updatedRoute);
                      }}
                      defaultValue={selectedRoute && selectedRoute.distance > 0 ? (selectedRoute.distance * 0.000621371).toFixed(1) : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Elevation (feet)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                      onChange={(e) => {
                        const feet = parseFloat(e.target.value) || 0;
                        const meters = feet * 0.3048;
                        const updatedRoute = {
                          ...selectedRoute!,
                          elevationGain: meters
                        };
                        onRouteSelect(updatedRoute);
                      }}
                      defaultValue={selectedRoute && selectedRoute.elevationGain > 0 ? Math.round(selectedRoute.elevationGain * 3.28084).toString() : ''}
                    />
                  </div>
                </div>
                {selectedRoute && (selectedRoute.distance > 0 || selectedRoute.elevationGain > 0) && (
                  <div className="text-xs text-gray-500">
                    {selectedRoute.distance > 0 && `${formatDistance(selectedRoute.distance)}`}
                    {selectedRoute.distance > 0 && selectedRoute.elevationGain > 0 && ' • '}
                    {selectedRoute.elevationGain > 0 && `${formatElevation(selectedRoute.elevationGain)} elevation`}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2 ml-4">
              <button
                type="button"
                onClick={handleChangeRoute}
                className="text-sm text-primary-600 hover:text-primary-800 underline"
              >
                Change Method
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Clear Route
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Render Strava mode
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

      {selectedRoute && !selectedRoute.isNoRoute && !showRouteSelector ? (
        // Show selected Strava route
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
            <div className="flex flex-col space-y-2 ml-4">
              <button
                type="button"
                onClick={handleChangeRoute}
                className="text-sm text-primary-600 hover:text-primary-800 underline"
              >
                Change Method
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Clear Route
              </button>
            </div>
          </div>
        </div>
      ) : !stravaConnected ? (
        // Show Strava connection
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Connect to Strava</h3>
          <p className="text-gray-500 mb-4">Connect your Strava account to select a route for this ride</p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={connectStrava}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              Connect Strava Account
            </button>
            <div>
              <button
                type="button"
                onClick={handleChangeRoute}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Choose different method
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="border border-gray-300 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading your Strava routes...</p>
        </div>
      ) : (
        // Show Strava route selector
        <div className="border border-gray-300 rounded-lg">
          <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Select a Route from Strava</h4>
              <p className="text-sm text-gray-600">Choose one of your saved Strava routes for this ride</p>
            </div>
            <button
              type="button"
              onClick={handleChangeRoute}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Change Method
            </button>
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
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {stravaRoutes.map((route) => (
                <div key={route.id} className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleRouteSelect(route)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex">
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
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default StravaRouteSelector;