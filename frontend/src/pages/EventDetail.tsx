import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO, isAfter } from 'date-fns';
import { eventsApi, rsvpApi } from '../services/api';
import type { EventWithDetails } from '../types/event';
import { useAuth } from '../context/AuthContext';
import RsvpButton from '../components/RsvpButton';
import RsvpList from '../components/RsvpList';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import RouteMap from '../components/RouteMap';
import ElevationProfile from '../components/ElevationProfile';
import StravaEmbed from '../components/StravaEmbed';

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userRsvpStatus, setUserRsvpStatus] = useState<'going' | 'maybe' | 'not_going' | null>(null);
  const [rsvpRefreshTrigger, setRsvpRefreshTrigger] = useState(0);
  const [commentsRefreshTrigger, setCommentsRefreshTrigger] = useState(0);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      if (user) {
        fetchUserRsvp();
      }
    }
  }, [eventId, user]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError('');
      const response = await eventsApi.getById(parseInt(eventId));
      setEvent(response.event);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRsvp = async () => {
    if (!eventId || !user) return;

    try {
      const response = await rsvpApi.getUserRsvp(parseInt(eventId));
      setUserRsvpStatus(response.rsvp?.status || null);
    } catch (err: any) {
      // User hasn't RSVP'd, which is fine
      setUserRsvpStatus(null);
    }
  };

  const handleRsvpChange = (status: 'going' | 'maybe' | 'not_going' | null) => {
    setUserRsvpStatus(status);
    setRsvpRefreshTrigger(prev => prev + 1);
    // Update the event's RSVP count
    if (event) {
      setEvent({
        ...event,
        userRsvpStatus: status || undefined,
      });
    }
  };

  const handleCommentAdded = () => {
    setCommentsRefreshTrigger(prev => prev + 1);
    // Update comment count in event
    if (event) {
      setEvent({
        ...event,
        commentCount: event.commentCount + 1,
      });
    }
  };

  const getEventTypeColor = (type: 'ride' | 'race') => {
    return type === 'race' ? 'orange' : 'primary';
  };

  const getEventTypeDisplayName = (type: 'ride' | 'race') => {
    return type === 'race' ? 'Race' : 'Ride';
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

  const getPaceDisplayName = (pace: string) => {
    switch (pace) {
      case 'social':
        return 'Social';
      case 'tempo':
        return 'Tempo';
      case 'race':
        return 'Race';
      default:
        return pace;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  const formatDistance = (meters: number) => {
    const miles = meters * 0.000621371;
    return miles >= 10 ? `${Math.round(miles)} miles` : `${miles.toFixed(1)} miles`;
  };

  const formatElevation = (meters: number) => {
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  };

  const isEventPast = () => {
    if (!event) return false;
    const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
    return !isAfter(eventDateTime, new Date());
  };

  const isUserOrganizer = () => {
    return user && event && user.id === event.organizer.id;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The event you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const colorClass = getEventTypeColor(event.eventType);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/events')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.eventType === 'race' ? 'bg-orange-100 text-orange-800' : 'bg-primary-100 text-primary-800'
            }`}>
              {getEventTypeDisplayName(event.eventType)}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPaceBadgeColor(event.pace)}`}>
              {getPaceDisplayName(event.pace)} Pace
            </span>
          </div>

          {isUserOrganizer() && (
            <Link
              to={`/events/${event.id}/edit`}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                event.eventType === 'race'
                  ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
              }`}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

        {event.description && (
          <p className="text-lg text-gray-600 mb-6">{event.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Date</h3>
                <p className="text-sm text-gray-900">{formatDate(event.startDate)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Time</h3>
                <p className="text-sm text-gray-900">{formatTime(event.startTime)}</p>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Start Location</h3>
                <p className="text-sm text-gray-900">{event.startLocation}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Organizer</h3>
                <div className="flex items-center space-x-2">
                  {event.organizer.profilePhotoUrl ? (
                    <img
                      className="h-6 w-6 rounded-full"
                      src={event.organizer.profilePhotoUrl}
                      alt={`${event.organizer.firstName} ${event.organizer.lastName}`}
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">
                        {event.organizer.firstName[0]}{event.organizer.lastName[0]}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-900">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Participants</h3>
                <p className="text-sm text-gray-900">{event.rsvpCount} people RSVP'd</p>
              </div>
            </div>
          </div>

          {/* Route Information */}
          {event.route && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Route</h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{event.route.name}</h3>
                {event.route.description && (
                  <p className="text-gray-600 mb-4">{event.route.description}</p>
                )}
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {formatDistance(event.route.distanceMeters)}
                  </span>
                  {event.route.elevationGainMeters && (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-6m0 0l5 6m-5-6v18" />
                      </svg>
                      {formatElevation(event.route.elevationGainMeters)}
                    </span>
                  )}
                  {event.route.estimatedMovingTime && (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {Math.round(event.route.estimatedMovingTime / 60)} min
                    </span>
                  )}
                </div>
              </div>

              {/* Show Strava embed for Strava routes, otherwise show RouteMap for polyline routes */}
              {event.route.stravaRouteId ? (
                <StravaEmbed
                  stravaRouteId={event.route.stravaRouteId}
                  routeName={event.route.name}
                  distance={event.route.distanceMeters}
                  elevationGain={event.route.elevationGainMeters}
                  className="h-96 w-full"
                />
              ) : event.route.polyline ? (
                <>
                  <RouteMap polyline={event.route.polyline} />
                  {event.route.elevationGainMeters && (
                    <div className="mt-4">
                      <ElevationProfile polyline={event.route.polyline} />
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 w-full flex items-center justify-center bg-gray-100 rounded border text-gray-500 text-sm">
                  No route preview available
                </div>
              )}
            </div>
          )}

          {/* Distance/Elevation for events without routes */}
          {!event.route && (event.distanceMeters || event.elevationGainMeters) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Information</h2>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                {event.distanceMeters && (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {formatDistance(event.distanceMeters)}
                  </span>
                )}
                {event.elevationGainMeters && (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-6m0 0l5 6m-5-6v18" />
                    </svg>
                    {formatElevation(event.elevationGainMeters)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Discussion ({event.commentCount})
            </h2>
            
            <CommentForm
              eventId={event.id}
              onCommentAdded={handleCommentAdded}
            />
            
            <CommentList
              eventId={event.id}
              refreshTrigger={commentsRefreshTrigger}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* RSVP Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isEventPast() ? 'Event Status' : 'RSVP'}
            </h3>
            
            {isEventPast() ? (
              <div className="text-center py-4">
                <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  This event has ended
                </span>
              </div>
            ) : (
              <RsvpButton
                eventId={event.id}
                currentStatus={userRsvpStatus || undefined}
                isOrganizer={isUserOrganizer()}
                onRsvpChange={handleRsvpChange}
              />
            )}
          </div>

          {/* Participants List */}
          <RsvpList
            eventId={event.id}
            refreshTrigger={rsvpRefreshTrigger}
          />
        </div>
      </div>
    </div>
  );
};

export default EventDetail;