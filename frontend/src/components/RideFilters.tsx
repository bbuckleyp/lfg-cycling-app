import React from 'react';

interface RideFiltersProps {
  selectedPace: string;
  onPaceChange: (pace: string) => void;
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

const RideFilters: React.FC<RideFiltersProps> = ({
  selectedPace,
  onPaceChange,
  selectedDateRange,
  onDateRangeChange,
  searchQuery,
  onSearchChange,
  onReset,
}) => {
  const paceOptions = [
    { value: '', label: 'All Paces' },
    { value: 'social', label: 'Social' },
    { value: 'tempo', label: 'Tempo' },
    { value: 'race', label: 'Race' },
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'this_week', label: 'This Week' },
    { value: 'next_week', label: 'Next Week' },
    { value: 'this_month', label: 'This Month' },
  ];

  const hasActiveFilters = selectedPace || selectedDateRange || searchQuery;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search rides..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="pace" className="block text-sm font-medium text-gray-700 mb-1">
            Pace
          </label>
          <select
            id="pace"
            value={selectedPace}
            onChange={(e) => onPaceChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            {paceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
            When
          </label>
          <select
            id="dateRange"
            value={selectedDateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideFilters;