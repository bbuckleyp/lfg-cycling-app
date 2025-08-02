import React, { useState, useEffect } from 'react';
import { rsvpApi } from '../services/api';
import type { RsvpWithUser, RsvpStats } from '../types/rsvp';

interface RsvpListProps {
  rideId: number;
  refreshTrigger?: number;
}

const RsvpList: React.FC<RsvpListProps> = ({ rideId, refreshTrigger }) => {
  const [rsvps, setRsvps] = useState<RsvpWithUser[]>([]);
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('going');

  useEffect(() => {
    fetchRsvps();
    fetchStats();
  }, [rideId, refreshTrigger]);

  useEffect(() => {
    fetchRsvps();
  }, [selectedStatus]);

  const fetchRsvps = async () => {
    try {
      setLoading(true);
      const response = await rsvpApi.getRideRsvps(rideId, selectedStatus);
      setRsvps(response.rsvps);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await rsvpApi.getStats(rideId);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching RSVP stats:', error);
    }
  };

  const getExperienceBadgeColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = [
    { value: 'going', label: 'Going', count: stats?.going || 0 },
    { value: 'maybe', label: 'Maybe', count: stats?.maybe || 0 },
    { value: 'not_going', label: 'Not Going', count: stats?.not_going || 0 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Participants</h3>
        {stats && (
          <p className="mt-1 text-sm text-gray-500">
            {stats.going} going, {stats.maybe} maybe, {stats.not_going} not going
          </p>
        )}
      </div>

      <div className="px-6 py-4">
        <div className="flex space-x-1 mb-4">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedStatus === option.value
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : rsvps.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-7.5l-3 3m0 0l-3-3m3 3V9a6 6 0 00-6-6" />
            </svg>
            <p className="text-gray-500">
              No one has RSVP'd as "{statusOptions.find(opt => opt.value === selectedStatus)?.label.toLowerCase()}" yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rsvps.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center space-x-3">
                {rsvp.user.profilePhotoUrl ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={rsvp.user.profilePhotoUrl}
                    alt={`${rsvp.user.firstName} ${rsvp.user.lastName}`}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {rsvp.user.firstName[0]}{rsvp.user.lastName[0]}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {rsvp.user.firstName} {rsvp.user.lastName}
                    </p>
                    {rsvp.user.experienceLevel && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getExperienceBadgeColor(rsvp.user.experienceLevel)}`}>
                        {rsvp.user.experienceLevel}
                      </span>
                    )}
                  </div>
                  {rsvp.message && (
                    <p className="text-sm text-gray-500 truncate">
                      "{rsvp.message}"
                    </p>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {selectedStatus === 'going' && (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                  {selectedStatus === 'maybe' && (
                    <span className="text-yellow-600 text-sm">?</span>
                  )}
                  {selectedStatus === 'not_going' && (
                    <span className="text-red-600 text-sm">✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RsvpList;