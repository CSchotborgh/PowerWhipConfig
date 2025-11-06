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
    const snapThreshold = 20; // Distance in pixels to trigger snapping

    // Check for snapping opportunities with other panels
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

      // Snap to left edge (panel1 right edge near panel2 left edge)
      if (Math.abs(panel1.right - panel2.left) < snapThreshold) {
        adjustedX = panel2.left - panelSize.width;
      }
      // Snap to right edge (panel1 left edge near panel2 right edge)
      else if (Math.abs(panel1.left - panel2.right) < snapThreshold) {
        adjustedX = panel2.right;
      }

      // Snap to top edge (panel1 bottom edge near panel2 top edge)
      if (Math.abs(panel1.bottom - panel2.top) < snapThreshold) {
        adjustedY = panel2.top - panelSize.height;
      }
      // Snap to bottom edge (panel1 top edge near panel2 bottom edge)
      else if (Math.abs(panel1.top - panel2.bottom) < snapThreshold) {
        adjustedY = panel2.bottom;
      }

      // Align edges when panels are side-by-side or stacked
      // Align top edges
      if (Math.abs(panel1.top - panel2.top) < snapThreshold) {
        adjustedY = panel2.top;
      }
      // Align bottom edges
      else if (Math.abs(panel1.bottom - panel2.bottom) < snapThreshold) {
        adjustedY = panel2.bottom - panelSize.height;
      }

      // Align left edges
      if (Math.abs(panel1.left - panel2.left) < snapThreshold) {
        adjustedX = panel2.left;
      }
      // Align right edges
      else if (Math.abs(panel1.right - panel2.right) < snapThreshold) {
        adjustedX = panel2.right - panelSize.width;
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