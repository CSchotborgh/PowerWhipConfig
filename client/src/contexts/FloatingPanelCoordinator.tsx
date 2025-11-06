import { createContext, useContext, useState, ReactNode } from 'react';

interface PanelInfo {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface FloatingPanelCoordinatorContextType {
  registerPanel: (id: string, position: { x: number; y: number }, size: { width: number; height: number }) => void;
  unregisterPanel: (id: string) => void;
  updatePanelPosition: (id: string, position: { x: number; y: number }) => void;
  getSnappedPosition: (id: string, newPosition: { x: number; y: number }, size: { width: number; height: number }) => { x: number; y: number };
}

const FloatingPanelCoordinatorContext = createContext<FloatingPanelCoordinatorContextType | null>(null);

export function FloatingPanelCoordinatorProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<Map<string, PanelInfo>>(new Map());

  const registerPanel = (id: string, position: { x: number; y: number }, size: { width: number; height: number }) => {
    setPanels(prev => new Map(prev).set(id, { id, position, size }));
  };

  const unregisterPanel = (id: string) => {
    setPanels(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const updatePanelPosition = (id: string, position: { x: number; y: number }) => {
    setPanels(prev => {
      const panel = prev.get(id);
      if (!panel) return prev;
      const next = new Map(prev);
      next.set(id, { ...panel, position });
      return next;
    });
  };

  const getSnappedPosition = (
    id: string,
    newPosition: { x: number; y: number },
    size: { width: number; height: number }
  ): { x: number; y: number } => {
    let adjustedX = newPosition.x;
    let adjustedY = newPosition.y;
    const snapThreshold = 20; // Distance in pixels to trigger snapping

    // Check for snapping opportunities with other panels
    panels.forEach((otherPanel) => {
      if (otherPanel.id === id) return;

      const panel1 = {
        left: adjustedX,
        right: adjustedX + size.width,
        top: adjustedY,
        bottom: adjustedY + size.height
      };

      const panel2 = {
        left: otherPanel.position.x,
        right: otherPanel.position.x + otherPanel.size.width,
        top: otherPanel.position.y,
        bottom: otherPanel.position.y + otherPanel.size.height
      };

      // Snap to left edge (panel1 right edge near panel2 left edge)
      if (Math.abs(panel1.right - panel2.left) < snapThreshold) {
        adjustedX = panel2.left - size.width;
      }
      // Snap to right edge (panel1 left edge near panel2 right edge)
      else if (Math.abs(panel1.left - panel2.right) < snapThreshold) {
        adjustedX = panel2.right;
      }

      // Snap to top edge (panel1 bottom edge near panel2 top edge)
      if (Math.abs(panel1.bottom - panel2.top) < snapThreshold) {
        adjustedY = panel2.top - size.height;
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
        adjustedY = panel2.bottom - size.height;
      }

      // Align left edges
      if (Math.abs(panel1.left - panel2.left) < snapThreshold) {
        adjustedX = panel2.left;
      }
      // Align right edges
      else if (Math.abs(panel1.right - panel2.right) < snapThreshold) {
        adjustedX = panel2.right - size.width;
      }
    });

    // Keep within viewport bounds
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;
    adjustedX = Math.max(0, Math.min(adjustedX, maxX));
    adjustedY = Math.max(0, Math.min(adjustedY, maxY));

    return { x: adjustedX, y: adjustedY };
  };

  return (
    <FloatingPanelCoordinatorContext.Provider
      value={{ registerPanel, unregisterPanel, updatePanelPosition, getSnappedPosition }}
    >
      {children}
    </FloatingPanelCoordinatorContext.Provider>
  );
}

export function useFloatingPanelCoordinator() {
  const context = useContext(FloatingPanelCoordinatorContext);
  if (!context) {
    throw new Error('useFloatingPanelCoordinator must be used within a FloatingPanelCoordinatorProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider
export function useFloatingPanelCoordinatorOptional() {
  return useContext(FloatingPanelCoordinatorContext);
}
