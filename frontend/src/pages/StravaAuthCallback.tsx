import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StravaAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const stravaStatus = searchParams.get('strava');
        const token = searchParams.get('token');
        const action = searchParams.get('action');
        const message = searchParams.get('message');

        if (stravaStatus === 'error') {
          throw new Error(message ? decodeURIComponent(message) : 'Strava authentication failed');
        }

        if (stravaStatus === 'success' && token) {
          // Store token in localStorage
          localStorage.setItem('token', token);
          
          // Fetch user data using the token
          const userResponse = await authApi.getMe();
          localStorage.setItem('user', JSON.stringify(userResponse.user));
          
          // Ensure data is persisted before redirecting
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Force a page reload to ensure AuthContext picks up the new data
          window.location.href = '/dashboard';
        } else {
          throw new Error('Invalid callback parameters');
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Completing Strava Authentication...
            </h2>
            <p className="mt-2 text-gray-600">
              Please wait while we sign you in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StravaAuthCallback;