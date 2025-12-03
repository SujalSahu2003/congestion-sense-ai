import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startCoords, endCoords } = await req.json();
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');

    if (!mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    console.log(`Analyzing traffic from ${startCoords} to ${endCoords}`);

    // Fetch route with traffic data from Mapbox
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?geometries=geojson&overview=full&annotations=congestion,duration&access_token=${mapboxToken}`
    );

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No route found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const route = data.routes[0];
    const duration = route.duration; // seconds
    const distance = route.distance; // meters
    const typicalDuration = route.duration / (1 + (route.weight - route.duration) / route.duration || 1);
    const delay = Math.max(0, duration - typicalDuration);

    // Analyze congestion from annotations
    const congestionAnnotations = route.legs[0]?.annotation?.congestion || [];
    const congestionCounts = {
      low: 0,
      moderate: 0,
      heavy: 0,
      severe: 0,
      unknown: 0,
    };

    congestionAnnotations.forEach((level: string) => {
      if (level in congestionCounts) {
        congestionCounts[level as keyof typeof congestionCounts]++;
      } else {
        congestionCounts.unknown++;
      }
    });

    // Determine overall classification
    const total = congestionAnnotations.length || 1;
    const severeRatio = congestionCounts.severe / total;
    const heavyRatio = congestionCounts.heavy / total;
    const moderateRatio = congestionCounts.moderate / total;

    let classification: 'clear' | 'moderate' | 'heavy' | 'severe';
    if (severeRatio > 0.2) {
      classification = 'severe';
    } else if (heavyRatio > 0.3 || severeRatio > 0.1) {
      classification = 'heavy';
    } else if (moderateRatio > 0.3 || heavyRatio > 0.1) {
      classification = 'moderate';
    } else {
      classification = 'clear';
    }

    console.log(`Traffic analysis complete: ${classification}, duration: ${duration}s, distance: ${distance}m`);

    return new Response(
      JSON.stringify({
        classification,
        duration,
        distance,
        delay: Math.round(delay),
        congestionBreakdown: congestionCounts,
        route: route.geometry,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Traffic analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze traffic' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
