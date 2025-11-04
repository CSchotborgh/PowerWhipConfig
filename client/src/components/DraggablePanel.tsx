import React, { useState, useRef, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Minimize2, Maximize2, X } from 'lucide-react';

type DockPosition = 'none' | 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface DraggablePanelProps {
  title: string;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  onClose?: () => void;
  className?: string;
  scalable?: boolean;
  enableDocking?: boolean;
}

export function DraggablePanel({
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 500 },
  minSize = { width: 200, height: 150 },
  maxSize = { width: 1200, height: 800 },
  onClose,
  className = '',
  scalable = true,
  enableDocking = true
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dockPosition, setDockPosition] = useState<DockPosition>('none');
  const [showDockZones, setShowDockZones] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const detectDockZone = (x: number, y: number): DockPosition => {
    if (!enableDocking) return 'none';
    
    const dockThreshold = 50; // pixels from edge to trigger docking
    const cornerThreshold = 150; // pixels for corner detection
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Corner zones
    if (x < cornerThreshold && y < cornerThreshold) return 'top-left';
    if (x > vw - cornerThreshold && y < cornerThreshold) return 'top-right';
    if (x < cornerThreshold && y > vh - cornerThreshold) return 'bottom-left';
    if (x > vw - cornerThreshold && y > vh - cornerThreshold) return 'bottom-right';
    
    // Edge zones
    if (x < dockThreshold) return 'left';
    if (x > vw - dockThreshold) return 'right';
    if (y < dockThreshold) return 'top';
    if (y > vh - dockThreshold) return 'bottom';
    
    return 'none';
  };

  const snapToDock = (dock: DockPosition) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dockOffset = 20; // pixels from edge when docked
    
    switch (dock) {
      case 'top':
        setPosition({ x: (vw - size.width) / 2, y: dockOffset });
        break;
      case 'right':
        setPosition({ x: vw - size.width - dockOffset, y: (vh - size.height) / 2 });
        break;
      case 'bottom':
        setPosition({ x: (vw - size.width) / 2, y: vh - size.height - dockOffset });
        break;
      case 'left':
        setPosition({ x: dockOffset, y: (vh - size.height) / 2 });
        break;
      case 'top-left':
        setPosition({ x: dockOffset, y: dockOffset });
        break;
      case 'top-right':
        setPosition({ x: vw - size.width - dockOffset, y: dockOffset });
        break;
      case 'bottom-left':
        setPosition({ x: dockOffset, y: vh - size.height - dockOffset });
        break;
      case 'bottom-right':
        setPosition({ x: vw - size.width - dockOffset, y: vh - size.height - dockOffset });
        break;
      default:
        break;
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Detect dock zone
    const dock = detectDockZone(e.clientX, e.clientY);
    setDockPosition(dock);
    
    // Allow free positioning - remove strict boundary constraints
    // Only prevent complete off-screen (keep 50px visible)
    const minVisible = 50;
    const maxX = window.innerWidth - minVisible;
    const maxY = window.innerHeight - minVisible;
    
    setPosition({
      x: Math.max(-size.width + minVisible, Math.min(newX, maxX)),
      y: Math.max(-size.height + minVisible, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    // Snap to dock if in a dock zone
    if (dockPosition !== 'none') {
      snapToDock(dockPosition);
    }
    setIsDragging(false);
    setShowDockZones(false);
    setDockPosition('none');
  };

  // Global mouse event listeners
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragOffset]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const resetSize = () => {
    setSize(defaultSize);
    setScale(1);
  };

  const handleResize = (direction: 'width' | 'height', delta: number) => {
    setSize(prev => ({
      ...prev,
      [direction]: Math.max(minSize[direction], Math.min(maxSize[direction], prev[direction] + delta))
    }));
  };

  const handleScale = (newScale: number) => {
    const clampedScale = Math.max(0.5, Math.min(2, newScale));
    setScale(clampedScale);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleScale(scale + delta);
    }
  };

  return (
    <>
      {/* Dock Zone Indicators */}
      {showDockZones && enableDocking && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Top */}
          <div className={`absolute top-0 left-1/4 w-1/2 h-16 border-2 border-dashed transition-all ${
            dockPosition === 'top' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
          
          {/* Right */}
          <div className={`absolute top-1/4 right-0 w-16 h-1/2 border-2 border-dashed transition-all ${
            dockPosition === 'right' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
          
          {/* Bottom */}
          <div className={`absolute bottom-0 left-1/4 w-1/2 h-16 border-2 border-dashed transition-all ${
            dockPosition === 'bottom' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
          
          {/* Left */}
          <div className={`absolute top-1/4 left-0 w-16 h-1/2 border-2 border-dashed transition-all ${
            dockPosition === 'left' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
          
          {/* Corners */}
          <div className={`absolute top-0 left-0 w-32 h-32 border-2 border-dashed transition-all ${
            dockPosition === 'top-left' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
          <div className={`absolute top-0 right-0 w-32 h-32 border-2 border-dashed transition-all ${
            dockPosition === 'top-right' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
          <div className={`absolute bottom-0 left-0 w-32 h-32 border-2 border-dashed transition-all ${
            dockPosition === 'bottom-left' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
          <div className={`absolute bottom-0 right-0 w-32 h-32 border-2 border-dashed transition-all ${
            dockPosition === 'bottom-right' ? 'bg-primary/20 border-primary' : 'bg-muted/10 border-muted-foreground/30'
          }`} />
        </div>
      )}
      
      <Card
        ref={panelRef}
        className={`fixed shadow-2xl border-2 z-50 ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'select-none' : ''} ${className}`}
        style={{
          left: position.x,
          top: position.y,
          width: size.width * scale,
          height: isMinimized ? 'auto' : size.height * scale,
          minWidth: minSize.width,
          minHeight: isMinimized ? 'auto' : minSize.height,
          transform: scalable ? `scale(${scale})` : 'none',
          transformOrigin: 'top left'
        }}
        onWheel={scalable ? handleWheel : undefined}
      >
      <CardHeader 
        className="flex flex-row items-center justify-between p-3 bg-muted/50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        
        <div className="flex items-center gap-1">
          {scalable && (
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleScale(scale - 0.1)}
                className="h-6 w-6 p-0 text-xs"
                disabled={scale <= 0.5}
              >
                -
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleScale(scale + 0.1)}
                className="h-6 w-6 p-0 text-xs"
                disabled={scale >= 2}
              >
                +
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSize}
                className="h-6 w-6 p-0"
                title="Reset size and scale"
              >
                ⟲
              </Button>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimize}
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-4 overflow-auto relative" style={{ height: (size.height - 60) * scale }}>
          {children}
          
          {/* Resize handles */}
          {scalable && (
            <>
              {/* Corner resize handle */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-muted-foreground/20 hover:bg-muted-foreground/40 z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startWidth = size.width;
                  const startHeight = size.height;

                  const handleResize = (e: MouseEvent) => {
                    const deltaX = (e.clientX - startX) / scale;
                    const deltaY = (e.clientY - startY) / scale;
                    setSize({
                      width: Math.max(minSize.width, Math.min(maxSize.width, startWidth + deltaX)),
                      height: Math.max(minSize.height, Math.min(maxSize.height, startHeight + deltaY))
                    });
                  };

                  const handleMouseUp = () => {
                    setIsResizing(false);
                    document.removeEventListener('mousemove', handleResize);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleResize);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              
              {/* Right edge resize handle */}
              <div
                className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-muted-foreground/10 z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  const startX = e.clientX;
                  const startWidth = size.width;

                  const handleResize = (e: MouseEvent) => {
                    const deltaX = (e.clientX - startX) / scale;
                    setSize(prev => ({
                      ...prev,
                      width: Math.max(minSize.width, Math.min(maxSize.width, startWidth + deltaX))
                    }));
                  };

                  const handleMouseUp = () => {
                    setIsResizing(false);
                    document.removeEventListener('mousemove', handleResize);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleResize);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              
              {/* Bottom edge resize handle */}
              <div
                className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-muted-foreground/10 z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  const startY = e.clientY;
                  const startHeight = size.height;

                  const handleResize = (e: MouseEvent) => {
                    const deltaY = (e.clientY - startY) / scale;
                    setSize(prev => ({
                      ...prev,
                      height: Math.max(minSize.height, Math.min(maxSize.height, startHeight + deltaY))
                    }));
                  };

                  const handleMouseUp = () => {
                    setIsResizing(false);
                    document.removeEventListener('mousemove', handleResize);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleResize);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            </>
          )}
        </CardContent>
      )}
      </Card>
    </>
  );
}