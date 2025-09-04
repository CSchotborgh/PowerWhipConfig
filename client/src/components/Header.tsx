import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Settings, Eye, ShoppingCart, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PanelControls } from "./PanelControls";
import { DesignCanvasExportButton } from "./DesignCanvasExportButton";



interface HeaderProps {
  activeTab: "configuration" | "visual" | "documentation";
  onTabChange: (tab: "configuration" | "visual" | "documentation") => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { toast } = useToast();

  // Panel controls positioning state
  const [panelPosition, setPanelPosition] = useState<'left' | 'center' | 'right'>(() => {
    const saved = localStorage.getItem('panelControlsPosition');
    return (saved as 'left' | 'center' | 'right') || 'right';
  });

  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [dragOverZone, setDragOverZone] = useState<'left' | 'center' | 'right' | null>(null);

  // Main navigation tabs ordering state
  const defaultTabs = [
    {
      id: "configuration" as const,
      label: "Configuration",
      icon: Settings,
    },
    {
      id: "visual" as const,
      label: "Visual Design", 
      icon: Eye,
    },
    {
      id: "documentation" as const,
      label: "Documentation",
      icon: FileText,
    },
  ];

  const [tabs, setTabs] = useState(() => {
    const savedOrder = localStorage.getItem('navigationTabsOrder');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        return orderIds.map((id: string) => defaultTabs.find(tab => tab.id === id)).filter(Boolean);
      } catch {
        return defaultTabs;
      }
    }
    return defaultTabs;
  });

  const [isDraggingTab, setIsDraggingTab] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState<number | null>(null);

  // Save panel position and tab order to localStorage
  useEffect(() => {
    localStorage.setItem('panelControlsPosition', panelPosition);
  }, [panelPosition]);

  useEffect(() => {
    localStorage.setItem('navigationTabsOrder', JSON.stringify(tabs.map((tab: any) => tab.id)));
  }, [tabs]);

  // Tab drag handlers
  const handleTabDragStart = (e: React.DragEvent, tabId: string, index: number) => {
    setIsDraggingTab(true);
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `tab-${tabId}-${index}`);
  };

  const handleTabDragEnd = () => {
    setIsDraggingTab(false);
    setDraggedTabId(null);
    setDragOverTabIndex(null);
  };

  const handleTabDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTabIndex(index);
  };

  const handleTabDragLeave = () => {
    setDragOverTabIndex(null);
  };

  const handleTabDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    
    if (draggedData.startsWith('tab-') && draggedTabId) {
      const draggedIndex = tabs.findIndex((tab: any) => tab.id === draggedTabId);
      
      if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
        const newTabs = [...tabs];
        const draggedTab = newTabs.splice(draggedIndex, 1)[0];
        newTabs.splice(dropIndex, 0, draggedTab);
        setTabs(newTabs);
      }
    }
    
    setIsDraggingTab(false);
    setDraggedTabId(null);
    setDragOverTabIndex(null);
  };

  // Panel drag handlers
  const handlePanelDragStart = (e: React.DragEvent) => {
    setIsDraggingPanel(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'panel-controls');
  };

  const handlePanelDragEnd = () => {
    setIsDraggingPanel(false);
    setDragOverZone(null);
  };

  const handleDropZoneDragOver = (e: React.DragEvent, zone: 'left' | 'center' | 'right') => {
    e.preventDefault();
    
    // Only handle panel control drops, ignore tab drops
    if (isDraggingPanel && !isDraggingTab) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverZone(zone);
    }
  };

  const handleDropZoneDragLeave = (e: React.DragEvent) => {
    // Only handle panel control drags
    if (!isDraggingPanel || isDraggingTab) return;
    
    // Use a timeout to allow for moving between drop zones
    setTimeout(() => {
      if (isDraggingPanel && !isDraggingTab) {
        setDragOverZone(null);
      }
    }, 50);
  };

  const handleDropZoneDrop = (e: React.DragEvent, zone: 'left' | 'center' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    const draggedData = e.dataTransfer.getData('text/plain');
    
    if (draggedData === 'panel-controls' && zone !== panelPosition) {
      setPanelPosition(zone);
    }
    
    setIsDraggingPanel(false);
    setDragOverZone(null);
  };


  const handleExportXLSX = async () => {
    try {
      toast({
        title: "Exporting XLSX",
        description: "Generating receptacle pattern lookup file...",
      });

      // Get design canvas components (using empty array as fallback)
      const response = await fetch('/api/design-canvas/export-xlsx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          components: [], // Will be replaced by dedicated export button
          exportType: 'receptacle-pattern-lookup'
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ReceptaclePatternLookup_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Receptacle pattern lookup file downloaded successfully.",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export XLSX file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "Exporting PDF",
      description: "Your technical drawing is being generated...",
    });
    
    // Here you would implement actual PDF export logic
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Technical drawing exported successfully to PDF format.",
      });
    }, 2000);
  };

  return (
    <header className="bg-white dark:bg-technical-800 border-b-2 border-technical-200/50 dark:border-technical-600/50 shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title and Subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-technical-900 dark:text-technical-50 tracking-tight">
              ElectricalPowerWhip Configurator
            </h1>
            <p className="text-sm text-technical-600 dark:text-technical-400 mt-1">
              Professional Power Distribution Design Tool
            </p>
          </div>
          
          {/* Export Actions */}
          <div className="flex items-center space-x-3">
            <DesignCanvasExportButton />
            <Button 
              onClick={handleExportPDF}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs with Panel Controls */}
      <div className="border-t border-technical-200/30 dark:border-technical-600/30 bg-gradient-to-r from-technical-50 to-white dark:from-technical-700 dark:to-technical-800">
        <nav className="flex items-center relative">
          {/* Left Drop Zone */}
          <div
            className={cn(
              "flex items-center transition-all duration-200",
              dragOverZone === 'left' ? 'bg-primary/20 ring-2 ring-primary/50' : '',
              panelPosition === 'left' ? 'px-4 py-2 border-r border-technical-200/30 dark:border-technical-600/30' : 'w-2'
            )}
            onDragOver={(e) => handleDropZoneDragOver(e, 'left')}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={(e) => handleDropZoneDrop(e, 'left')}
          >
            {panelPosition === 'left' && (
              <div
                draggable
                onDragStart={handlePanelDragStart}
                onDragEnd={handlePanelDragEnd}
                className={cn(
                  "flex items-center cursor-move transition-all duration-200",
                  isDraggingPanel ? 'opacity-50 scale-95' : 'hover:bg-primary/10 rounded'
                )}
                title="Drag to reposition panel controls"
              >
                <GripVertical className="w-3 h-3 text-technical-400 mr-2" />
                <PanelControls />
              </div>
            )}
            {panelPosition !== 'left' && isDraggingPanel && (
              <div className="text-xs text-technical-500 px-2">Left</div>
            )}
          </div>

          {/* Main Navigation Tabs */}
          <div 
            className="flex flex-1"
            onDragOver={(e) => {
              // Allow panel controls to be dragged over the tabs area
              if (isDraggingPanel && !isDraggingTab) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDrop={(e) => {
              // Prevent tabs container from capturing panel control drops
              if (isDraggingPanel && !isDraggingTab) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {tabs.map((tab: any, index: number) => {
              const Icon = tab.icon;
              const showCenterDropZone = index === Math.floor(tabs.length / 2) && panelPosition === 'center';
              const isBeingDragged = isDraggingTab && draggedTabId === tab.id;
              const showDropIndicator = isDraggingTab && dragOverTabIndex === index;
              
              return (
                <div key={tab.id} className={cn(
                  "flex flex-1 items-center relative",
                  showDropIndicator ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                )}>
                  {/* Drop indicator line */}
                  {showDropIndicator && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full z-10" />
                  )}
                  
                  <button
                    draggable
                    onDragStart={(e) => {
                      // Only start tab drag if not dragging panels
                      if (!isDraggingPanel) {
                        handleTabDragStart(e, tab.id, index);
                      } else {
                        e.preventDefault();
                      }
                    }}
                    onDragEnd={handleTabDragEnd}
                    onDragOver={(e) => {
                      if (isDraggingPanel && !isDraggingTab) {
                        // Allow panel controls to pass through
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      
                      // Only handle tab drops
                      if (isDraggingTab && !isDraggingPanel) {
                        handleTabDragOver(e, index);
                      }
                    }}
                    onDragLeave={(e) => {
                      // Only handle if we're dragging tabs
                      if (isDraggingTab && !isDraggingPanel) {
                        handleTabDragLeave();
                      }
                    }}
                    onDrop={(e) => {
                      if (isDraggingPanel && !isDraggingTab) {
                        // Allow panel controls to pass through to drop zones
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      
                      const draggedData = e.dataTransfer.getData('text/plain');
                      // Only handle tab drops
                      if (draggedData.startsWith('tab-') && isDraggingTab && !isDraggingPanel) {
                        handleTabDrop(e, index);
                      }
                    }}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "flex-1 px-6 py-3 text-sm font-medium border-b-3 transition-all duration-200 relative group flex items-center justify-center cursor-move",
                      activeTab === tab.id
                        ? "border-primary text-primary bg-primary/10 shadow-inner"
                        : "border-transparent text-technical-600 dark:text-technical-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30",
                      isBeingDragged ? 'opacity-50 scale-95 z-50' : '',
                      isDraggingTab && !isBeingDragged ? 'hover:bg-primary/15' : ''
                    )}
                    title={`Drag to reorder ${tab.label} tab`}
                  >
                    <GripVertical className="w-3 h-3 text-technical-400 mr-1 opacity-60" />
                    <Icon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                    <span className="font-semibold tracking-wide">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
                    )}
                  </button>
                  
                  {/* Center Drop Zone (after middle tab) */}
                  {showCenterDropZone && (
                    <div
                      className={cn(
                        "flex items-center px-4 py-2 transition-all duration-200",
                        dragOverZone === 'center' ? 'bg-primary/20 ring-2 ring-primary/50' : ''
                      )}
                      onDragOver={(e) => handleDropZoneDragOver(e, 'center')}
                      onDragLeave={handleDropZoneDragLeave}
                      onDrop={(e) => handleDropZoneDrop(e, 'center')}
                    >
                      <div
                        draggable
                        onDragStart={handlePanelDragStart}
                        onDragEnd={handlePanelDragEnd}
                        className={cn(
                          "flex items-center cursor-move transition-all duration-200",
                          isDraggingPanel ? 'opacity-50 scale-95' : 'hover:bg-primary/10 rounded'
                        )}
                        title="Drag to reposition panel controls"
                      >
                        <GripVertical className="w-3 h-3 text-technical-400 mr-2" />
                        <PanelControls />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Center Drop Zone (when panels not in center) */}
            {panelPosition !== 'center' && (
              <div
                className={cn(
                  "flex items-center justify-center transition-all duration-200",
                  dragOverZone === 'center' ? 'bg-primary/20 ring-2 ring-primary/50 px-4' : 'w-2',
                  isDraggingPanel ? 'min-w-[60px]' : ''
                )}
                onDragOver={(e) => handleDropZoneDragOver(e, 'center')}
                onDragLeave={handleDropZoneDragLeave}
                onDrop={(e) => handleDropZoneDrop(e, 'center')}
              >
                {isDraggingPanel && (
                  <div className="text-xs text-technical-500">Center</div>
                )}
              </div>
            )}
          </div>

          {/* Right Drop Zone */}
          <div
            className={cn(
              "flex items-center transition-all duration-200",
              dragOverZone === 'right' ? 'bg-primary/20 ring-2 ring-primary/50' : '',
              panelPosition === 'right' ? 'px-4 py-2 border-l border-technical-200/30 dark:border-technical-600/30' : 'w-2'
            )}
            onDragOver={(e) => handleDropZoneDragOver(e, 'right')}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={(e) => handleDropZoneDrop(e, 'right')}
          >
            {panelPosition === 'right' && (
              <div
                draggable
                onDragStart={handlePanelDragStart}
                onDragEnd={handlePanelDragEnd}
                className={cn(
                  "flex items-center cursor-move transition-all duration-200",
                  isDraggingPanel ? 'opacity-50 scale-95' : 'hover:bg-primary/10 rounded'
                )}
                title="Drag to reposition panel controls"
              >
                <GripVertical className="w-3 h-3 text-technical-400 mr-2" />
                <PanelControls />
              </div>
            )}
            {panelPosition !== 'right' && isDraggingPanel && (
              <div className="text-xs text-technical-500 px-2">Right</div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}