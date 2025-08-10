import React, { useEffect, useRef } from 'react';

interface StravaEmbedProps {
  stravaRouteId: string;
  routeName?: string;
  distance?: number; // in meters
  elevationGain?: number; // in meters
  className?: string;
  showElevation?: boolean;
  style?: 'standard' | 'minimal';
}

const StravaEmbed: React.FC<StravaEmbedProps> = ({
  stravaRouteId,
  distance,
  elevationGain,
  className = 'h-96 w-full',
  style = 'standard'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedFailed, setEmbedFailed] = React.useState(false);
  const [useIframe, setUseIframe] = React.useState(false);

  useEffect(() => {
    if (!stravaRouteId || !containerRef.current) {
      return;
    }

    // Clear any existing content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Add CSS to ensure Strava embed content is constrained
    const styleId = 'strava-embed-containment';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .strava-embed-placeholder * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .strava-embed-placeholder iframe {
          max-width: 100% !important;
          width: 100% !important;
          height: auto !important;
          min-height: 400px !important;
        }
        .strava-embed-placeholder {
          overflow: visible !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Create the embed container
    const embedDiv = document.createElement('div');
    embedDiv.className = 'strava-embed-placeholder';
    embedDiv.setAttribute('data-embed-type', 'route');
    embedDiv.setAttribute('data-embed-id', stravaRouteId);
    embedDiv.setAttribute('data-units', 'imperial');
    embedDiv.setAttribute('data-full-width', 'true');
    embedDiv.setAttribute('data-style', 'standard');
    embedDiv.setAttribute('data-surface-type', 'true');
    embedDiv.setAttribute('data-from-embed', 'true');
    
    // Add distance and elevation if provided
    if (distance) {
      embedDiv.setAttribute('data-distance', distance.toString());
    }
    if (elevationGain) {
      embedDiv.setAttribute('data-elevation-gain', elevationGain.toString());
    }
    
    containerRef.current.appendChild(embedDiv);

    // Wait for script to be ready and initialize embed
    const waitForEmbedReady = (callback: () => void, maxAttempts = 10, attempt = 1) => {
      // Check if any embeds have been processed
      const placeholders = document.querySelectorAll('.strava-embed-placeholder');
      let hasProcessed = false;
      
      placeholders.forEach(placeholder => {
        if (placeholder.innerHTML.trim() !== '') {
          hasProcessed = true;
        }
      });
      
      if (hasProcessed) {
        return;
      } else if ((window as any).StravaEmbed) {
        callback();
      } else if ((window as any).__STRAVA_EMBED_BOOTSTRAP__) {
        // Use the bootstrap object to initialize embeds
        const bootstrap = (window as any).__STRAVA_EMBED_BOOTSTRAP__;
        
        if (typeof bootstrap === 'function') {
          try {
            bootstrap();
          } catch (error) {
            console.error('StravaEmbed: Error initializing:', error);
          }
        } else if (bootstrap && typeof bootstrap.init === 'function') {
          try {
            bootstrap.init();
          } catch (error) {
            console.error('StravaEmbed: Error initializing:', error);
          }
        } else if (bootstrap && typeof bootstrap.process === 'function') {
          try {
            bootstrap.process();
          } catch (error) {
            console.error('StravaEmbed: Error initializing:', error);
          }
        }
        return;
      } else if (attempt < maxAttempts) {
        setTimeout(() => waitForEmbedReady(callback, maxAttempts, attempt + 1), 500);
      }
    };

    // Load the Strava embed script
    const loadStravaScript = () => {
      // Check if script is already loaded
      const existingScript = document.querySelector('script[src="https://strava-embeds.com/embed.js"]');
      if (existingScript) {
        waitForEmbedReady(() => {
          try {
            (window as any).StravaEmbed.init();
          } catch (error) {
            console.error('StravaEmbed: Error calling init():', error);
          }
        });
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = 'https://strava-embeds.com/embed.js';
      script.async = true;
      script.onload = () => {
        // Give the script a moment to set up, then check for auto-processing
        setTimeout(() => {
          waitForEmbedReady(() => {
            try {
              (window as any).StravaEmbed.init();
            } catch (error) {
              console.error('StravaEmbed: Error calling init():', error);
            }
          });
        }, 100);
      };
      script.onerror = (error) => {
        console.error('StravaEmbed: Error loading script:', error);
      };
      document.head.appendChild(script);
    };

    // Try immediate auto-processing first (script might work without init)
    setTimeout(() => {
      const embedDiv = containerRef.current?.querySelector('.strava-embed-placeholder');
      if (embedDiv && embedDiv.innerHTML.trim() !== '') {
        return;
      }
      
      // If not auto-processed, load script
      loadStravaScript();
    }, 100);

    // Set a timeout to fall back if embed doesn't work
    const fallbackTimer = setTimeout(() => {
      if (containerRef.current && containerRef.current.children.length > 0) {
        const embedDiv = containerRef.current.querySelector('.strava-embed-placeholder');
        if (embedDiv && embedDiv.innerHTML.trim() === '') {
          setUseIframe(true);
        }
      }
    }, 6000); // 6 second timeout to allow more time for initialization

    // Cleanup function
    return () => {
      clearTimeout(fallbackTimer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [stravaRouteId, distance, elevationGain, style]);

  // Fallback implementation - show route stats and link to Strava
  if (useIframe) {
    const formatDistance = (meters: number) => {
      const km = meters / 1000;
      return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
    };

    const formatElevation = (meters?: number) => {
      return meters ? `${Math.round(meters)} m` : 'N/A';
    };
    
    return (
      <div className={className}>
        <div className="h-full bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6 flex flex-col justify-center items-center">
          <div className="text-center">
            {/* Strava logo-like icon */}
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Strava Route</h3>
            
            {/* Route stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Distance</p>
                <p className="font-medium text-gray-900">{formatDistance(distance || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Elevation</p>
                <p className="font-medium text-gray-900">{formatElevation(elevationGain)}</p>
              </div>
            </div>
            
            <a 
              href={`https://www.strava.com/routes/${stravaRouteId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Interactive Map on Strava
            </a>
            
            <p className="text-xs text-gray-500 mt-3">
              Interactive route map and elevation profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if both embed and iframe failed
  if (embedFailed) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Unable to Load Route Map</h3>
          <p className="text-sm text-gray-500 mb-4">
            The Strava route map could not be loaded at this time.
          </p>
          <a 
            href={`https://www.strava.com/routes/${stravaRouteId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View on Strava
            <svg className="ml-2 -mr-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  if (!stravaRouteId) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Route Available</h3>
          <p className="text-sm text-gray-500">
            This ride doesn't have an associated Strava route.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div 
        ref={containerRef}
        className="w-full rounded-lg border border-gray-200"
        style={{ 
          minHeight: '400px',
          height: 'auto',
          maxWidth: '100%',
          position: 'relative',
          overflow: 'visible'
        }}
      />
    </div>
  );
};

export default StravaEmbed;