import React from 'react';
import { useDesignCanvas } from '@/contexts/DesignCanvasContext';
import { cn } from '@/lib/utils';

interface DockZonesProps {
  isDragging: boolean;
  onDockZoneHover: (zone: 'top' | 'bottom' | 'left' | 'right' | null) => void;
}

export function DockZones({ isDragging, onDockZoneHover }: DockZonesProps) {
  const { activeDockZone } = useDesignCanvas();

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Top Dock Zone */}
      <div 
        className={cn(
          "absolute top-0 left-1/4 w-1/2 h-24 transition-all duration-200 pointer-events-auto",
          "flex items-center justify-center",
          activeDockZone === 'top' 
            ? "bg-primary/30 border-2 border-primary shadow-lg" 
            : "bg-muted/10 border-2 border-dashed border-muted-foreground/30"
        )}
        onMouseEnter={() => onDockZoneHover('top')}
        onMouseLeave={() => onDockZoneHover(null)}
        data-testid="dock-zone-top"
      >
        {activeDockZone === 'top' && (
          <div className="text-primary font-semibold text-sm bg-background/90 px-3 py-1 rounded-md border border-primary">
            Drop to dock at TOP
          </div>
        )}
      </div>

      {/* Bottom Dock Zone */}
      <div 
        className={cn(
          "absolute bottom-0 left-1/4 w-1/2 h-24 transition-all duration-200 pointer-events-auto",
          "flex items-center justify-center",
          activeDockZone === 'bottom' 
            ? "bg-primary/30 border-2 border-primary shadow-lg" 
            : "bg-muted/10 border-2 border-dashed border-muted-foreground/30"
        )}
        onMouseEnter={() => onDockZoneHover('bottom')}
        onMouseLeave={() => onDockZoneHover(null)}
        data-testid="dock-zone-bottom"
      >
        {activeDockZone === 'bottom' && (
          <div className="text-primary font-semibold text-sm bg-background/90 px-3 py-1 rounded-md border border-primary">
            Drop to dock at BOTTOM
          </div>
        )}
      </div>

      {/* Left Dock Zone */}
      <div 
        className={cn(
          "absolute top-1/4 left-0 w-24 h-1/2 transition-all duration-200 pointer-events-auto",
          "flex items-center justify-center",
          activeDockZone === 'left' 
            ? "bg-primary/30 border-2 border-primary shadow-lg" 
            : "bg-muted/10 border-2 border-dashed border-muted-foreground/30"
        )}
        onMouseEnter={() => onDockZoneHover('left')}
        onMouseLeave={() => onDockZoneHover(null)}
        data-testid="dock-zone-left"
      >
        {activeDockZone === 'left' && (
          <div className="text-primary font-semibold text-sm bg-background/90 px-3 py-1 rounded-md border border-primary writing-mode-vertical">
            Drop to dock at LEFT
          </div>
        )}
      </div>

      {/* Right Dock Zone */}
      <div 
        className={cn(
          "absolute top-1/4 right-0 w-24 h-1/2 transition-all duration-200 pointer-events-auto",
          "flex items-center justify-center",
          activeDockZone === 'right' 
            ? "bg-primary/30 border-2 border-primary shadow-lg" 
            : "bg-muted/10 border-2 border-dashed border-muted-foreground/30"
        )}
        onMouseEnter={() => onDockZoneHover('right')}
        onMouseLeave={() => onDockZoneHover(null)}
        data-testid="dock-zone-right"
      >
        {activeDockZone === 'right' && (
          <div className="text-primary font-semibold text-sm bg-background/90 px-3 py-1 rounded-md border border-primary writing-mode-vertical">
            Drop to dock at RIGHT
          </div>
        )}
      </div>
    </div>
  );
}
