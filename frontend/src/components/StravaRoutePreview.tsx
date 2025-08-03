import React, { useEffect, useRef } from 'react';

interface StravaRoutePreviewProps {
  stravaRouteId: string;
  routeName: string;
  className?: string;
}

const StravaRoutePreview: React.FC<StravaRoutePreviewProps> = ({
  stravaRouteId,
  routeName,
  className = 'h-48 w-full'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [embedFailed, setEmbedFailed] = React.useState(false);

  // Add CSS for proper iframe sizing
  React.useEffect(() => {
    const styleId = 'strava-preview-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .strava-embed-placeholder {
          position: relative !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
          max-width: 100% !important;
          width: 100% !important;
        }
        .strava-embed-placeholder iframe {
          width: 100% !important;
          height: 200px !important;
          max-height: 200px !important;
          border: none !important;
          position: relative !important;
          z-index: 0 !important;
        }
        /* Hide elevation profile graph while keeping elevation data */
        .strava-embed-placeholder .elevation-profile,
        .strava-embed-placeholder .elevation-chart,
        .strava-embed-placeholder [class*="elevation-graph"],
        .strava-embed-placeholder [class*="elevation-profile"],
        .strava-embed-placeholder svg[class*="elevation"] {
          display: none !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (!stravaRouteId || !containerRef.current) {
      console.log('StravaRoutePreview: Missing route ID or container ref', { stravaRouteId, hasContainer: !!containerRef.current });
      return;
    }

    console.log('StravaRoutePreview: Starting render for route:', stravaRouteId);

    // Clear any existing content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
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
    embedDiv.setAttribute('data-hide-elevation', 'false');
    embedDiv.setAttribute('data-from-embed', 'true');

    containerRef.current.appendChild(embedDiv);

    // Wait for script to be ready and initialize embed
    const waitForEmbedReady = (maxAttempts = 15, attempt = 1) => {
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
      } else if ((window as any).__STRAVA_EMBED_BOOTSTRAP__) {
        // Use the bootstrap object to initialize embeds
        const bootstrap = (window as any).__STRAVA_EMBED_BOOTSTRAP__;
        
        if (typeof bootstrap === 'function') {
          try {
            bootstrap();
            console.log('StravaRoutePreview: Initialized preview for route', stravaRouteId);
            
            // Check the result after a short delay
            setTimeout(() => {
              const embedDiv = containerRef.current?.querySelector('.strava-embed-placeholder');
              const iframe = embedDiv?.querySelector('iframe');
              if (embedDiv) {
                console.log('StravaRoutePreview: Embed content after init:', embedDiv.innerHTML.length > 0 ? 'Content loaded' : 'Still empty');
                console.log('StravaRoutePreview: Embed container size:', {
                  width: embedDiv.clientWidth,
                  height: embedDiv.clientHeight,
                  offsetHeight: embedDiv.offsetHeight
                });
                if (iframe) {
                  console.log('StravaRoutePreview: Iframe natural size:', {
                    width: iframe.width,
                    height: iframe.height,
                    offsetWidth: iframe.offsetWidth,
                    offsetHeight: iframe.offsetHeight,
                    scrollHeight: iframe.scrollHeight
                  });
                }
              }
            }, 2000);
          } catch (error) {
            console.error('StravaRoutePreview: Error initializing:', error);
          }
        }
        return;
      } else if (attempt < maxAttempts) {
        setTimeout(() => waitForEmbedReady(maxAttempts, attempt + 1), 300);
      } else {
        console.log('StravaRoutePreview: Failed to initialize after', maxAttempts, 'attempts for route', stravaRouteId);
        setEmbedFailed(true);
      }
    };

    // Load the Strava embed script if not already loaded
    const loadStravaScript = () => {
      const existingScript = document.querySelector('script[src="https://strava-embeds.com/embed.js"]');
      if (existingScript) {
        waitForEmbedReady();
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = 'https://strava-embeds.com/embed.js';
      script.async = true;
      script.onload = () => {
        setTimeout(() => waitForEmbedReady(), 100);
      };
      script.onerror = () => {
        setEmbedFailed(true);
      };
      document.head.appendChild(script);
    };

    // Try immediate auto-processing first
    setTimeout(() => {
      const embedDiv = containerRef.current?.querySelector('.strava-embed-placeholder');
      if (embedDiv && embedDiv.innerHTML.trim() !== '') {
        return;
      }
      loadStravaScript();
    }, 100);

    // Set a timeout to fall back if embed doesn't work
    const fallbackTimer = setTimeout(() => {
      if (containerRef.current && containerRef.current.children.length > 0) {
        const embedDiv = containerRef.current.querySelector('.strava-embed-placeholder');
        if (embedDiv && embedDiv.innerHTML.trim() === '') {
          console.log('StravaRoutePreview: Embed timed out for route', stravaRouteId);
          setEmbedFailed(true);
        }
      }
    }, 3000);

    // Cleanup function
    return () => {
      clearTimeout(fallbackTimer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [stravaRouteId]);

  // Show error state if embed failed
  if (embedFailed) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200`}>
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-xs text-gray-500">Route Preview</p>
        </div>
      </div>
    );
  }

  if (!stravaRouteId) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200`}>
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-xs text-gray-500">No Route</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-hidden rounded-lg border border-gray-200`} style={{ zIndex: 0 }}>
      <div 
        ref={containerRef}
        className="w-full h-full bg-gray-50 overflow-hidden"
        style={{ 
          minHeight: '200px',
          height: 'auto',
          position: 'relative',
          zIndex: 0
        }}
      />
    </div>
  );
};

export default StravaRoutePreview;