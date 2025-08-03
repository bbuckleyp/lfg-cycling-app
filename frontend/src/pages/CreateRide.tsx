import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { ridesApi } from '../services/api';
import type { CreateRideRequest } from '../types/ride';
import StravaRouteSelector from '../components/StravaRouteSelector';

const createRideSchema = z.object({
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

type CreateRideFormData = z.infer<typeof createRideSchema>;

const CreateRide: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateRideFormData>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      startTime: '09:00',
      pace: 'social',
      isPublic: true,
    },
  });

  // const watchedRouteId = watch('routeId');

  const onSubmit = async (data: CreateRideFormData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const rideData: CreateRideRequest = {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        startTime: data.startTime,
        startLocation: data.startLocation,
        pace: data.pace,
        isPublic: data.isPublic,
        stravaRouteData: (data.stravaRoute && !data.stravaRoute.isNoRoute) ? {
          stravaRouteId: data.stravaRoute.stravaId,
          name: data.stravaRoute.name,
          distance: data.stravaRoute.distance,
          elevationGain: data.stravaRoute.elevationGain,
          estimatedTime: data.stravaRoute.estimatedTime,
        } : undefined,
        distanceMeters: (data.stravaRoute?.isNoRoute && data.stravaRoute.distance > 0) ? Math.round(data.stravaRoute.distance) : undefined,
        elevationGainMeters: (data.stravaRoute?.isNoRoute && data.stravaRoute.elevationGain > 0) ? Math.round(data.stravaRoute.elevationGain) : undefined,
      };

      const response = await ridesApi.create(rideData);
      navigate(`/rides/${response.ride.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create ride');
    } finally {
      setIsLoading(false);
    }
  };

  const paceOptions = [
    { value: 'social', label: 'Social', description: 'Easy pace, focus on enjoying the ride together' },
    { value: 'tempo', label: 'Tempo', description: 'Moderate pace, some effort but still conversational' },
    { value: 'race', label: 'Race', description: 'Fast pace, high intensity training or racing' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Group Ride</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Ride Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., Morning Coffee Ride, Hill Training"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Tell riders what to expect..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time *
                </label>
                <input
                  {...register('startTime')}
                  type="time"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="startLocation" className="block text-sm font-medium text-gray-700">
                Meeting Location *
              </label>
              <input
                {...register('startLocation')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., Starbucks on Main St, City Park entrance"
              />
              {errors.startLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.startLocation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pace *
              </label>
              <div className="space-y-3">
                {paceOptions.map((option) => (
                  <label key={option.value} className="flex items-start cursor-pointer">
                    <input
                      {...register('pace')}
                      type="radio"
                      value={option.value}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.pace && (
                <p className="mt-1 text-sm text-red-600">{errors.pace.message}</p>
              )}
            </div>

            <Controller
              name="stravaRoute"
              control={control}
              render={({ field }) => (
                <StravaRouteSelector
                  selectedRoute={field.value}
                  onRouteSelect={(route) => setValue('stravaRoute', route)}
                  error={errors.stravaRoute?.message}
                />
              )}
            />


            <div className="flex items-center">
              <input
                {...register('isPublic')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Make this ride publicly visible
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Ride'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRide;