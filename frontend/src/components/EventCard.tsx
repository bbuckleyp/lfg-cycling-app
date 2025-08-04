import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { EventWithDetails } from '../types/event';
import { useAuth } from '../context/AuthContext';
import StravaRoutePreview from './StravaRoutePreview';

interface EventCardProps {
  event: EventWithDetails;
  viewMode?: 'grid' | 'list';
  linkPath?: string;
  eventType?: 'ride' | 'race';
}

const EventCard: React.FC<EventCardProps> = ({ event, viewMode = 'grid', linkPath, eventType }) => {
  const { user } = useAuth();
  const isOrganizer = user?.id === event.organizer.id;
  const eventPath = linkPath || `/events/${event.id}`;
  
  
  
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) {
        return 'Invalid date';
      }
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return 'Invalid date';
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDistance = (meters: number) => {
    const miles = meters * 0.000621371;
    return miles >= 10 ? `${Math.round(miles)} mi` : `${miles.toFixed(1)} mi`;
  };

  const formatElevation = (meters?: number) => {
    return meters ? `${Math.round(meters * 3.28084)} ft` : 'N/A';
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

  const getRsvpStatusColor = (status?: string) => {
    switch (status) {
      case 'going':
        return 'text-green-600';
      case 'maybe':
        return 'text-yellow-600';
      case 'not_going':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (viewMode === 'list') {
    // List view - compact vertical layout with full-width route map
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <Link
                to={eventPath}
                className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors truncate block"
              >
                {event.title}
              </Link>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(event.startDate)} at {formatTime(event.startTime)}
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.startLocation}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaceBadgeColor(event.pace)}`}>
                {event.pace}
              </span>
              {event.userRsvpStatus && (
                <div className={`text-sm font-medium ${getRsvpStatusColor(event.userRsvpStatus)}`}>
                  {event.userRsvpStatus === 'going' && '✓ Going'}
                  {event.userRsvpStatus === 'maybe' && '? Maybe'}
                  {event.userRsvpStatus === 'not_going' && '✗ Not Going'}
                </div>
              )}
            </div>
          </div>
          
          {/* Route info and map */}
          {(event.route || (event.distanceMeters && event.distanceMeters > 0)) && (
            <div className={event.route?.stravaRouteId ? "mb-3" : "mb-3"}>
              {/* Only show route details for non-Strava routes */}
              {!event.route?.stravaRouteId && (
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.route ? event.route.name : 'Route Details'}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      {event.route ? (
                        <>
                          <span>{formatDistance(event.route.distanceMeters)}</span>
                          <span>{formatElevation(event.route.elevationGainMeters)} elevation</span>
                        </>
                      ) : (
                        <>
                          {event.distanceMeters && event.distanceMeters > 0 && (
                            <span>{formatDistance(event.distanceMeters)}</span>
                          )}
                          {event.elevationGainMeters && event.elevationGainMeters > 0 && (
                            <span>{formatElevation(event.elevationGainMeters)} elevation</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              )}
              
              {/* Route Map Preview - full width in list view */}
              {event.route?.stravaRouteId ? (
                <StravaRoutePreview
                  stravaRouteId={event.route.stravaRouteId}
                  routeName={event.route.name}
                  className="min-h-[150px] w-full"
                />
              ) : event.route ? (
                <div className="min-h-[150px] w-full flex items-center justify-center bg-gray-100 rounded border text-gray-500 text-sm">
                  No route preview available
                </div>
              ) : null}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
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
                <span className="ml-2 text-sm text-gray-700">
                  {event.organizer.firstName} {event.organizer.lastName}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-7.5l-3 3m0 0l-3-3m3 3V9a6 6 0 00-6-6" />
                  </svg>
                  {event.rsvpCount}
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {event.commentCount || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isOrganizer && (
                <Link
                  to={`/events/${event.id}/edit`}
                  className="inline-flex items-center justify-center px-2 py-1 border border-gray-300 text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
              )}
              <Link
                to={eventPath}
                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view - original detailed layout
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
          <div className="flex-1 mb-3 sm:mb-0">
            <Link
              to={eventPath}
              className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
            >
              {event.title}
            </Link>
            {event.description && (
              <p className="text-gray-600 mt-1 line-clamp-2">{event.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 sm:ml-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPaceBadgeColor(event.pace)}`}>
              {event.pace}
            </span>
            {event.userRsvpStatus && (
              <div className={`text-sm font-medium ${getRsvpStatusColor(event.userRsvpStatus)}`}>
                {event.userRsvpStatus === 'going' && '✓ Going'}
                {event.userRsvpStatus === 'maybe' && '? Maybe'}
                {event.userRsvpStatus === 'not_going' && '✗ Not Going'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.startDate)} at {formatTime(event.startTime)}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.startLocation}
          </div>
        </div>

        {(event.route || (event.distanceMeters && event.distanceMeters > 0) || (event.elevationGainMeters && event.elevationGainMeters > 0)) && (
          <div className={event.route?.stravaRouteId ? "mb-4" : "bg-gray-50 rounded-lg p-3 mb-4"}>
            {/* Only show route details for non-Strava routes */}
            {!event.route?.stravaRouteId && (
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {event.route ? event.route.name : 'Route Details'}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    {event.route ? (
                      <>
                        <span>{formatDistance(event.route.distanceMeters)}</span>
                        <span>{formatElevation(event.route.elevationGainMeters)} elevation</span>
                      </>
                    ) : (
                      <>
                        {event.distanceMeters && event.distanceMeters > 0 && (
                          <span>{formatDistance(event.distanceMeters)}</span>
                        )}
                        {event.elevationGainMeters && event.elevationGainMeters > 0 && (
                          <span>{formatElevation(event.elevationGainMeters)} elevation</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 713 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            )}
            
            {/* Route Map Preview - only show for Strava routes */}
            {event.route?.stravaRouteId ? (
              <StravaRoutePreview
                stravaRouteId={event.route.stravaRouteId}
                routeName={event.route.name}
                className="min-h-[200px] w-full"
              />
            ) : event.route ? (
              <div className="min-h-[200px] w-full flex items-center justify-center bg-gray-100 rounded border text-gray-500 text-sm">
                No route preview available
              </div>
            ) : null}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              {event.organizer.profilePhotoUrl ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={event.organizer.profilePhotoUrl}
                  alt={`${event.organizer.firstName} ${event.organizer.lastName}`}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {event.organizer.firstName[0]}{event.organizer.lastName[0]}
                  </span>
                </div>
              )}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {event.organizer.firstName} {event.organizer.lastName}
                </p>
                <p className="text-xs text-gray-500">Organizer</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-7.5l-3 3m0 0l-3-3m3 3V9a6 6 0 00-6-6" />
                </svg>
                                {event.rsvpCount}
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                                {event.commentCount || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2">
            {isOrganizer && (
              <Link
                to={`/events/${event.id}/edit`}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            )}
            <Link
              to={eventPath}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;