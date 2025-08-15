import React, { useState, useRef, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Minimize2, Maximize2, X } from 'lucide-react';

interface DraggablePanelProps {
  title: string;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  onClose?: () => void;
  className?: string;
}

export function DraggablePanel({
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 500 },
  onClose,
  className = ''
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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

  const handleResize = (direction: 'width' | 'height', delta: number) => {
    setSize(prev => ({
      ...prev,
      [direction]: Math.max(200, prev[direction] + delta)
    }));
  };

  return (
    <Card
      ref={panelRef}
      className={`fixed shadow-2xl border-2 z-50 ${isDragging ? 'cursor-grabbing' : ''} ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 'auto' : size.height,
        minWidth: 200,
        minHeight: isMinimized ? 'auto' : 200
      }}
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
        <CardContent className="p-4 overflow-auto" style={{ height: size.height - 60 }}>
          {children}
          
          {/* Resize handles */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-muted-foreground/20 hover:bg-muted-foreground/40"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = size.width;
              const startHeight = size.height;

              const handleResize = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                setSize({
                  width: Math.max(200, startWidth + deltaX),
                  height: Math.max(200, startHeight + deltaY)
                });
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleResize);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleResize);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </CardContent>
      )}
    </Card>
  );
}