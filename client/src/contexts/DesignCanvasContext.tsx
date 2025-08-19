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

interface DesignCanvasContextType {
  droppedComponents: DroppedComponent[];
  setDroppedComponents: React.Dispatch<React.SetStateAction<DroppedComponent[]>>;
  addComponent: (component: DroppedComponent) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<DroppedComponent>) => void;
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

  const value: DesignCanvasContextType = {
    droppedComponents,
    setDroppedComponents,
    addComponent,
    removeComponent,
    updateComponent,
  };

  return (
    <DesignCanvasContext.Provider value={value}>
      {children}
    </DesignCanvasContext.Provider>
  );
};