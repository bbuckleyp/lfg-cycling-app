import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  polyline?: string;
  routeName?: string;
  startLocation?: string;
  className?: string;
}

const RouteMap: React.FC<RouteMapProps> = ({ 
  polyline, 
  routeName = 'Route', 
  startLocation,
  className = "h-96 w-full rounded-lg"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create new map
    const map = L.map(mapRef.current).setView([37.7749, -122.4194], 13); // Default to San Francisco

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // If we have a polyline, decode and display it
    if (polyline) {
      try {
        const decodedPolyline = decodePolyline(polyline);
        const latLngs = decodedPolyline.map(([lat, lng]) => [lat, lng] as [number, number]);
        
        if (latLngs.length > 0) {
          // Create polyline
          const routeLine = L.polyline(latLngs, {
            color: '#3B82F6',
            weight: 4,
            opacity: 0.8
          }).addTo(map);

          // Add start marker
          const startMarker = L.marker(latLngs[0], {
            title: 'Start'
          }).addTo(map);

          // Add end marker
          if (latLngs.length > 1) {
            const endMarker = L.marker(latLngs[latLngs.length - 1], {
              title: 'End'
            }).addTo(map);
            
            // Custom end marker icon
            const endIcon = L.divIcon({
              html: '<div style="background-color: #EF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            endMarker.setIcon(endIcon);
          }

          // Add popup to start marker
          startMarker.bindPopup(`
            <div>
              <strong>${routeName}</strong><br/>
              ${startLocation ? `Start: ${startLocation}` : 'Route Start'}
            </div>
          `);

          // Fit map to route bounds
          map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Error decoding polyline:', error);
        // Fallback to showing start location if available
        if (startLocation) {
          addLocationMarker(map, startLocation);
        }
      }
    } else if (startLocation) {
      // No polyline, but we have a start location - try to geocode it
      addLocationMarker(map, startLocation);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [polyline, routeName, startLocation]);

  // Simple polyline decoder (Google's algorithm)
  const decodePolyline = (encoded: string): [number, number][] => {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  };

  // Add a marker for a location (basic geocoding fallback)
  const addLocationMarker = async (map: L.Map, location: string) => {
    try {
      // For demo purposes, just center on San Francisco
      // In a real app, you'd use a geocoding service
      const marker = L.marker([37.7749, -122.4194]).addTo(map);
      marker.bindPopup(`
        <div>
          <strong>Meeting Point</strong><br/>
          ${location}
        </div>
      `);
      map.setView([37.7749, -122.4194], 13);
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  return (
    <div className={className}>
      <div ref={mapRef} className="h-full w-full rounded-lg" />
    </div>
  );
};

export default RouteMap;