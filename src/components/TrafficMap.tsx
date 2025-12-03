import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface TrafficMapProps {
  mapboxToken: string;
  onLocationSelect?: (lng: number, lat: number) => void;
  route?: { start: [number, number]; end: [number, number] } | null;
  trafficData?: Array<{
    coordinates: [number, number];
    level: 'clear' | 'moderate' | 'heavy' | 'severe';
  }>;
}

const TRAFFIC_COLORS = {
  clear: '#22c55e',
  moderate: '#f59e0b',
  heavy: '#f97316',
  severe: '#ef4444',
};

const TrafficMap: React.FC<TrafficMapProps> = ({ 
  mapboxToken, 
  onLocationSelect, 
  route,
  trafficData = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [77.5946, 12.9716], // Bangalore, India
      zoom: 11,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add traffic layer
      map.current?.addSource('traffic', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1',
      });

      map.current?.addLayer({
        id: 'traffic-layer',
        type: 'line',
        source: 'traffic',
        'source-layer': 'traffic',
        paint: {
          'line-width': 3,
          'line-color': [
            'match',
            ['get', 'congestion'],
            'low', TRAFFIC_COLORS.clear,
            'moderate', TRAFFIC_COLORS.moderate,
            'heavy', TRAFFIC_COLORS.heavy,
            'severe', TRAFFIC_COLORS.severe,
            '#888888'
          ],
          'line-opacity': 0.8,
        },
      });

      // Add atmosphere effect
      map.current?.setFog({
        color: 'rgb(15, 23, 42)',
        'high-color': 'rgb(30, 41, 59)',
        'horizon-blend': 0.1,
      });
    });

    map.current.on('click', (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.lngLat.lng, e.lngLat.lat);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Handle route display
  useEffect(() => {
    if (!map.current || !mapLoaded || !route) return;

    // Clear existing route
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add start marker
    const startMarker = new mapboxgl.Marker({ color: TRAFFIC_COLORS.clear })
      .setLngLat(route.start)
      .addTo(map.current);
    markersRef.current.push(startMarker);

    // Add end marker
    const endMarker = new mapboxgl.Marker({ color: TRAFFIC_COLORS.severe })
      .setLngLat(route.end)
      .addTo(map.current);
    markersRef.current.push(endMarker);

    // Fetch route from Mapbox Directions API
    const fetchRoute = async () => {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${route.start[0]},${route.start[1]};${route.end[0]},${route.end[1]}?geometries=geojson&overview=full&annotations=congestion&access_token=${mapboxToken}`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const routeData = data.routes[0];
        
        map.current?.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeData.geometry,
          },
        });

        map.current?.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.8,
          },
        });

        // Fit map to route bounds
        const coordinates = routeData.geometry.coordinates;
        const bounds = coordinates.reduce(
          (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord);
          },
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );

        map.current?.fitBounds(bounds, { padding: 80 });
      }
    };

    fetchRoute();
  }, [route, mapLoaded, mapboxToken]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
};

export default TrafficMap;
