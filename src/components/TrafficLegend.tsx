import React from 'react';

const LEGEND_ITEMS = [
  { label: 'Clear', color: 'bg-primary' },
  { label: 'Moderate', color: 'bg-accent' },
  { label: 'Heavy', color: 'bg-orange-500' },
  { label: 'Severe', color: 'bg-destructive' },
];

const TrafficLegend: React.FC = () => {
  return (
    <div className="glass-panel p-4 animate-fade-in">
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Traffic Legend</h4>
      <div className="flex flex-wrap gap-3">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-sm text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficLegend;
