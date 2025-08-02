import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stravaApi } from '../services/api';

const StravaCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        
        // Handle Strava authorization errors
        if (errorParam) {
          throw new Error(`Strava authorization failed: ${errorParam}`);
        }
        
        if (!code) {
          throw new Error('No authorization code received from Strava');
        }

        if (!state) {
          throw new Error('No state parameter received');
        }

        // Parse the state to get redirect URL
        const stateData = JSON.parse(atob(state));
        const redirectUrl = stateData.redirectUrl || '/dashboard';

        // Exchange code for token
        await stravaApi.connect(code, state);

        // Redirect to the original page with success indicator
        navigate(`${redirectUrl}?strava=connected`);
      } catch (err: any) {
        console.error('Strava callback error:', err);
        setError(err.message || 'Failed to connect to Strava');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Connecting to Strava...
          </h2>
          <p className="mt-2 text-gray-600">
            Please wait while we complete the connection.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Failed
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default StravaCallback;