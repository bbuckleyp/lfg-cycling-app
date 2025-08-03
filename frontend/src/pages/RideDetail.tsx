import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ridesApi } from '../services/api';
import type { RideWithDetails } from '../types/ride';
import { useAuth } from '../context/AuthContext';
import RsvpButton from '../components/RsvpButton';
import RsvpList from '../components/RsvpList';
import StravaEmbed from '../components/StravaEmbed';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';

const RideDetail: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ride, setRide] = useState<RideWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [rsvpRefreshTrigger, setRsvpRefreshTrigger] = useState(0);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);

  useEffect(() => {
    if (rideId) {
      fetchRide();
    }
  }, [rideId]);

  const fetchRide = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ridesApi.getById(parseInt(rideId!));
      setRide(response.ride);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch ride details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  };

  const formatElevation = (meters?: number) => {
    return meters ? `${Math.round(meters)} m` : 'N/A';
  };

  const getPaceBadgeColor = (pace: string) => {
    switch (pace) {
      case 'social':
        return 'bg-green-100 text-green-800';
      case 'tempo':
        return 'bg-yellow-100 text-yellow-800';
      case 'race':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaceDescription = (pace: string) => {
    switch (pace) {
      case 'social':
        return 'Easy pace, focus on enjoying the ride together';
      case 'tempo':
        return 'Moderate pace, some effort but still conversational';
      case 'race':
        return 'Fast pace, high intensity training or competitive';
      default:
        return '';
    }
  };

  const handleRsvpChange = () => {
    setRsvpRefreshTrigger(prev => prev + 1);
    fetchRide(); // Refresh ride data to update counts
  };

  const handleCommentAdded = () => {
    setCommentRefreshTrigger(prev => prev + 1);
  };

  const isOrganizer = !!(user && ride && user.id === ride.organizer.id);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ride not found</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'The ride you\'re looking for doesn\'t exist.'}</p>
          <div className="mt-6">
            <Link
              to="/rides"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Browse Other Rides
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/rides" className="text-gray-400 hover:text-gray-500">
                <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="sr-only">Back</span>
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link to="/rides" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Rides
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">
                  {ride.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Main ride info */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{ride.title}</h1>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize w-fit ${getPaceBadgeColor(ride.pace)}`}>
                      {ride.pace}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getPaceDescription(ride.pace)}
                    </span>
                  </div>
                </div>

                {isOrganizer && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/rides/${ride.id}/edit`)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {ride.description && (
                <div className="mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{ride.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">When</h3>
                  <div className="flex items-center text-gray-900">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium">{formatDate(ride.startDate)}</p>
                      <p className="text-sm text-gray-500">{formatTime(ride.startTime)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Where</h3>
                  <div className="flex items-center text-gray-900">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p>{ride.startLocation}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Organizer</h3>
                  <div className="flex items-center">
                    {ride.organizer.profilePhotoUrl ? (
                      <img
                        className="h-8 w-8 rounded-full mr-3"
                        src={ride.organizer.profilePhotoUrl}
                        alt={`${ride.organizer.firstName} ${ride.organizer.lastName}`}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary-600">
                          {ride.organizer.firstName[0]}{ride.organizer.lastName[0]}
                        </span>
                      </div>
                    )}
                    <p className="font-medium text-gray-900">
                      {ride.organizer.firstName} {ride.organizer.lastName}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Participants</h3>
                  <div className="flex items-center text-gray-900">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-7.5l-3 3m0 0l-3-3m3 3V9a6 6 0 00-6-6" />
                    </svg>
                    <p>
                      {ride.rsvpCount} going
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Route information */}
          {ride.route && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-4 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Route Details</h2>
                
                {/* Route stats */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{ride.route.name}</h3>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Distance</p>
                      <p className="font-medium text-gray-900">{formatDistance(ride.route.distanceMeters)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Elevation Gain</p>
                      <p className="font-medium text-gray-900">{formatElevation(ride.route.elevationGainMeters)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Source</p>
                      <p className="font-medium text-gray-900">Strava Route</p>
                    </div>
                  </div>
                </div>

                {/* Strava Route Map with Elevation Profile */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Route Map & Elevation Profile</h3>
                  <StravaEmbed
                    stravaRouteId={ride.route.stravaRouteId}
                    distance={ride.route.distanceMeters}
                    elevationGain={ride.route.elevationGainMeters}
                    className="min-h-[600px] w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Interactive route map and elevation profile powered by Strava
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Participants section */}
          <RsvpList rideId={ride.id} refreshTrigger={rsvpRefreshTrigger} />

          {/* Comments section */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-4 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Discussion</h2>
              
              <div className="space-y-6">
                <CommentForm 
                  rideId={ride.id} 
                  onCommentAdded={handleCommentAdded} 
                />
                
                <CommentList 
                  rideId={ride.id} 
                  onCommentAdded={handleCommentAdded}
                  key={commentRefreshTrigger}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* RSVP section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Join This Ride</h3>
            <RsvpButton
              rideId={ride.id}
              currentStatus={ride.userRsvpStatus}
              isOrganizer={isOrganizer}
              onRsvpChange={handleRsvpChange}
              disabled={ride.status !== 'active'}
            />
            
            {ride.status !== 'active' && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                This ride is {ride.status}
              </p>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Info</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">{format(parseISO(ride.createdAt), 'MMM d, yyyy')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900 capitalize">{ride.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Visibility</dt>
                <dd className="text-sm text-gray-900">{ride.isPublic ? 'Public' : 'Private'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetail;