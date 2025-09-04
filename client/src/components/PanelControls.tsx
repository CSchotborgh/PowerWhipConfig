import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Layers, 
  Package, 
  Settings, 
  FileText, 
  Shield, 
  Zap,
  Database,
  Eye,
  EyeOff,
  FileSpreadsheet,
  ShoppingCart
} from 'lucide-react';
import { usePanelManager } from './PanelManager';
import { FloatingComponentLibrary } from './FloatingComponentLibrary';
import { FloatingExcelTransformer } from './FloatingExcelTransformer';
import ConfigurationDetailsPanel from './ConfigurationDetailsPanel';
import SpecificationsAnalysisPanel from './SpecificationsAnalysisPanel';
import { FloatingOrderEntryPanel } from './FloatingOrderEntryPanel';
import { ExcelFileViewerEditor } from './excel/ExcelFileViewerEditor';

export function PanelControls() {
  const { panels, openPanel, closePanel } = usePanelManager();
  
  // Quick access panel definitions for drag-and-drop ordering
  const quickAccessPanels = [
    { id: 'component-library', index: 0, title: 'Component Library', icon: Package },
    { id: 'configuration-details', index: 1, title: 'Configuration Details', icon: Settings },
    { id: 'excel-transformer', index: 2, title: 'Excel Transformer', icon: FileSpreadsheet },
    { id: 'excel-file-viewer', index: 5, title: 'Excel File Viewer & Editor', icon: Database },
    { id: 'order-entry', index: 6, title: 'Order Entry', icon: ShoppingCart },
  ];

  // State for managing icon order
  const [iconOrder, setIconOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem('panelIconOrder');
    return savedOrder ? JSON.parse(savedOrder) : quickAccessPanels.map(p => p.id);
  });

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Save icon order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('panelIconOrder', JSON.stringify(iconOrder));
  }, [iconOrder]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, panelId: string) => {
    setDraggedItem(panelId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', panelId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPanelId: string) => {
    e.preventDefault();
    const draggedPanelId = e.dataTransfer.getData('text/plain');
    
    if (draggedPanelId !== targetPanelId) {
      const newOrder = [...iconOrder];
      const draggedIndex = newOrder.indexOf(draggedPanelId);
      const targetIndex = newOrder.indexOf(targetPanelId);
      
      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedPanelId);
      
      setIconOrder(newOrder);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const availablePanels = [
    {
      id: 'component-library',
      title: 'Component Library',
      icon: <Package className="h-4 w-4" />,
      component: <FloatingComponentLibrary />,
      position: { x: 50, y: 100 },
      size: { width: 450, height: 600 },
      minSize: { width: 300, height: 400 },
      maxSize: { width: 800, height: 900 },
      scalable: true
    },
    {
      id: 'configuration-details',
      title: 'Configuration Details',
      icon: <Settings className="h-4 w-4" />,
      component: <ConfigurationDetailsPanel />,
      position: { x: 500, y: 100 },
      size: { width: 500, height: 650 },
      minSize: { width: 350, height: 450 },
      maxSize: { width: 900, height: 1000 },
      scalable: true
    },
    {
      id: 'excel-transformer',
      title: 'Excel Transformer',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      component: <FloatingExcelTransformer />,
      position: { x: 550, y: 150 },
      size: { width: 400, height: 550 },
      minSize: { width: 350, height: 450 },
      maxSize: { width: 600, height: 800 },
      scalable: true
    },
    {
      id: 'specifications-analysis',
      title: 'Specifications & Analysis',
      icon: <Zap className="h-4 w-4" />,
      component: <SpecificationsAnalysisPanel />,
      position: { x: 700, y: 200 },
      size: { width: 480, height: 650 },
      minSize: { width: 350, height: 450 },
      maxSize: { width: 700, height: 900 },
      scalable: true
    },
    {
      id: 'validation-panel',
      title: 'Validation & Compliance',
      icon: <Shield className="h-4 w-4" />,
      component: (
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
      position: { x: 950, y: 100 },
      size: { width: 380, height: 450 },
      minSize: { width: 280, height: 350 },
      maxSize: { width: 600, height: 700 },
      scalable: true
    },
    {
      id: 'excel-file-viewer',
      title: 'Excel File Viewer & Editor',
      icon: <Database className="h-4 w-4" />,
      component: <ExcelFileViewerEditor />,
      position: { x: 600, y: 50 },
      size: { width: 900, height: 700 },
      minSize: { width: 600, height: 500 },
      maxSize: { width: 1200, height: 900 },
      scalable: true
    },
    {
      id: 'order-entry',
      title: 'High-Performance Order Entry',
      icon: <ShoppingCart className="h-4 w-4" />,
      component: <FloatingOrderEntryPanel />,
      position: { x: 800, y: 150 },
      size: { width: 600, height: 700 },
      minSize: { width: 400, height: 500 },
      maxSize: { width: 1000, height: 900 },
      scalable: true
    },
    {
      id: 'export-panel',
      title: 'Export & Documentation',
      icon: <FileText className="h-4 w-4" />,
      component: (
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
      position: { x: 750, y: 300 },
      size: { width: 350, height: 400 },
      minSize: { width: 250, height: 300 },
      maxSize: { width: 500, height: 600 },
      scalable: true
    }
  ];

  const handleOpenPanel = (panel: typeof availablePanels[0]) => {
    // Check if panel is already open
    const isOpen = panels.some(p => p.title === panel.title);
    if (!isOpen) {
      openPanel({
        title: panel.title,
        component: panel.component,
        position: panel.position,
        size: panel.size,
        minSize: panel.minSize,
        maxSize: panel.maxSize,
        scalable: panel.scalable
      });
    }
  };

  const handleClosePanel = (panelTitle: string) => {
    const panel = panels.find(p => p.title === panelTitle);
    if (panel) {
      closePanel(panel.id);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Panel Count Badge - more compact */}
      {panels.length > 0 && (
        <Badge variant="secondary" className="h-6 px-2 text-xs mr-1">
          {panels.length}
        </Badge>
      )}

      {/* Draggable Quick Access Icon Buttons */}
      <div className="flex items-center gap-1">
        {iconOrder.map((panelId, index) => {
          const panelDef = quickAccessPanels.find(p => p.id === panelId);
          const availablePanel = availablePanels[panelDef?.index || 0];
          const Icon = panelDef?.icon || Package;
          
          if (!panelDef || !availablePanel) return null;
          
          return (
            <div key={panelId} className="flex items-center">
              {/* Drop indicator before first item */}
              {index === 0 && draggedItem && draggedItem !== panelId && (
                <div className="w-0.5 h-6 bg-primary/50 rounded mx-1 transition-all duration-200" />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                draggable
                onClick={() => handleOpenPanel(availablePanel)}
                onDragStart={(e) => handleDragStart(e, panelId)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, panelId)}
                onDragEnd={handleDragEnd}
                title={`${panelDef.title} (drag to reorder)`}
                className={`h-8 w-8 p-0 transition-all duration-200 cursor-move ${
                  draggedItem === panelId 
                    ? 'opacity-50 scale-95 ring-2 ring-primary/30' 
                    : 'hover:scale-105 hover:bg-primary/10'
                } ${draggedItem && draggedItem !== panelId ? 'hover:ring-1 hover:ring-primary/50' : ''}`}
                data-testid={`panel-icon-${panelId}`}
              >
                <Icon className="h-4 w-4" />
              </Button>
              
              {/* Drop indicator after each item */}
              {draggedItem && draggedItem !== panelId && (
                <div className="w-0.5 h-6 bg-primary/50 rounded mx-1 transition-all duration-200" />
              )}
            </div>
          );
        })}
      </div>

      {/* All Panels Dropdown - Icon Only */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="All Panels" className="h-8 w-8 p-0">
            <Layers className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold">All Panels</div>
          
          {availablePanels.map(panel => {
            const isOpen = panels.some(p => p.title === panel.title);
            
            return (
              <DropdownMenuItem
                key={panel.id}
                onClick={() => isOpen ? handleClosePanel(panel.title) : handleOpenPanel(panel)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {panel.icon}
                  <span>{panel.title}</span>
                </div>
                {isOpen ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            );
          })}
          
          {panels.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => panels.forEach(panel => closePanel(panel.id))}
                className="text-red-600"
              >
                Close All Panels
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}