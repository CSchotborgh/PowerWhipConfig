import { useState, createContext, useContext, ReactNode } from 'react';
import { DraggablePanel } from './DraggablePanel';

interface Panel {
  id: string;
  title: string;
  component: ReactNode;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  scalable?: boolean;
  zIndex?: number;
  enableCollision?: boolean;
}

interface PanelManagerContextType {
  panels: Panel[];
  openPanel: (panel: Partial<Panel> & { title: string; component: ReactNode }) => string;
  closePanel: (id: string) => void;
  updatePanel: (id: string, updates: Partial<Panel>) => void;
  bringToFront: (id: string) => void;
  checkCollisions: (panelId: string, newPosition: { x: number; y: number }, panelSize: { width: number; height: number }) => { x: number; y: number };
}

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export function PanelManagerProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(9999);

  const openPanel = (panel: Partial<Panel> & { title: string; component: ReactNode }): string => {
    const id = panel.id || Math.random().toString(36).substr(2, 9);
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    
    const newPanel: Panel = {
      ...panel,
      id,
      position: panel.position || { 
        x: 100 + panels.length * 30, 
        y: 100 + panels.length * 30 
      },
      zIndex: newZIndex
    };
    setPanels(prev => [...prev, newPanel]);
    return id;
  };

  const closePanel = (id: string) => {
    setPanels(prev => prev.filter(panel => panel.id !== id));
  };

  const updatePanel = (id: string, updates: Partial<Panel>) => {
    setPanels(prev => prev.map(panel => 
      panel.id === id ? { ...panel, ...updates } : panel
    ));
  };

  const bringToFront = (id: string) => {
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    setPanels(prev => prev.map(panel =>
      panel.id === id ? { ...panel, zIndex: newZIndex } : panel
    ));
  };

  const checkCollisions = (panelId: string, newPosition: { x: number; y: number }, panelSize: { width: number; height: number }) => {
    const currentPanel = panels.find(p => p.id === panelId);
    if (!currentPanel?.enableCollision) return newPosition;

    let adjustedX = newPosition.x;
    let adjustedY = newPosition.y;
    const margin = 10; // Minimum gap between panels

    // Check collision with other panels that have collision enabled
    panels.forEach(otherPanel => {
      if (otherPanel.id === panelId || !otherPanel.enableCollision || !otherPanel.position || !otherPanel.size) return;

      const panel1 = {
        left: adjustedX,
        right: adjustedX + panelSize.width,
        top: adjustedY,
        bottom: adjustedY + panelSize.height
      };

      const panel2 = {
        left: otherPanel.position.x,
        right: otherPanel.position.x + otherPanel.size.width,
        top: otherPanel.position.y,
        bottom: otherPanel.position.y + otherPanel.size.height
      };

      // Check if panels overlap
      const overlapX = panel1.right > panel2.left && panel1.left < panel2.right;
      const overlapY = panel1.bottom > panel2.top && panel1.top < panel2.bottom;

      if (overlapX && overlapY) {
        // Calculate overlap amounts in each direction
        const overlapLeft = panel1.right - panel2.left;
        const overlapRight = panel2.right - panel1.left;
        const overlapTop = panel1.bottom - panel2.top;
        const overlapBottom = panel2.bottom - panel1.top;

        // Find smallest overlap to determine push direction
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        // Push panel in direction of smallest overlap
        if (minOverlap === overlapLeft) {
          adjustedX = panel2.left - panelSize.width - margin;
        } else if (minOverlap === overlapRight) {
          adjustedX = panel2.right + margin;
        } else if (minOverlap === overlapTop) {
          adjustedY = panel2.top - panelSize.height - margin;
        } else {
          adjustedY = panel2.bottom + margin;
        }
      }
    });

    // Keep within viewport bounds
    const maxX = window.innerWidth - panelSize.width;
    const maxY = window.innerHeight - panelSize.height;
    adjustedX = Math.max(0, Math.min(adjustedX, maxX));
    adjustedY = Math.max(0, Math.min(adjustedY, maxY));

    return { x: adjustedX, y: adjustedY };
  };

  return (
    <PanelManagerContext.Provider value={{ panels, openPanel, closePanel, updatePanel, bringToFront, checkCollisions }}>
      {children}
      
      {/* Render all open panels */}
      {panels.map(panel => (
        <DraggablePanel
          key={panel.id}
          id={panel.id}
          title={panel.title}
          defaultPosition={panel.position}
          defaultSize={panel.size}
          minSize={panel.minSize}
          maxSize={panel.maxSize}
          scalable={panel.scalable !== false}
          zIndex={panel.zIndex}
          enableCollision={panel.enableCollision}
          onClose={() => closePanel(panel.id)}
          onBringToFront={() => bringToFront(panel.id)}
          onPositionChange={(newPosition) => {
            if (panel.enableCollision && panel.size) {
              const adjustedPosition = checkCollisions(panel.id, newPosition, panel.size);
              if (adjustedPosition.x !== newPosition.x || adjustedPosition.y !== newPosition.y) {
                updatePanel(panel.id, { position: adjustedPosition });
              }
            }
          }}
        >
          {panel.component}
        </DraggablePanel>
      ))}
    </PanelManagerContext.Provider>
  );
}

export function usePanelManager() {
  const context = useContext(PanelManagerContext);
  if (!context) {
    throw new Error('usePanelManager must be used within a PanelManagerProvider');
  }
  return context;
}