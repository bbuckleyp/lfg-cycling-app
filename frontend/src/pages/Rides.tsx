import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ridesApi } from '../services/api';
import type { RideWithDetails } from '../types/ride';
import { useAuth } from '../context/AuthContext';
import RideCard from '../components/RideCard';
import RideFilters from '../components/RideFilters';

type ViewMode = 'grid' | 'list';

const Rides: React.FC = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPace, setSelectedPace] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');

  // View mode state with responsive default
  const getDefaultViewMode = (): ViewMode => {
    // Check localStorage first
    const saved = localStorage.getItem('ridesViewMode') as ViewMode;
    if (saved === 'grid' || saved === 'list') {
      return saved;
    }
    
    // Default based on screen size
    return window.innerWidth >= 768 ? 'grid' : 'list';
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getDefaultViewMode);

  // Handle view mode changes with localStorage persistence
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    localStorage.setItem('ridesViewMode', newViewMode);
  };

  // Handle responsive default on window resize
  useEffect(() => {
    const handleResize = () => {
      // Only update if no saved preference exists
      const saved = localStorage.getItem('ridesViewMode');
      if (!saved) {
        const newDefault = window.innerWidth >= 768 ? 'grid' : 'list';
        setViewMode(newDefault);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRides = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      if (reset) {
        setError('');
      }
      
      const response = await ridesApi.getAll(pageNum, 20);
      
      if (reset || pageNum === 1) {
        setRides(response.rides);
      } else {
        setRides(prev => [...prev, ...response.rides]);
      }
      
      setPage(pageNum);
      setTotalPages(response.totalPages);
      setHasMore(pageNum < response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides(1, true);
  }, []);

  // Filter rides based on current filters
  const filteredRides = useMemo(() => {
    return rides.filter(ride => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ride.title.toLowerCase().includes(query);
        const matchesDescription = ride.description?.toLowerCase().includes(query);
        const matchesLocation = ride.startLocation.toLowerCase().includes(query);
        const matchesOrganizer = `${ride.organizer.firstName} ${ride.organizer.lastName}`.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesDescription && !matchesLocation && !matchesOrganizer) {
          return false;
        }
      }

      // Pace filter
      if (selectedPace && ride.pace !== selectedPace) {
        return false;
      }

      // Date range filter
      if (selectedDateRange) {
        const rideDate = new Date(ride.startDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        switch (selectedDateRange) {
          case 'today':
            if (rideDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'tomorrow':
            if (rideDate.toDateString() !== tomorrow.toDateString()) return false;
            break;
          case 'this_week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            if (rideDate < startOfWeek || rideDate > endOfWeek) return false;
            break;
          case 'next_week':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
            if (rideDate < nextWeekStart || rideDate > nextWeekEnd) return false;
            break;
          case 'this_month':
            if (rideDate.getMonth() !== today.getMonth() || rideDate.getFullYear() !== today.getFullYear()) return false;
            break;
        }
      }

      return true;
    });
  }, [rides, searchQuery, selectedPace, selectedDateRange]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchRides(page + 1, false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPace('');
    setSelectedDateRange('');
  };

  const hasActiveFilters = searchQuery || selectedPace || selectedDateRange;

  if (loading && rides.length === 0) {
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

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Group Rides</h1>
            <p className="mt-2 text-gray-600">
              Discover and join cycling adventures in your area
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid view"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List view"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            {user && (
              <Link
                to="/create-ride"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Ride
              </Link>
            )}
          </div>
        </div>

        <RideFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPace={selectedPace}
          onPaceChange={setSelectedPace}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
          onReset={handleResetFilters}
        />

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => fetchRides(1, true)}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {filteredRides.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            
            {hasActiveFilters ? (
              <div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rides match your filters</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search criteria to find more rides.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rides available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to organize a group ride in your area!
                </p>
                {user && (
                  <div className="mt-6">
                    <Link
                      to="/create-ride"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Create First Ride
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" 
              : "space-y-4"
            }>
              {filteredRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} viewMode={viewMode} />
              ))}
            </div>

            {hasMore && !hasActiveFilters && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More Rides'
                  )}
                </button>
              </div>
            )}

            {hasActiveFilters && (
              <div className="mt-6 text-center text-sm text-gray-500">
                Showing {filteredRides.length} of {rides.length} rides
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Rides;