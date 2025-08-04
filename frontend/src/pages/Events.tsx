import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { eventsApi } from '../services/api';
import type { EventWithDetails } from '../types/event';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import RideFilters from '../components/RideFilters';

type ViewMode = 'grid' | 'list';
type EventType = 'ride' | 'race';

const Events: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Get event type from URL params, default to 'ride'
  const activeEventType: EventType = (searchParams.get('type') as EventType) || 'ride';

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPace, setSelectedPace] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');

  // View mode state with responsive default
  const getDefaultViewMode = (): ViewMode => {
    // Check localStorage first
    const saved = localStorage.getItem('eventsViewMode') as ViewMode;
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
    localStorage.setItem('eventsViewMode', newViewMode);
  };

  // Handle event type toggle
  const handleEventTypeToggle = (eventType: EventType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', eventType);
    setSearchParams(newParams);
    setPage(1); // Reset to first page when switching types
  };

  // Handle responsive default on window resize
  useEffect(() => {
    const handleResize = () => {
      // Only update if no saved preference exists
      const saved = localStorage.getItem('eventsViewMode');
      if (!saved) {
        setViewMode(window.innerWidth >= 768 ? 'grid' : 'list');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch events when filters change
  useEffect(() => {
    fetchEvents();
  }, [activeEventType, searchQuery, selectedPace, selectedDateRange, page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const filters: any = {
        type: activeEventType,
        page,
        limit: 50,
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }
      if (selectedPace) {
        filters.pace = selectedPace;
      }
      if (selectedDateRange) {
        const today = new Date();
        let startDate = '';
        
        switch (selectedDateRange) {
          case 'today':
            startDate = today.toISOString().split('T')[0];
            filters.startDate = startDate;
            filters.endDate = startDate;
            break;
          case 'week':
            filters.startDate = today.toISOString().split('T')[0];
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            filters.endDate = nextWeek.toISOString().split('T')[0];
            break;
          case 'month':
            filters.startDate = today.toISOString().split('T')[0];
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            filters.endDate = nextMonth.toISOString().split('T')[0];
            break;
        }
      }

      const response = await eventsApi.getAll(filters);
      
      if (page === 1) {
        setEvents(response.events);
      } else {
        setEvents(prev => [...prev, ...response.events]);
      }
      
      setTotalPages(response.totalPages);
      setHasMore(page < response.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered events (client-side filtering for better UX)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.startLocation.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [events, searchQuery]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (filters: any) => {
    setSearchQuery(filters.search || '');
    setSelectedPace(filters.pace || '');
    setSelectedDateRange(filters.dateRange || '');
    setPage(1);
  };

  const getEventTypeDisplayName = (type: EventType) => {
    return type === 'race' ? 'Races' : 'Rides';
  };

  const getCreateButtonText = (type: EventType) => {
    return type === 'race' ? 'Create Race' : 'Create Ride';
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header with toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
          
          {/* Event Type Toggle */}
          <div className="mt-4 inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => handleEventTypeToggle('ride')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeEventType === 'ride'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rides
            </button>
            <button
              onClick={() => handleEventTypeToggle('race')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeEventType === 'race'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Races
            </button>
          </div>
        </div>

        {user && (
          <Link
            to={`/create-event?type=${activeEventType}`}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              activeEventType === 'race'
                ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
            }`}
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {getCreateButtonText(activeEventType)}
          </Link>
        )}
      </div>

      {/* Filters and View Controls */}
      <div className="mb-6">
        <RideFilters
          searchQuery={searchQuery}
          selectedPace={selectedPace}
          selectedDateRange={selectedDateRange}
          onFilterChange={handleFilterChange}
          showPaceFilter={activeEventType === 'ride'} // Hide pace filter for races
        />
        
        {/* View Mode Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredEvents.length} {activeEventType === 'race' ? 'races' : 'rides'} found
          </p>
          
          <div className="flex rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Events Grid/List */}
      {loading && filteredEvents.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No {getEventTypeDisplayName(activeEventType).toLowerCase()}</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new {activeEventType}.</p>
          {user && (
            <div className="mt-6">
              <Link
                to={`/create-event?type=${activeEventType}`}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  activeEventType === 'race'
                    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                    : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                }`}
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {getCreateButtonText(activeEventType)}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-4"
          }>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                viewMode={viewMode}
                linkPath={`/events/${event.id}`}
                eventType={event.eventType}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;