import React, { useState, useRef, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Minimize2, Maximize2, X, Pin, PinOff } from 'lucide-react';
import { useDesignCanvas } from '@/contexts/DesignCanvasContext';
import { usePanelManager } from './PanelManager';
import { useFloatingPanelCoordinatorOptional } from '@/contexts/FloatingPanelCoordinator';

interface DraggablePanelProps {
  id: string;
  title: string;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  onClose?: () => void;
  className?: string;
  scalable?: boolean;
  enableGridSnap?: boolean;
  enableDocking?: boolean;
  zIndex?: number;
  onBringToFront?: () => void;
  enableCollision?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export function DraggablePanel({
  id,
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 500 },
  minSize = { width: 200, height: 150 },
  maxSize = { width: 1200, height: 800 },
  onClose,
  className = '',
  scalable = true,
  enableGridSnap = true,
  enableDocking = true,
  zIndex = 9999,
  onBringToFront,
  enableCollision = false,
  onPositionChange
}: DraggablePanelProps) {
  const { setActiveDockZone, activeDockZone, dockPanel, undockPanel, dockedPanels, setIsDraggingPanel } = useDesignCanvas();
  
  // Try to get panel manager context (may not be available for all panels)
  let panelManager = null;
  try {
    panelManager = usePanelManager();
  } catch (e) {
    // Panel manager not available - will use coordinator instead
  }
  
  // Get floating panel coordinator (for standalone panels)
  const coordinator = useFloatingPanelCoordinatorOptional();
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPinned, setIsPinned] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [dockedPosition, setDockedPosition] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const currentDockZoneRef = useRef<'top' | 'bottom' | 'left' | 'right' | null>(null);
  
  const gridSize = 20; // pixels
  const dockThreshold = 10; // pixels from edge to trigger docking
  
  // Check if this panel is currently docked
  const isDocked = dockedPanels.some(p => p.id === id);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current || isPinned) return;
    
    // Bring panel to front when clicked
    if (onBringToFront) {
      onBringToFront();
    }
    
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setIsDraggingPanel(true); // Notify context that a panel is being dragged
    
    // Show grid when holding Ctrl/Cmd key
    if (enableGridSnap && (e.ctrlKey || e.metaKey)) {
      setShowGrid(true);
      setSnapToGrid(true);
    }
  };

  const snapToGridPosition = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;
    
    // Apply grid snapping if Ctrl/Cmd is held
    if (e.ctrlKey || e.metaKey) {
      if (!snapToGrid) {
        setSnapToGrid(true);
        setShowGrid(true);
      }
      const snapped = snapToGridPosition(newX, newY);
      newX = snapped.x;
      newY = snapped.y;
    } else {
      if (snapToGrid) {
        setSnapToGrid(false);
        setShowGrid(false);
      }
    }
    
    // Allow free positioning anywhere - minimal constraints
    // Only prevent complete off-screen (keep 50px visible)
    const minVisible = 50;
    const maxX = window.innerWidth - minVisible;
    const maxY = window.innerHeight - minVisible;
    
    const constrainedX = Math.max(-size.width + minVisible, Math.min(newX, maxX));
    const constrainedY = Math.max(-size.height + minVisible, Math.min(newY, maxY));
    
    // Docking zone detection (for visual feedback during drag)
    if (enableDocking) {
      let newDockedPosition: typeof dockedPosition = null;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const dockZoneSize = 96; // Match DockZones component size
      
      // Detect if mouse is over dock zones (centered zones, not edges)
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Top zone: centered, top 96px
      if (mouseY <= dockZoneSize && mouseX >= screenWidth / 4 && mouseX <= (screenWidth * 3) / 4) {
        newDockedPosition = 'top';
        console.log('Hovering over TOP dock zone');
      }
      // Bottom zone: centered, bottom 96px
      else if (mouseY >= screenHeight - dockZoneSize && mouseX >= screenWidth / 4 && mouseX <= (screenWidth * 3) / 4) {
        newDockedPosition = 'bottom';
        console.log('Hovering over BOTTOM dock zone');
      }
      // Left zone: centered vertically, left 96px
      else if (mouseX <= dockZoneSize && mouseY >= screenHeight / 4 && mouseY <= (screenHeight * 3) / 4) {
        newDockedPosition = 'left';
        console.log('Hovering over LEFT dock zone');
      }
      // Right zone: centered vertically, right 96px
      else if (mouseX >= screenWidth - dockZoneSize && mouseY >= screenHeight / 4 && mouseY <= (screenHeight * 3) / 4) {
        newDockedPosition = 'right';
        console.log('Hovering over RIGHT dock zone');
      }
      
      // Store in ref for immediate access in handleMouseUp
      currentDockZoneRef.current = newDockedPosition;
      setDockedPosition(newDockedPosition);
      setActiveDockZone(newDockedPosition);
    }
    
    let newPosition = { x: constrainedX, y: constrainedY };
    
    // Apply collision detection/snapping if enabled
    if (enableCollision) {
      if (panelManager) {
        // Use PanelManager for managed panels
        const adjustedPosition = panelManager.checkCollisions(id, newPosition, size);
        if (adjustedPosition.x !== newPosition.x || adjustedPosition.y !== newPosition.y) {
          newPosition = adjustedPosition;
        }
      } else if (coordinator) {
        // Use Coordinator for standalone panels
        const adjustedPosition = coordinator.getSnappedPosition(id, newPosition, size);
        if (adjustedPosition.x !== newPosition.x || adjustedPosition.y !== newPosition.y) {
          newPosition = adjustedPosition;
        }
      }
    }
    
    setPosition(newPosition);
    
    // Notify parent of position change
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  };

  const handleMouseUp = () => {
    // Handle docking if panel is in a dock zone (use ref for immediate value)
    const targetDockZone = currentDockZoneRef.current;
    
    if (enableDocking && targetDockZone) {
      // Determine dock size based on position and panel ID
      let dockSize: number;
      if (targetDockZone === 'top' || targetDockZone === 'bottom') {
        dockSize = size.height;
      } else {
        // For left/right docking, use narrower width for All Features panel
        dockSize = id === 'all-features-panel' ? 80 : size.width;
      }
      
      console.log('Docking panel:', { id, title, position: targetDockZone, size: dockSize, enableDocking });
      dockPanel({
        id,
        title,
        position: targetDockZone,
        size: dockSize
      });
    } else {
      console.log('Docking skipped:', { enableDocking, targetDockZone, dockedPosition, activeDockZone });
    }
    
    // Clear states
    currentDockZoneRef.current = null;
    setIsDragging(false);
    setIsDraggingPanel(false); // Clear global dragging state
    setShowGrid(false);
    setSnapToGrid(false);
    setActiveDockZone(null);
    setDockedPosition(null);
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

  // If docked, don't render the floating panel (avoid early return to prevent hook violations)
  if (isDocked) {
    return null;
  }

  return (
    <>
      {/* Grid Overlay - Shows when dragging with Ctrl/Cmd */}
      {showGrid && (
        <div 
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent ${gridSize-1}px, rgba(59, 130, 246, 0.2) ${gridSize-1}px, rgba(59, 130, 246, 0.2) ${gridSize}px),
              repeating-linear-gradient(90deg, transparent, transparent ${gridSize-1}px, rgba(59, 130, 246, 0.2) ${gridSize-1}px, rgba(59, 130, 246, 0.2) ${gridSize}px)
            `,
            backgroundColor: 'rgba(59, 130, 246, 0.05)'
          }}
        />
      )}
      
      {/* Dock Zone Indicators - Show when dragging */}
      {isDragging && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Top Dock Zone */}
          <div className={`absolute top-0 left-0 right-0 h-3 transition-all ${
            dockedPosition === 'top' ? 'bg-primary/30 border-b-2 border-primary' : 'bg-muted/10'
          }`} />
          
          {/* Bottom Dock Zone */}
          <div className={`absolute bottom-0 left-0 right-0 h-3 transition-all ${
            dockedPosition === 'bottom' ? 'bg-primary/30 border-t-2 border-primary' : 'bg-muted/10'
          }`} />
          
          {/* Left Dock Zone */}
          <div className={`absolute top-0 left-0 bottom-0 w-3 transition-all ${
            dockedPosition === 'left' ? 'bg-primary/30 border-r-2 border-primary' : 'bg-muted/10'
          }`} />
          
          {/* Right Dock Zone */}
          <div className={`absolute top-0 right-0 bottom-0 w-3 transition-all ${
            dockedPosition === 'right' ? 'bg-primary/30 border-l-2 border-primary' : 'bg-muted/10'
          }`} />
        </div>
      )}
      
      <Card
        ref={panelRef}
        className={`fixed shadow-2xl border-2 ${dockedPosition ? 'border-primary/50 ring-4 ring-primary/30' : ''} ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'select-none' : ''} ${className}`}
        style={{
          left: position.x,
          top: position.y,
          width: size.width * scale,
          height: isMinimized ? 'auto' : size.height * scale,
          minWidth: minSize.width,
          minHeight: isMinimized ? 'auto' : minSize.height,
          transform: scalable ? `scale(${scale})` : 'none',
          transformOrigin: 'top left',
          zIndex: zIndex
        }}
        onWheel={scalable ? handleWheel : undefined}
        onMouseDown={() => {
          // Bring to front on any click/interaction
          if (onBringToFront) {
            onBringToFront();
          }
        }}
      >
      <CardHeader 
        className={`flex flex-row items-center justify-between p-3 bg-muted/50 ${isPinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{title}</h3>
          {dockedPosition && (
            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
              Docked: {dockedPosition.toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Pin Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPinned(!isPinned)}
            className={`h-6 w-6 p-0 ${isPinned ? 'text-primary' : ''}`}
            title={isPinned ? "Unpin panel (allow dragging)" : "Pin panel in place"}
          >
            {isPinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
          </Button>
          
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