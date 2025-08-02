import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAfter, isBefore } from 'date-fns';
import { ridesApi } from '../services/api';
import type { RideWithDetails } from '../types/ride';
import { useAuth } from '../context/AuthContext';
import RideCard from '../components/RideCard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [organizedRides, setOrganizedRides] = useState<RideWithDetails[]>([]);
  const [joinedRides, setJoinedRides] = useState<RideWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'organized' | 'joined'>('organized');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUserRides();
    }
  }, [user]);

  const fetchUserRides = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [organizedResponse, joinedResponse] = await Promise.all([
        ridesApi.getMyRides('organized', 1, 50),
        ridesApi.getMyRides('joined', 1, 50)
      ]);
      
      setOrganizedRides(organizedResponse.rides);
      setJoinedRides(joinedResponse.rides);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch your rides');
    } finally {
      setLoading(false);
    }
  };

  const filterRidesByStatus = (rides: RideWithDetails[], status: 'upcoming' | 'past') => {
    const now = new Date();
    return rides.filter(ride => {
      const rideDateTime = new Date(`${ride.startDate}T${ride.startTime}`);
      return status === 'upcoming' ? isAfter(rideDateTime, now) : isBefore(rideDateTime, now);
    });
  };

  const getStats = () => {
    const upcomingOrganized = filterRidesByStatus(organizedRides, 'upcoming').length;
    const pastOrganized = filterRidesByStatus(organizedRides, 'past').length;
    const upcomingJoined = filterRidesByStatus(joinedRides, 'upcoming').length;
    const pastJoined = filterRidesByStatus(joinedRides, 'past').length;

    return {
      upcomingOrganized,
      pastOrganized,
      upcomingJoined,
      pastJoined,
      totalRides: upcomingOrganized + pastOrganized + upcomingJoined + pastJoined
    };
  };

  const getCurrentRides = () => {
    const rides = activeTab === 'organized' ? organizedRides : joinedRides;
    return rides.sort((a, b) => {
      const aDate = new Date(`${a.startDate}T${a.startTime}`);
      const bDate = new Date(`${b.startDate}T${b.startTime}`);
      return aDate.getTime() - bDate.getTime();
    });
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Please sign in to view your dashboard</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const currentRides = getCurrentRides();
  const upcomingRides = filterRidesByStatus(currentRides, 'upcoming');
  const pastRides = filterRidesByStatus(currentRides, 'past');

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your rides and see what's coming up
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Organized
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.upcomingOrganized}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Joined
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.upcomingJoined}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Rides
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pastOrganized + stats.pastJoined}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Rides
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalRides}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg mb-8 p-4 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <Link
              to="/create-ride"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Ride
            </Link>
            
            <Link
              to="/rides"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Rides
            </Link>
            
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={fetchUserRides}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Rides Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('organized')}
                className={`${
                  activeTab === 'organized'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Organized ({organizedRides.length})
              </button>
              <button
                onClick={() => setActiveTab('joined')}
                className={`${
                  activeTab === 'joined'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Joined ({joinedRides.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {currentRides.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {activeTab === 'organized' ? 'organized' : 'joined'} rides
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'organized' 
                    ? "You haven't organized any rides yet. Create your first ride to get started!"
                    : "You haven't joined any rides yet. Browse available rides to find one you'd like to join."
                  }
                </p>
                <div className="mt-6">
                  <Link
                    to={activeTab === 'organized' ? '/create-ride' : '/rides'}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    {activeTab === 'organized' ? 'Create First Ride' : 'Browse Rides'}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Rides */}
                {upcomingRides.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Upcoming Rides ({upcomingRides.length})
                    </h3>
                    <div className="space-y-6">
                      {upcomingRides.map((ride) => (
                        <RideCard key={ride.id} ride={ride} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Rides */}
                {pastRides.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Past Rides ({pastRides.length})
                    </h3>
                    <div className="space-y-6">
                      {pastRides.map((ride) => (
                        <RideCard key={ride.id} ride={ride} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;