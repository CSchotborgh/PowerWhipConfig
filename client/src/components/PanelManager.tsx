import { useState, createContext, useContext, ReactNode } from 'react';
import { DraggablePanel } from './DraggablePanel';

interface Panel {
  id: string;
  title: string;
  component: ReactNode;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

interface PanelManagerContextType {
  panels: Panel[];
  openPanel: (panel: Omit<Panel, 'id'>) => string;
  closePanel: (id: string) => void;
  updatePanel: (id: string, updates: Partial<Panel>) => void;
}

const PanelManagerContext = createContext<PanelManagerContextType | null>(null);

export function PanelManagerProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<Panel[]>([]);

  const openPanel = (panel: Omit<Panel, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newPanel: Panel = {
      ...panel,
      id,
      position: panel.position || { 
        x: 100 + panels.length * 30, 
        y: 100 + panels.length * 30 
      }
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

  return (
    <PanelManagerContext.Provider value={{ panels, openPanel, closePanel, updatePanel }}>
      {children}
      
      {/* Render all open panels */}
      {panels.map(panel => (
        <DraggablePanel
          key={panel.id}
          title={panel.title}
          defaultPosition={panel.position}
          defaultSize={panel.size}
          onClose={() => closePanel(panel.id)}
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