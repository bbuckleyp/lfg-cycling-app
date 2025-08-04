import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { eventsApi } from '../services/api';
import type { EventWithDetails } from '../types/event';
import StravaRouteSelector from '../components/StravaRouteSelector';

const editRideSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  startLocation: z.string().min(1, 'Start location is required').max(255, 'Location too long'),
  pace: z.enum(['social', 'tempo', 'race'], { 
    errorMap: () => ({ message: 'Please select a pace' })
  }),
  stravaRoute: z.object({
    stravaId: z.string(),
    name: z.string(),
    distance: z.number(),
    elevationGain: z.number(),
    estimatedTime: z.number(),
    isNoRoute: z.boolean().optional(),
  }).optional(),
  isPublic: z.boolean().optional(),
});

type EditRideFormData = z.infer<typeof editRideSchema>;

const EditRide: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localStravaRoute, setLocalStravaRoute] = useState<any>(undefined);


  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    resetField,
    formState: { errors },
  } = useForm<EditRideFormData>({
    resolver: zodResolver(editRideSchema),
  });


  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        const eventData = await eventsApi.getById(parseInt(eventId));
        setEvent(eventData.event);
        
        // Set local Strava route state
        const initialStravaRoute = eventData.event.route ? {
          stravaId: eventData.event.route.stravaRouteId,
          name: eventData.event.route.name,
          distance: eventData.event.route.distanceMeters,
          elevationGain: eventData.event.route.elevationGainMeters || 0,
          estimatedTime: eventData.event.route.estimatedMovingTime || 0,
        } : undefined;
        setLocalStravaRoute(initialStravaRoute);

        // Reset form with event data (excluding stravaRoute)
        reset({
          title: eventData.event.title,
          description: eventData.event.description || '',
          startDate: eventData.event.startDate,
          startTime: eventData.event.startTime,
          startLocation: eventData.event.startLocation,
          pace: eventData.event.pace,
          isPublic: eventData.event.isPublic,
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, reset]);

  const onSubmit = async (data: EditRideFormData) => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      setError('');

      const updateData = {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        startTime: data.startTime,
        startLocation: data.startLocation,
        pace: data.pace,
        isPublic: data.isPublic,
        stravaRouteData: (localStravaRoute && !localStravaRoute.isNoRoute) ? {
          stravaRouteId: localStravaRoute.stravaId,
          name: localStravaRoute.name,
          distance: localStravaRoute.distance,
          elevationGain: localStravaRoute.elevationGain,
          estimatedTime: localStravaRoute.estimatedTime,
        } : undefined,
        distanceMeters: (localStravaRoute?.isNoRoute && localStravaRoute.distance > 0) ? Math.round(localStravaRoute.distance) : undefined,
        elevationGainMeters: (localStravaRoute?.isNoRoute && localStravaRoute.elevationGain > 0) ? Math.round(localStravaRoute.elevationGain) : undefined,
      };

      await eventsApi.update(parseInt(eventId), updateData);
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;

    try {
      setIsDeleting(true);
      await eventsApi.delete(parseInt(eventId));
      navigate('/dashboard?tab=organized');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading && !event) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ride Not Found</h1>
          <p className="text-gray-600 mb-6">The ride you're looking for doesn't exist or you don't have permission to edit it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Ride</h1>
        <p className="mt-2 text-gray-600">
          Update your ride details or delete the ride event.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Ride Title *
          </label>
          <input
            {...register('title')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Morning Coffee Ride"
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
            placeholder="Tell people what to expect from this ride..."
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


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Route (Optional)
          </label>
          <StravaRouteSelector
            selectedRoute={localStravaRoute}
            onRouteSelect={(route) => {
              setLocalStravaRoute(route);
            }}
            error={undefined}
          />
        </div>

        <div className="flex items-center">
          <input
            {...register('isPublic')}
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
            Make this ride public (visible to all users)
          </label>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Ride
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Ride'}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L8.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Ride</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this ride? This action cannot be undone and will remove the ride for all participants.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Ride'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRide;