import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DroppedComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  specifications?: Record<string, any>;
  partNumber?: string;
}

interface DockedPanel {
  id: string;
  title: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  size: number; // width for left/right, height for top/bottom
}

interface DockHint {
  position: 'top' | 'bottom' | 'left' | 'right';
  active: boolean;
}

interface DesignCanvasContextType {
  droppedComponents: DroppedComponent[];
  setDroppedComponents: React.Dispatch<React.SetStateAction<DroppedComponent[]>>;
  addComponent: (component: DroppedComponent) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<DroppedComponent>) => void;
  
  // Docking system
  dockedPanels: DockedPanel[];
  dockPanel: (panel: DockedPanel) => void;
  undockPanel: (panelId: string) => void;
  dockHints: DockHint[];
  setDockHints: React.Dispatch<React.SetStateAction<DockHint[]>>;
  activeDockZone: 'top' | 'bottom' | 'left' | 'right' | null;
  setActiveDockZone: React.Dispatch<React.SetStateAction<'top' | 'bottom' | 'left' | 'right' | null>>;
  isDraggingPanel: boolean;
  setIsDraggingPanel: React.Dispatch<React.SetStateAction<boolean>>;
  lastUndockedPanelId: string | null;
  setLastUndockedPanelId: React.Dispatch<React.SetStateAction<string | null>>;
}

const DesignCanvasContext = createContext<DesignCanvasContextType | undefined>(undefined);

export const useDesignCanvas = () => {
  const context = useContext(DesignCanvasContext);
  if (context === undefined) {
    throw new Error('useDesignCanvas must be used within a DesignCanvasProvider');
  }
  return context;
};

export const DesignCanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [droppedComponents, setDroppedComponents] = useState<DroppedComponent[]>([]);
  const [dockedPanels, setDockedPanels] = useState<DockedPanel[]>([
    { id: 'all-features-panel', title: 'All Features', position: 'top', size: 160 },
    { id: 'component-library-panel', title: 'Component Library - MasterBubbleUpLookup', position: 'left', size: 450 },
  ]);
  const [dockHints, setDockHints] = useState<DockHint[]>([
    { position: 'top', active: false },
    { position: 'bottom', active: false },
    { position: 'left', active: false },
    { position: 'right', active: false },
  ]);
  const [activeDockZone, setActiveDockZone] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [lastUndockedPanelId, setLastUndockedPanelId] = useState<string | null>(null);

  const addComponent = (component: DroppedComponent) => {
    setDroppedComponents(prev => [...prev, component]);
  };

  const removeComponent = (id: string) => {
    setDroppedComponents(prev => prev.filter(comp => comp.id !== id));
  };

  const updateComponent = (id: string, updates: Partial<DroppedComponent>) => {
    setDroppedComponents(prev => 
      prev.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      )
    );
  };

  const dockPanel = (panel: DockedPanel) => {
    // Remove panel if it was already docked elsewhere
    setDockedPanels(prev => {
      const filtered = prev.filter(p => p.id !== panel.id);
      return [...filtered, panel];
    });
  };

  const undockPanel = (panelId: string) => {
    setDockedPanels(prev => prev.filter(p => p.id !== panelId));
    setLastUndockedPanelId(panelId);
    // Reset after a short delay to allow panels to react
    setTimeout(() => setLastUndockedPanelId(null), 100);
  };

  const value: DesignCanvasContextType = {
    droppedComponents,
    setDroppedComponents,
    addComponent,
    removeComponent,
    updateComponent,
    
    dockedPanels,
    dockPanel,
    undockPanel,
    dockHints,
    setDockHints,
    activeDockZone,
    setActiveDockZone,
    isDraggingPanel,
    setIsDraggingPanel,
    lastUndockedPanelId,
    setLastUndockedPanelId,
  };

  return (
    <DesignCanvasContext.Provider value={value}>
      {children}
    </DesignCanvasContext.Provider>
  );
};