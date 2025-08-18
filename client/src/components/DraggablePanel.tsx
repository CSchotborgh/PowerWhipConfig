import React, { useState, useRef, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Minimize2, Maximize2, X } from 'lucide-react';

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
  scalable = true
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Boundary constraints
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
  );
}