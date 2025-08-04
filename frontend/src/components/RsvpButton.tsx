import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rsvpApi } from '../services/api';
import type { CreateRsvpRequest } from '../types/rsvp';

interface RsvpButtonProps {
  eventId: number;
  currentStatus?: 'going' | 'maybe' | 'not_going';
  isOrganizer?: boolean;
  onRsvpChange?: (status: 'going' | 'maybe' | 'not_going' | null) => void;
  disabled?: boolean;
}

const RsvpButton: React.FC<RsvpButtonProps> = ({
  eventId,
  currentStatus,
  isOrganizer = false,
  onRsvpChange,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRsvp = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      
      const data: CreateRsvpRequest = { status };
      await rsvpApi.createOrUpdate(eventId, data);
      
      onRsvpChange?.(status);
      setShowOptions(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update RSVP');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRsvp = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      
      await rsvpApi.delete(eventId);
      
      onRsvpChange?.(null);
      setShowOptions(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove RSVP');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Sign in to RSVP</p>
        <a
          href="/login"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (isOrganizer) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          You're the organizer
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'going':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'maybe':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'not_going':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-primary-600 hover:bg-primary-700 text-white';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'going':
        return '✓ Going';
      case 'maybe':
        return '? Maybe';
      case 'not_going':
        return '✗ Not Going';
      default:
        return 'RSVP';
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="mb-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}
      
      {!showOptions ? (
        <button
          onClick={() => setShowOptions(true)}
          disabled={disabled || loading}
          className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentStatus ? getStatusColor(currentStatus) : 'bg-primary-600 hover:bg-primary-700 text-white'
          } disabled:opacity-50`}
        >
          {loading ? 'Loading...' : getStatusText(currentStatus)}
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => handleRsvp('going')}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
          >
            ✓ I'm Going
          </button>
          
          <button
            onClick={() => handleRsvp('maybe')}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium rounded-md bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 transition-colors"
          >
            ? Maybe
          </button>
          
          <button
            onClick={() => handleRsvp('not_going')}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
          >
            ✗ Can't Go
          </button>
          
          {currentStatus && (
            <button
              onClick={handleRemoveRsvp}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Remove RSVP
            </button>
          )}
          
          <button
            onClick={() => setShowOptions(false)}
            className="w-full px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default RsvpButton;