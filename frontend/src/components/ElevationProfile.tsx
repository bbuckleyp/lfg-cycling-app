import React, { useEffect, useRef } from 'react';

interface ElevationProfileProps {
  elevationData?: number[];
  distanceData?: number[];
  className?: string;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({
  elevationData,
  distanceData,
  className = "h-64 w-full"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !elevationData || !distanceData || elevationData.length === 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max values
    const minElevation = Math.min(...elevationData);
    const maxElevation = Math.max(...elevationData);
    const maxDistance = Math.max(...distanceData);

    // Add some padding to elevation range
    const elevationRange = maxElevation - minElevation;
    const paddedMinElevation = minElevation - elevationRange * 0.1;
    const paddedMaxElevation = maxElevation + elevationRange * 0.1;

    // Helper functions
    const getX = (distance: number) => padding.left + (distance / maxDistance) * chartWidth;
    const getY = (elevation: number) => padding.top + (paddedMaxElevation - elevation) / (paddedMaxElevation - paddedMinElevation) * chartHeight;

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    // Vertical grid lines (distance)
    const distanceSteps = 5;
    for (let i = 0; i <= distanceSteps; i++) {
      const distance = (maxDistance / distanceSteps) * i;
      const x = getX(distance);
      
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    // Horizontal grid lines (elevation)
    const elevationSteps = 5;
    for (let i = 0; i <= elevationSteps; i++) {
      const elevation = paddedMinElevation + ((paddedMaxElevation - paddedMinElevation) / elevationSteps) * i;
      const y = getY(elevation);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw elevation profile
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < elevationData.length; i++) {
      const x = getX(distanceData[i]);
      const y = getY(elevationData[i]);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Fill area under curve
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.moveTo(getX(distanceData[0]), height - padding.bottom);
    
    for (let i = 0; i < elevationData.length; i++) {
      const x = getX(distanceData[i]);
      const y = getY(elevationData[i]);
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(getX(distanceData[distanceData.length - 1]), height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Add labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // Distance labels
    for (let i = 0; i <= distanceSteps; i++) {
      const distance = (maxDistance / distanceSteps) * i;
      const x = getX(distance);
      const distanceKm = (distance / 1000).toFixed(1);
      ctx.fillText(`${distanceKm}km`, x, height - padding.bottom + 20);
    }

    // Elevation labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= elevationSteps; i++) {
      const elevation = paddedMinElevation + ((paddedMaxElevation - paddedMinElevation) / elevationSteps) * i;
      const y = getY(elevation);
      ctx.fillText(`${Math.round(elevation)}m`, padding.left - 10, y + 4);
    }

    // Add axis titles
    ctx.textAlign = 'center';
    ctx.fillText('Distance', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Elevation', 0, 0);
    ctx.restore();

  }, [elevationData, distanceData]);

  if (!elevationData || !distanceData || elevationData.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-gray-500">No elevation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg border border-gray-200"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default ElevationProfile;