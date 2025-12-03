import React, { useState } from 'react';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchPanelProps {
  mapboxToken: string;
  onRouteSelect: (start: [number, number], end: [number, number]) => void;
  isLoading?: boolean;
}

interface SearchResult {
  place_name: string;
  center: [number, number];
}

const SearchPanel: React.FC<SearchPanelProps> = ({ mapboxToken, onRouteSelect, isLoading }) => {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startResults, setStartResults] = useState<SearchResult[]>([]);
  const [endResults, setEndResults] = useState<SearchResult[]>([]);
  const [selectedStart, setSelectedStart] = useState<[number, number] | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<[number, number] | null>(null);
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);

  const searchPlaces = async (query: string, type: 'start' | 'end') => {
    if (query.length < 3) {
      type === 'start' ? setStartResults([]) : setEndResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`
      );
      const data = await response.json();
      const results = data.features.map((f: any) => ({
        place_name: f.place_name,
        center: f.center,
      }));
      
      type === 'start' ? setStartResults(results) : setEndResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectPlace = (place: SearchResult, type: 'start' | 'end') => {
    if (type === 'start') {
      setSelectedStart(place.center);
      setStartQuery(place.place_name);
      setStartResults([]);
    } else {
      setSelectedEnd(place.center);
      setEndQuery(place.place_name);
      setEndResults([]);
    }
    setActiveField(null);
  };

  const handleSearch = () => {
    if (selectedStart && selectedEnd) {
      onRouteSelect(selectedStart, selectedEnd);
    }
  };

  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setSelectedStart(coords);
        setStartQuery('Current Location');
      },
      (error) => console.error('Geolocation error:', error)
    );
  };

  return (
    <div className="glass-panel p-5 space-y-4 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Navigation className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Route Planner</h2>
          <p className="text-sm text-muted-foreground">Find the best route with traffic</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Start Location */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input
                placeholder="Starting point..."
                value={startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  searchPlaces(e.target.value, 'start');
                }}
                onFocus={() => setActiveField('start')}
                className="pl-10"
              />
            </div>
            <Button
              variant="glass"
              size="icon"
              onClick={useCurrentLocation}
              title="Use current location"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
          {activeField === 'start' && startResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden">
              {startResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => selectPlace(result, 'start')}
                  className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-foreground line-clamp-1">{result.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* End Location */}
        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
            <Input
              placeholder="Destination..."
              value={endQuery}
              onChange={(e) => {
                setEndQuery(e.target.value);
                searchPlaces(e.target.value, 'end');
              }}
              onFocus={() => setActiveField('end')}
              className="pl-10"
            />
          </div>
          {activeField === 'end' && endResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden">
              {endResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => selectPlace(result, 'end')}
                  className="w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-foreground line-clamp-1">{result.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button 
        onClick={handleSearch}
        disabled={!selectedStart || !selectedEnd || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing Traffic...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Find Route
          </>
        )}
      </Button>
    </div>
  );
};

export default SearchPanel;
