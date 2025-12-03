import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TrafficMap from '@/components/TrafficMap';
import SearchPanel from '@/components/SearchPanel';
import TrafficStatus from '@/components/TrafficStatus';
import TrafficLegend from '@/components/TrafficLegend';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type TrafficClassification = 'clear' | 'moderate' | 'heavy' | 'severe' | null;

interface RouteData {
  start: [number, number];
  end: [number, number];
}

interface TrafficAnalysis {
  classification: TrafficClassification;
  duration: number;
  distance: number;
  delay: number;
}

const Index = () => {
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [trafficAnalysis, setTrafficAnalysis] = useState<TrafficAnalysis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  const fetchMapboxToken = async () => {
    setIsLoadingToken(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) throw error;
      if (data?.token) {
        setMapboxToken(data.token);
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      toast({
        title: 'Configuration Error',
        description: 'Failed to load map configuration. Please check your Mapbox token.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleRouteSelect = async (start: [number, number], end: [number, number]) => {
    setRoute({ start, end });
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-traffic', {
        body: { startCoords: start, endCoords: end },
      });

      if (error) throw error;

      setTrafficAnalysis({
        classification: data.classification,
        duration: data.duration,
        distance: data.distance,
        delay: data.delay,
      });

      toast({
        title: 'Route Analyzed',
        description: `Traffic is ${data.classification} on this route.`,
      });
    } catch (error) {
      console.error('Error analyzing traffic:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze traffic for this route.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (route) {
      handleRouteSelect(route.start, route.end);
    }
  };

  if (isLoadingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
            <Activity className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Loading Traffic Classifier</h2>
            <p className="text-muted-foreground">Initializing map services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="glass-panel px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Traffic Classifier</h1>
              <p className="text-xs text-muted-foreground">Real-time congestion analysis</p>
            </div>
          </div>
          
          {route && (
            <Button
              variant="glass"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="animate-fade-in"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </header>

      {/* Map Container */}
      <div className="absolute inset-0">
        {mapboxToken && (
          <TrafficMap
            mapboxToken={mapboxToken}
            route={route}
          />
        )}
      </div>

      {/* Side Panel */}
      <div className="absolute left-4 top-24 bottom-4 w-96 z-10 flex flex-col gap-4 overflow-y-auto pr-2">
        <SearchPanel
          mapboxToken={mapboxToken}
          onRouteSelect={handleRouteSelect}
          isLoading={isLoading}
        />
        
        <TrafficStatus
          classification={trafficAnalysis?.classification || null}
          duration={trafficAnalysis?.duration}
          distance={trafficAnalysis?.distance}
          delay={trafficAnalysis?.delay}
          isLoading={isLoading}
        />

        <TrafficLegend />
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass-panel px-4 py-2 flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Live traffic data • Updated every minute
          </span>
        </div>
      </div>
    </div>
  );
};

export default Index;
