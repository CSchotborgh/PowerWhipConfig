import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import DockLayout from 'rc-dock';
import 'rc-dock/dist/rc-dock.css';
import type { LayoutData, TabData, PanelData, BoxData } from 'rc-dock/lib';
import { FloatingComponentLibrary } from './FloatingComponentLibrary';
import { FloatingExcelTransformer } from './FloatingExcelTransformer';
import ConfigurationDetailsPanel from './ConfigurationDetailsPanel';
import SpecificationsAnalysisPanel from './SpecificationsAnalysisPanel';
import { FloatingOrderEntryPanel } from './FloatingOrderEntryPanel';
import { ExcelFileViewerEditor } from './excel/ExcelFileViewerEditor';
import { Package, Settings, FileSpreadsheet, Zap, Database, ShoppingCart, Shield, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DockLayoutContextType {
  dockRef: React.RefObject<DockLayout>;
  openTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  isTabOpen: (tabId: string) => boolean;
  saveLayout: () => void;
  loadLayout: (savedLayout: any) => void;
  resetLayout: () => void;
}

const DockLayoutContext = createContext<DockLayoutContextType | null>(null);

export const useDockLayout = () => {
  const context = useContext(DockLayoutContext);
  if (!context) {
    throw new Error('useDockLayout must be used within a DockLayoutProvider');
  }
  return context;
};

// Tab definitions for all available panels
const availableTabs: Record<string, TabData> = {
  'component-library': {
    id: 'component-library',
    title: (
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span>Component Library</span>
      </div>
    ),
    content: <FloatingComponentLibrary />,
    closable: true,
    group: 'tools'
  },
  'configuration-details': {
    id: 'configuration-details',
    title: (
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <span>Configuration Details</span>
      </div>
    ),
    content: <ConfigurationDetailsPanel />,
    closable: true,
    group: 'tools'
  },
  'excel-transformer': {
    id: 'excel-transformer',
    title: (
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        <span>Excel Transformer</span>
      </div>
    ),
    content: <FloatingExcelTransformer />,
    closable: true,
    group: 'tools'
  },
  'specifications-analysis': {
    id: 'specifications-analysis',
    title: (
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <span>Specifications & Analysis</span>
      </div>
    ),
    content: <SpecificationsAnalysisPanel />,
    closable: true,
    group: 'analysis'
  },
  'validation-panel': {
    id: 'validation-panel',
    title: (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span>Validation & Compliance</span>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">NEC Compliance Check</h3>
          <p className="text-sm text-muted-foreground">
            Real-time validation against National Electrical Code standards
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
            <span className="text-sm">Wire Gauge Compatibility</span>
            <Badge className="bg-green-100 text-green-800">✓ Valid</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
            <span className="text-sm">Voltage Rating</span>
            <Badge className="bg-green-100 text-green-800">✓ Valid</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded">
            <span className="text-sm">Current Load</span>
            <Badge className="bg-yellow-100 text-yellow-800">⚠ Warning</Badge>
          </div>
        </div>
      </div>
    ),
    closable: true,
    group: 'analysis'
  },
  'excel-file-viewer': {
    id: 'excel-file-viewer',
    title: (
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        <span>Excel File Viewer & Editor</span>
      </div>
    ),
    content: <ExcelFileViewerEditor />,
    closable: true,
    group: 'files'
  },
  'order-entry': {
    id: 'order-entry',
    title: (
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4" />
        <span>High-Performance Order Entry</span>
      </div>
    ),
    content: <FloatingOrderEntryPanel />,
    closable: true,
    group: 'tools'
  },
  'export-panel': {
    id: 'export-panel',
    title: (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span>Export & Documentation</span>
      </div>
    ),
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Export Options</h3>
          <p className="text-sm text-muted-foreground">
            Generate documentation and export configurations
          </p>
        </div>
        <div className="space-y-2">
          <Button className="w-full" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button className="w-full" variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Export BOM
          </Button>
          <Button className="w-full" variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Generate Schematic
          </Button>
        </div>
      </div>
    ),
    closable: true,
    group: 'export'
  }
};

// Default layout for the dock system
const defaultLayout: LayoutData = {
  dockbox: {
    mode: 'horizontal',
    children: [
      {
        mode: 'vertical',
        size: 300,
        children: [
          {
            tabs: [availableTabs['component-library']],
          }
        ]
      },
      {
        mode: 'vertical',
        size: 400,
        children: [
          {
            tabs: [availableTabs['configuration-details']],
          }
        ]
      }
    ]
  },
  floatbox: {
    mode: 'float',
    children: []
  }
};

interface DockLayoutProviderProps {
  children: React.ReactNode;
}

export function DockLayoutProvider({ children }: DockLayoutProviderProps) {
  const dockRef = useRef<DockLayout>(null);
  const [currentLayout, setCurrentLayout] = useState<LayoutData>(defaultLayout);

  // Load saved layout on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('configurator-dock-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setCurrentLayout(parsed);
      } catch (error) {
        console.warn('Failed to load saved dock layout:', error);
      }
    }
  }, []);

  const openTab = (tabId: string) => {
    const tab = availableTabs[tabId];
    if (!tab) return;

    const dock = dockRef.current;
    if (!dock) return;

    // Check if tab is already open
    const existingTab = dock.find(tabId);
    if (existingTab) {
      // Tab exists, just activate it
      return;
    }

    // Add tab to the first available panel or create a new one
    const firstPanel = dock.find((item) => item && 'tabs' in item) as PanelData | undefined;
    if (firstPanel) {
      dock.dockMove(tab, firstPanel, 'middle');
    } else {
      // Create a new panel in the main dock area
      const dockbox = dock.find('dockbox');
      if (dockbox) {
        dock.dockMove(tab, dockbox, 'right');
      }
    }
  };

  const closeTab = (tabId: string) => {
    const dock = dockRef.current;
    if (!dock) return;

    const tab = dock.find(tabId) as TabData | undefined;
    if (tab && 'id' in tab) {
      dock.dockMove(tab, null, 'remove');
    }
  };

  const isTabOpen = (tabId: string): boolean => {
    const dock = dockRef.current;
    if (!dock) return false;
    
    const tab = dock.find(tabId);
    return !!tab;
  };

  const saveLayout = () => {
    const dock = dockRef.current;
    if (!dock) return;

    const layout = dock.saveLayout();
    localStorage.setItem('configurator-dock-layout', JSON.stringify(layout));
  };

  const loadLayout = (savedLayout: any) => {
    const dock = dockRef.current;
    if (!dock) return;

    dock.loadLayout(savedLayout);
  };

  const resetLayout = () => {
    const dock = dockRef.current;
    if (!dock) return;

    dock.loadLayout(defaultLayout);
    localStorage.removeItem('configurator-dock-layout');
  };

  const contextValue: DockLayoutContextType = {
    dockRef,
    openTab,
    closeTab,
    isTabOpen,
    saveLayout,
    loadLayout,
    resetLayout
  };

  return (
    <DockLayoutContext.Provider value={contextValue}>
      <div className="dock-layout-container w-full h-full">
        <DockLayout
          ref={dockRef}
          defaultLayout={currentLayout}
          onLayoutChange={(newLayout) => {
            setCurrentLayout(newLayout as LayoutData);
            // Auto-save layout changes
            localStorage.setItem('configurator-dock-layout', JSON.stringify(newLayout));
          }}
          style={{ 
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </div>
      {children}
    </DockLayoutContext.Provider>
  );
}