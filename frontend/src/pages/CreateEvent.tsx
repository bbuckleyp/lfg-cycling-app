import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { eventsApi } from '../services/api';
import RouteSelector from '../components/RouteSelector';

type EventType = 'ride' | 'race';

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  startLocation: z.string().min(1, 'Start location is required').max(255, 'Location too long'),
  pace: z.enum(['social', 'tempo', 'race'], { 
    errorMap: () => ({ message: 'Please select a pace' })
  }),
  route: z.object({
    type: z.enum(['strava', 'ridewithgps', 'manual', 'none']),
    stravaId: z.string().optional(),
    ridewithgpsId: z.string().optional(),
    name: z.string(),
    distance: z.number(),
    elevationGain: z.number(),
    estimatedTime: z.number(),
    isNoRoute: z.boolean().optional(),
  }).optional(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { eventId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<any>(undefined);
  const [existingEvent, setExistingEvent] = useState<any>(null);
  
  // Determine if we're editing
  const isEditMode = Boolean(eventId);

  // Get event type from URL params, default to 'ride'
  const activeEventType: EventType = (searchParams.get('type') as EventType) || existingEvent?.eventType || 'ride';

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      pace: activeEventType === 'race' ? 'race' : 'social',
    },
  });

  // Fetch existing event data if in edit mode
  useEffect(() => {
    const fetchEventData = async () => {
      if (isEditMode && eventId) {
        try {
          setIsLoading(true);
          const response = await eventsApi.getById(parseInt(eventId));
          const event = response.event;
          setExistingEvent(event);
          
          // Populate form fields
          reset({
            title: event.title,
            description: event.description || '',
            startDate: event.startDate,
            startTime: event.startTime,
            startLocation: event.startLocation,
            pace: event.pace,
          });
          
          // Set route if exists
          if (event.route) {
            const routeData = {
              type: event.route.routeSource,
              stravaId: event.route.stravaRouteId,
              ridewithgpsId: event.route.ridewithgpsRouteId,
              name: event.route.name,
              distance: event.route.distanceMeters,
              elevationGain: event.route.elevationGainMeters || 0,
              estimatedTime: event.route.estimatedMovingTime || 0,
            };
            setSelectedRoute(routeData);
          } else if (event.distanceMeters || event.elevationGainMeters) {
            // Manual route data
            const routeData = {
              type: 'manual',
              name: 'Manual Route Details',
              distance: event.distanceMeters || 0,
              elevationGain: event.elevationGainMeters || 0,
              estimatedTime: 0,
              isNoRoute: true,
            };
            setSelectedRoute(routeData);
          }
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to fetch event data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEventData();
  }, [eventId, isEditMode, reset]);

  // Update pace when event type changes
  useEffect(() => {
    if (activeEventType === 'race') {
      setValue('pace', 'race');
    }
  }, [activeEventType, setValue]);

  // Handle event type toggle
  const handleEventTypeToggle = (eventType: EventType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', eventType);
    setSearchParams(newParams);
  };

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      setIsLoading(true);
      setError('');

      const createData = {
        eventType: activeEventType,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        startTime: data.startTime,
        startLocation: data.startLocation,
        pace: data.pace,
        stravaRouteData: (selectedRoute?.type === 'strava') ? {
          stravaRouteId: selectedRoute.stravaId,
          name: selectedRoute.name,
          distance: selectedRoute.distance,
          elevationGain: selectedRoute.elevationGain,
          estimatedTime: selectedRoute.estimatedTime,
        } : undefined,
        ridewithgpsRouteData: (selectedRoute?.type === 'ridewithgps') ? {
          ridewithgpsRouteId: selectedRoute.ridewithgpsId,
          name: selectedRoute.name,
          distance: selectedRoute.distance,
          elevationGain: selectedRoute.elevationGain,
          estimatedTime: selectedRoute.estimatedTime,
        } : undefined,
        distanceMeters: (selectedRoute?.type === 'manual' && selectedRoute.distance > 0) ? Math.round(selectedRoute.distance) : undefined,
        elevationGainMeters: (selectedRoute?.type === 'manual' && selectedRoute.elevationGain > 0) ? Math.round(selectedRoute.elevationGain) : undefined,
      };

      const response = isEditMode 
        ? await eventsApi.update(parseInt(eventId!), createData)
        : await eventsApi.create(createData);
      navigate(`/events/${response.event.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeDisplayName = (type: EventType) => {
    return type === 'race' ? 'Race' : 'Ride';
  };

  const getEventTypeColor = (type: EventType) => {
    return type === 'race' ? 'orange' : 'primary';
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Event' : 'Create Event'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEditMode 
            ? `Update your ${activeEventType} details.`
            : `Create a new ${activeEventType} for the cycling community to join.`
          }
        </p>

        {/* Event Type Toggle - only show in create mode */}
        {!isEditMode && (
          <div className="mt-6 inline-flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleEventTypeToggle('ride')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeEventType === 'ride'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Ride
            </button>
            <button
              type="button"
              onClick={() => handleEventTypeToggle('race')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeEventType === 'race'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Race
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            {getEventTypeDisplayName(activeEventType)} Title *
          </label>
          <input
            {...register('title')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={activeEventType === 'race' ? 'e.g., Local Criterium Race' : 'e.g., Morning Coffee Ride'}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={
              activeEventType === 'race' 
                ? 'Describe the race format, distance, and any special requirements...'
                : 'Tell people what to expect from this ride...'
            }
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              {...register('startDate')}
              type="date"
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              {...register('startTime')}
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="startLocation" className="block text-sm font-medium text-gray-700 mb-1">
            Start Location *
          </label>
          <input
            {...register('startLocation')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Golden Gate Park, San Francisco"
          />
          {errors.startLocation && (
            <p className="mt-1 text-sm text-red-600">{errors.startLocation.message}</p>
          )}
        </div>

        {/* Only show pace selection for rides */}
        {activeEventType === 'ride' && (
          <div>
            <label htmlFor="pace" className="block text-sm font-medium text-gray-700 mb-1">
              Pace *
            </label>
            <select
              {...register('pace')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="social">Social (Easy pace, lots of chatting)</option>
              <option value="tempo">Tempo (Moderate pace, some chatting)</option>
              <option value="race">Race (Fast pace, minimal chatting)</option>
            </select>
            {errors.pace && (
              <p className="mt-1 text-sm text-red-600">{errors.pace.message}</p>
            )}
          </div>
        )}

        {/* Race pace is fixed, show info message */}
        {activeEventType === 'race' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Race Pace Event
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>All races are automatically set to race pace (fast pace, minimal chatting).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <RouteSelector
            selectedRoute={selectedRoute}
            onRouteSelect={(route) => setSelectedRoute(route)}
            error={undefined}
          />
        </div>


        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              activeEventType === 'race'
                ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              `${isEditMode ? 'Update' : 'Create'} ${getEventTypeDisplayName(activeEventType)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;