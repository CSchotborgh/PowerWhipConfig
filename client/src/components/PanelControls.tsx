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
import { useDockLayout } from './DockLayoutProvider';

export function PanelControls() {
  const { openTab, closeTab, isTabOpen, dockRef, saveLayout, resetLayout } = useDockLayout();
  
  // Quick access panel definitions for drag-and-drop ordering
  const quickAccessPanels = [
    { id: 'component-library', title: 'Component Library', icon: Package },
    { id: 'configuration-details', title: 'Configuration Details', icon: Settings },
    { id: 'excel-transformer', title: 'Excel Transformer', icon: FileSpreadsheet },
    { id: 'excel-file-viewer', title: 'Excel File Viewer & Editor', icon: Database },
    { id: 'order-entry', title: 'Order Entry', icon: ShoppingCart },
  ];

  const allAvailablePanels = [
    ...quickAccessPanels,
    { id: 'specifications-analysis', title: 'Specifications & Analysis', icon: Zap },
    { id: 'validation-panel', title: 'Validation & Compliance', icon: Shield },
    { id: 'export-panel', title: 'Export & Documentation', icon: FileText },
  ];

  // State for managing icon order
  const [iconOrder, setIconOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem('panelIconOrder');
    return savedOrder ? JSON.parse(savedOrder) : quickAccessPanels.map(p => p.id);
  });

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  // Save icon order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('panelIconOrder', JSON.stringify(iconOrder));
  }, [iconOrder]);

  // Count currently open tabs
  const openTabCount = allAvailablePanels.reduce((count, panel) => {
    return count + (isTabOpen(panel.id) ? 1 : 0);
  }, 0);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, panelId: string) => {
    setDraggedItem(panelId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', panelId);
  };

  const handleDragEnter = (e: React.DragEvent, panelId: string) => {
    e.preventDefault();
    setDragOverItem(panelId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetPanelId: string) => {
    e.preventDefault();
    const draggedPanelId = e.dataTransfer.getData('text/plain');
    
    if (draggedPanelId && draggedPanelId !== targetPanelId) {
      const newOrder = [...iconOrder];
      const draggedIndex = newOrder.indexOf(draggedPanelId);
      const targetIndex = newOrder.indexOf(targetPanelId);
      
      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedPanelId);
      
      setIconOrder(newOrder);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };


  return (
    <div className="flex items-center gap-1">
      {/* Panel Count Badge - more compact */}
      {openTabCount > 0 && (
        <Badge variant="secondary" className="h-6 px-2 text-xs mr-1">
          {openTabCount}
        </Badge>
      )}

      {/* Draggable Quick Access Icon Buttons */}
      <div className="flex items-center gap-1">
        {iconOrder.map((panelId) => {
          const panelDef = quickAccessPanels.find(p => p.id === panelId);
          const Icon = panelDef?.icon || Package;
          
          if (!panelDef) return null;
          
          const isDragging = draggedItem === panelId;
          const isDragTarget = dragOverItem === panelId && draggedItem !== panelId;
          const isOpen = isTabOpen(panelId);
          
          return (
            <Button
              key={panelId}
              variant="ghost"
              size="sm"
              draggable
              onClick={() => isOpen ? closeTab(panelId) : openTab(panelId)}
              onDragStart={(e) => handleDragStart(e, panelId)}
              onDragEnter={(e) => handleDragEnter(e, panelId)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, panelId)}
              onDragEnd={handleDragEnd}
              title={`${panelDef.title} (drag to reorder)`}
              className={`h-8 w-8 p-0 transition-all duration-200 cursor-move ${
                isOpen 
                  ? 'bg-primary/20 text-primary'
                  : ''
              } ${
                isDragging 
                  ? 'opacity-30 scale-90 rotate-3 z-10' 
                  : isDragTarget
                  ? 'scale-110 bg-primary/20 ring-2 ring-primary/50 shadow-lg'
                  : 'hover:scale-105 hover:bg-primary/10'
              }`}
              style={{
                transform: isDragging ? 'rotate(5deg) scale(0.9)' : isDragTarget ? 'scale(1.1)' : ''
              }}
              data-testid={`panel-icon-${panelId}`}
            >
              <Icon className="h-4 w-4" />
            </Button>
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
          
          {allAvailablePanels.map(panel => {
            const isOpen = isTabOpen(panel.id);
            
            return (
              <DropdownMenuItem
                key={panel.id}
                onClick={() => isOpen ? closeTab(panel.id) : openTab(panel.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <panel.icon className="h-4 w-4" />
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
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={saveLayout}
            className="text-blue-600"
          >
            Save Current Layout
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={resetLayout}
            className="text-orange-600"
          >
            Reset to Default Layout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}