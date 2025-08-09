import React, { useEffect, useRef, useState } from 'react';

interface RideWithGPSEmbedProps {
  routeId: string;
  routeName: string;
  className?: string;
}

const RideWithGPSEmbed: React.FC<RideWithGPSEmbedProps> = ({ 
  routeId, 
  routeName, 
  className = "w-full h-96" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous content
    container.innerHTML = '';
    setIsLoading(true);
    setHasError(false);

    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.src = `https://ridewithgps.com/routes/${routeId}/embed`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.allowFullscreen = true;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation');
    iframe.style.border = 'none';
    iframe.title = `RideWithGPS Route: ${routeName}`;

    // Timeout to show fallback if iframe doesn't load
    const timeout = setTimeout(() => {
      console.warn(`RideWithGPS embed timeout for route ${routeId}`);
      setIsLoading(false);
      setHasError(true);
    }, 10000); // 10 second timeout

    // Load event listener
    iframe.onload = () => {
      clearTimeout(timeout);
      setIsLoading(false);
      console.log(`RideWithGPS embed loaded successfully for route ${routeId}`);
    };

    // Error event listener
    iframe.onerror = () => {
      clearTimeout(timeout);
      setIsLoading(false);
      setHasError(true);
      console.error(`Failed to load RideWithGPS embed for route ${routeId}`);
    };

    container.appendChild(iframe);

    // Cleanup function
    return () => {
      clearTimeout(timeout);
      container.innerHTML = '';
    };
  }, [routeId, routeName]);

  if (hasError) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8`}>
        <div className="text-center max-w-md">
          <svg className="mx-auto h-16 w-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 713 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">RideWithGPS Route</h3>
          <p className="text-sm text-gray-600 mb-4">{routeName}</p>
          <a
            href={`https://ridewithgps.com/routes/${routeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            View Full Route
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading route...</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default RideWithGPSEmbed;