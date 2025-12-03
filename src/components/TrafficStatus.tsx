import React from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle2, TrendingUp, Car } from 'lucide-react';

interface TrafficStatusProps {
  classification: 'clear' | 'moderate' | 'heavy' | 'severe' | null;
  duration?: number; // in seconds
  distance?: number; // in meters
  delay?: number; // delay in seconds compared to free flow
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  clear: {
    label: 'Clear',
    description: 'Traffic is flowing smoothly',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    icon: CheckCircle2,
    pulseColor: 'bg-primary',
  },
  moderate: {
    label: 'Moderate',
    description: 'Some slowdowns expected',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
    icon: Activity,
    pulseColor: 'bg-accent',
  },
  heavy: {
    label: 'Heavy',
    description: 'Significant delays likely',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: TrendingUp,
    pulseColor: 'bg-orange-500',
  },
  severe: {
    label: 'Severe',
    description: 'Major congestion ahead',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    icon: AlertTriangle,
    pulseColor: 'bg-destructive',
  },
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const TrafficStatus: React.FC<TrafficStatusProps> = ({
  classification,
  duration,
  distance,
  delay,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-secondary" />
          <div className="space-y-2">
            <div className="h-5 w-24 bg-secondary rounded" />
            <div className="h-4 w-32 bg-secondary rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!classification) {
    return (
      <div className="glass-panel p-5 animate-fade-in">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Car className="w-6 h-6" />
          <div>
            <p className="font-medium">Select a route</p>
            <p className="text-sm">Choose start and destination to see traffic</p>
          </div>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[classification];
  const StatusIcon = config.icon;

  return (
    <div className={`glass-panel p-5 border ${config.borderColor} animate-scale-in`}>
      {/* Status Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-14 h-14 rounded-xl ${config.bgColor} flex items-center justify-center relative`}>
          <StatusIcon className={`w-7 h-7 ${config.color}`} />
          <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${config.pulseColor} animate-pulse`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-2xl font-bold ${config.color}`}>{config.label}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
              LIVE
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Duration */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Duration</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {duration ? formatDuration(duration) : '--'}
          </p>
        </div>

        {/* Distance */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Distance</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {distance ? formatDistance(distance) : '--'}
          </p>
        </div>

        {/* Delay */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Delay</span>
          </div>
          <p className={`text-xl font-bold font-mono ${delay && delay > 0 ? config.color : 'text-foreground'}`}>
            {delay ? `+${formatDuration(delay)}` : '0 min'}
          </p>
        </div>
      </div>

      {/* Traffic Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Congestion Level</span>
          <span className={config.color}>{classification.charAt(0).toUpperCase() + classification.slice(1)}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full ${config.pulseColor} transition-all duration-500 rounded-full`}
            style={{ 
              width: classification === 'clear' ? '25%' 
                : classification === 'moderate' ? '50%' 
                : classification === 'heavy' ? '75%' 
                : '100%' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrafficStatus;
