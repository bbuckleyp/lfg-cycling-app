import React from 'react';

interface ManualRoutePlaceholderProps {
  distanceMeters?: number;
  elevationGainMeters?: number;
  className?: string;
}

const ManualRoutePlaceholder: React.FC<ManualRoutePlaceholderProps> = ({
  distanceMeters,
  elevationGainMeters,
  className = ''
}) => {
  const formatDistance = (meters?: number) => {
    if (!meters) return '0 mi';
    const miles = meters * 0.000621371;
    return miles >= 10 ? `${Math.round(miles)} mi` : `${miles.toFixed(1)} mi`;
  };

  const formatElevation = (meters?: number) => {
    return meters ? `${Math.round(meters * 3.28084)} ft` : 'N/A';
  };

  return (
    <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-8 ${className}`}>
      <div className="text-center max-w-md">
        <svg className="mx-auto h-20 w-20 text-purple-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Manual Route</h3>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {formatDistance(distanceMeters)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Distance</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatElevation(elevationGainMeters)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Elevation</div>
          </div>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">
          Route details entered manually by the event organizer
        </p>
      </div>
    </div>
  );
};

export default ManualRoutePlaceholder;