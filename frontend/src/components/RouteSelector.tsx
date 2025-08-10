import React, { useState, useEffect } from 'react';
import { stravaApi, eventsApi } from '../services/api';
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
  type: 'strava' | 'ridewithgps' | 'manual' | 'none';
  stravaId?: string;
  ridewithgpsId?: string;
  name: string;
  distance: number;
  elevationGain: number;
  estimatedTime: number;
  isNoRoute?: boolean;
}

interface RouteSelectorProps {
  selectedRoute?: SelectedRoute;
  onRouteSelect: (route: SelectedRoute | undefined) => void;
  error?: string;
}

type RouteSelectionMode = 'choose' | 'manual' | 'strava' | 'ridewithgps';

const RouteSelector: React.FC<RouteSelectorProps> = ({
  selectedRoute,
  onRouteSelect,
  error,
}) => {
  const { user } = useAuth();
  const [stravaRoutes, setStravaRoutes] = useState<StravaRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [connectError, setConnectError] = useState<string>('');
  const [mode, setMode] = useState<RouteSelectionMode>('choose');
  
  // RideWithGPS specific state
  const [ridewithgpsUrl, setRidewithgpsUrl] = useState('');
  const [ridewithgpsLoading, setRidewithgpsLoading] = useState(false);
  const [ridewithgpsError, setRidewithgpsError] = useState('');
  
  // Manual route state
  const [manualDistance, setManualDistance] = useState<string>('');
  const [manualElevation, setManualElevation] = useState<string>('');

  useEffect(() => {
    checkStravaConnection();
  }, [user]);

  const checkStravaConnection = async () => {
    if (!user) return;
    
    try {
      setStravaConnected(!!user.stravaUserId);
    } catch (error) {
      console.error('Error checking Strava connection:', error);
    }
  };

  const fetchStravaRoutes = async () => {
    if (!stravaConnected) return;
    
    try {
      setLoading(true);
      setConnectError('');
      const response = await stravaApi.getRoutes();
      console.log('Strava API response:', response);
      
      // The API returns { routes, page, perPage }
      const routes = response?.routes || [];
      setStravaRoutes(Array.isArray(routes) ? routes : []);
    } catch (err: any) {
      console.error('Error fetching Strava routes:', err);
      setConnectError(err.response?.data?.error || 'Failed to load Strava routes');
    } finally {
      setLoading(false);
    }
  };

  const handleStravaRouteSelect = (route: StravaRoute) => {
    const selectedRoute: SelectedRoute = {
      type: 'strava',
      stravaId: route.id_str || route.id.toString(),
      name: route.name,
      distance: route.distance,
      elevationGain: route.elevation_gain,
      estimatedTime: route.estimated_moving_time,
    };
    onRouteSelect(selectedRoute);
  };

  const handleRidewithgpsSubmit = async () => {
    if (!ridewithgpsUrl.trim()) {
      setRidewithgpsError('Please enter a RideWithGPS URL');
      return;
    }

    try {
      setRidewithgpsLoading(true);
      setRidewithgpsError('');
      
      const response = await eventsApi.parseRidewithgpsUrl({
        url: ridewithgpsUrl.trim(),
      });

      const selectedRoute: SelectedRoute = {
        type: 'ridewithgps',
        ridewithgpsId: response.routeData.id,
        name: response.routeData.name,
        distance: response.routeData.distance,
        elevationGain: response.routeData.elevationGain || 0,
        estimatedTime: response.routeData.estimatedTime || 0,
      };
      
      console.log('RouteSelector: RideWithGPS route selected:', selectedRoute);
      onRouteSelect(selectedRoute);
    } catch (err: any) {
      setRidewithgpsError(err.response?.data?.error || 'Failed to parse RideWithGPS URL');
    } finally {
      setRidewithgpsLoading(false);
    }
  };

  const handleManualRouteSubmit = () => {
    const distance = parseFloat(manualDistance);
    const elevation = parseFloat(manualElevation) || 0;
    
    if (isNaN(distance) || distance <= 0) {
      return;
    }

    const selectedRoute: SelectedRoute = {
      type: 'manual',
      name: 'Manual Route Details',
      distance: distance * 1609.34, // Convert miles to meters
      elevationGain: elevation * 0.3048, // Convert feet to meters
      estimatedTime: 0,
      isNoRoute: true,
    };
    
    onRouteSelect(selectedRoute);
  };

  const handleNoRoute = () => {
    onRouteSelect(undefined);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Route (Optional)
        </label>
        
        {selectedRoute ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded text-white text-xs font-bold flex items-center justify-center ${
                  selectedRoute.type === 'strava' ? 'bg-orange-500' : 
                  selectedRoute.type === 'ridewithgps' ? 'bg-blue-500' : 
                  'bg-green-500'
                }`}>
                  {selectedRoute.type === 'strava' ? 'S' : selectedRoute.type === 'ridewithgps' ? 'R' : 'M'}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedRoute.name}</h4>
                  <div className="text-sm text-gray-500 mt-1">
                    {(selectedRoute.distance / 1609.34).toFixed(1)} miles
                    {selectedRoute.elevationGain > 0 && (
                      <> • {Math.round(selectedRoute.elevationGain * 3.28084)} ft elevation</>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {setMode('choose'); onRouteSelect(undefined);}}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : mode === 'choose' ? (
          <div className="flex flex-col space-y-3">
            {stravaConnected && (
              <button
                onClick={() => {setMode('strava'); fetchStravaRoutes();}}
                className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">S</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Import from Strava</div>
                    <div className="text-sm text-gray-500">Select from your existing Strava routes</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            <button
              onClick={() => setMode('ridewithgps')}
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">R</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Import from RideWithGPS</div>
                  <div className="text-sm text-gray-500">Enter a RideWithGPS route URL</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setMode('manual')}
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Manual Route Details</div>
                  <div className="text-sm text-gray-500">Enter distance and elevation manually</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              type="button"
              onClick={handleNoRoute}
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">No Specific Route</div>
                  <div className="text-sm text-gray-500">Skip route details for now</div>
                </div>
              </div>
            </button>
          </div>
        ) : mode === 'strava' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Select Strava Route</h3>
              <button
                onClick={() => setMode('choose')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading your Strava routes...</p>
              </div>
            ) : connectError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {connectError}
              </div>
            ) : !Array.isArray(stravaRoutes) || stravaRoutes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No Strava routes found.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stravaRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => handleStravaRouteSelect(route)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{route.name}</div>
                    <div className="text-sm text-gray-500">
                      {(route.distance / 1609.34).toFixed(1)} mi • {Math.round(route.elevation_gain * 3.28084)} ft elevation
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : mode === 'ridewithgps' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Import from RideWithGPS</h3>
              <button
                onClick={() => setMode('choose')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RideWithGPS Route URL
                </label>
                <input
                  type="url"
                  value={ridewithgpsUrl}
                  onChange={(e) => setRidewithgpsUrl(e.target.value)}
                  placeholder="https://ridewithgps.com/routes/12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste the URL of your RideWithGPS route (e.g., https://ridewithgps.com/routes/12345)
                </p>
              </div>
              
              {ridewithgpsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {ridewithgpsError}
                </div>
              )}
              
              <button
                onClick={handleRidewithgpsSubmit}
                disabled={ridewithgpsLoading || !ridewithgpsUrl.trim()}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ridewithgpsLoading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Importing Route...
                  </>
                ) : (
                  'Import Route'
                )}
              </button>
            </div>
          </div>
        ) : mode === 'manual' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Manual Route Details</h3>
              <button
                onClick={() => setMode('choose')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance (miles) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualDistance}
                    onChange={(e) => setManualDistance(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Elevation Gain (feet)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={manualElevation}
                    onChange={(e) => setManualElevation(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={handleManualRouteSubmit}
                disabled={!manualDistance || parseFloat(manualDistance) <= 0}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Route Details
              </button>
            </div>
          </div>
        ) : null}
        
        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteSelector;