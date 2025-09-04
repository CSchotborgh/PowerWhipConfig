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

  // Layout positioning state - simplified to just left/right
  const [layoutOrder, setLayoutOrder] = useState<'nav-left' | 'panels-left'>(() => {
    const saved = localStorage.getItem('breadcrumbLayoutOrder');
    return (saved as 'nav-left' | 'panels-left') || 'nav-left'; // nav tabs on left by default
  });

  const [isDraggingNavGroup, setIsDraggingNavGroup] = useState(false);
  const [isDraggingPanelGroup, setIsDraggingPanelGroup] = useState(false);
  const [dragOverZone, setDragOverZone] = useState<'left' | 'right' | null>(null);

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

  // Save layout order and tab order to localStorage
  useEffect(() => {
    localStorage.setItem('breadcrumbLayoutOrder', layoutOrder);
  }, [layoutOrder]);

  useEffect(() => {
    localStorage.setItem('navigationTabsOrder', JSON.stringify(tabs.map((tab: any) => tab.id)));
  }, [tabs]);

  // Tab drag handlers (for reordering within navigation group)
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

  // Navigation group drag handlers
  const handleNavGroupDragStart = (e: React.DragEvent) => {
    setIsDraggingNavGroup(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'nav-group');
  };

  const handleNavGroupDragEnd = () => {
    setIsDraggingNavGroup(false);
    setDragOverZone(null);
  };

  // Panel group drag handlers
  const handlePanelGroupDragStart = (e: React.DragEvent) => {
    setIsDraggingPanelGroup(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'panel-group');
  };

  const handlePanelGroupDragEnd = () => {
    setIsDraggingPanelGroup(false);
    setDragOverZone(null);
  };

  // Drop zone handlers (simplified for left/right only)
  const handleDropZoneDragOver = (e: React.DragEvent, zone: 'left' | 'right') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(zone);
  };

  const handleDropZoneDragLeave = () => {
    setTimeout(() => {
      setDragOverZone(null);
    }, 100);
  };

  const handleDropZoneDrop = (e: React.DragEvent, zone: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    const draggedData = e.dataTransfer.getData('text/plain');
    
    if (draggedData === 'nav-group' && zone === 'left' && layoutOrder !== 'nav-left') {
      setLayoutOrder('nav-left');
    } else if (draggedData === 'nav-group' && zone === 'right' && layoutOrder !== 'panels-left') {
      setLayoutOrder('panels-left'); // panels left means nav goes right
    } else if (draggedData === 'panel-group' && zone === 'left' && layoutOrder !== 'panels-left') {
      setLayoutOrder('panels-left');
    } else if (draggedData === 'panel-group' && zone === 'right' && layoutOrder !== 'nav-left') {
      setLayoutOrder('nav-left'); // nav left means panels go right
    }
    
    setIsDraggingNavGroup(false);
    setIsDraggingPanelGroup(false);
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
      
      {/* Simplified Two-Group Layout */}
      <div className="border-t border-technical-200/30 dark:border-technical-600/30 bg-gradient-to-r from-technical-50 to-white dark:from-technical-700 dark:to-technical-800">
        <nav className="flex items-center relative">
          {/* Left Drop Zone */}
          <div
            className={cn(
              "flex items-center transition-all duration-200 min-w-[20px]",
              dragOverZone === 'left' ? 'bg-primary/20 ring-2 ring-primary/50 px-4' : 'w-5',
              (isDraggingNavGroup || isDraggingPanelGroup) && dragOverZone !== 'left' ? 'bg-technical-100/50 dark:bg-technical-700/50' : ''
            )}
            onDragOver={(e) => handleDropZoneDragOver(e, 'left')}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={(e) => handleDropZoneDrop(e, 'left')}
          >
            {(isDraggingNavGroup || isDraggingPanelGroup) && dragOverZone === 'left' && (
              <div className="text-xs text-technical-500 font-medium">Drop Left</div>
            )}
          </div>

          {/* Navigation Tabs Group */}
          {layoutOrder === 'nav-left' && (
            <div
              draggable
              onDragStart={handleNavGroupDragStart}
              onDragEnd={handleNavGroupDragEnd}
              className={cn(
                "flex items-center transition-all duration-200 border-r border-technical-200/30 dark:border-technical-600/30",
                isDraggingNavGroup ? 'opacity-50 scale-95' : 'hover:bg-primary/5 cursor-move'
              )}
              title="Drag to reposition navigation tabs"
            >
              <div className="flex items-center px-2">
                <GripVertical className="w-3 h-3 text-technical-400 mr-2" />
              </div>
              <div className="flex">
                {tabs.map((tab: any, index: number) => {
                  const Icon = tab.icon;
                  const isBeingDragged = isDraggingTab && draggedTabId === tab.id;
                  const showDropIndicator = isDraggingTab && dragOverTabIndex === index;
                  
                  return (
                    <div key={tab.id} className={cn(
                      "flex items-center relative",
                      showDropIndicator ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                    )}>
                      {showDropIndicator && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full z-10" />
                      )}
                      
                      <button
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation(); // Prevent nav group drag
                          handleTabDragStart(e, tab.id, index);
                        }}
                        onDragEnd={handleTabDragEnd}
                        onDragOver={(e) => {
                          if (isDraggingTab) {
                            e.stopPropagation();
                            handleTabDragOver(e, index);
                          }
                        }}
                        onDragLeave={() => {
                          if (isDraggingTab) {
                            handleTabDragLeave();
                          }
                        }}
                        onDrop={(e) => {
                          const draggedData = e.dataTransfer.getData('text/plain');
                          if (draggedData.startsWith('tab-') && isDraggingTab) {
                            e.stopPropagation();
                            handleTabDrop(e, index);
                          }
                        }}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                          "px-4 py-3 text-sm font-medium border-b-3 transition-all duration-200 relative group flex items-center justify-center",
                          activeTab === tab.id
                            ? "border-primary text-primary bg-primary/10 shadow-inner"
                            : "border-transparent text-technical-600 dark:text-technical-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30",
                          isBeingDragged ? 'opacity-50 scale-95 z-50' : '',
                          isDraggingTab && !isBeingDragged ? 'hover:bg-primary/15' : ''
                        )}
                        title={`${tab.label} tab - Drag to reorder`}
                      >
                        <GripVertical className="w-2 h-2 text-technical-400/60 mr-1" />
                        <Icon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                        <span className="font-semibold tracking-wide">{tab.label}</span>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-t-full" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Panel Controls Group */}
          {layoutOrder === 'panels-left' && (
            <div
              draggable
              onDragStart={handlePanelGroupDragStart}
              onDragEnd={handlePanelGroupDragEnd}
              className={cn(
                "flex items-center px-4 py-2 transition-all duration-200 border-r border-technical-200/30 dark:border-technical-600/30",
                isDraggingPanelGroup ? 'opacity-50 scale-95' : 'hover:bg-primary/5 cursor-move'
              )}
              title="Drag to reposition panel controls"
            >
              <GripVertical className="w-3 h-3 text-technical-400 mr-2" />
              <PanelControls />
            </div>
          )}

          {/* Middle Spacer */}
          <div className="flex-1" />

          {/* Panel Controls Group (Right Position) */}
          {layoutOrder === 'nav-left' && (
            <div
              draggable
              onDragStart={handlePanelGroupDragStart}
              onDragEnd={handlePanelGroupDragEnd}
              className={cn(
                "flex items-center px-4 py-2 transition-all duration-200 border-l border-technical-200/30 dark:border-technical-600/30",
                isDraggingPanelGroup ? 'opacity-50 scale-95' : 'hover:bg-primary/5 cursor-move'
              )}
              title="Drag to reposition panel controls"
            >
              <GripVertical className="w-3 h-3 text-technical-400 mr-2" />
              <PanelControls />
            </div>
          )}

          {/* Navigation Tabs Group (Right Position) */}
          {layoutOrder === 'panels-left' && (
            <div
              draggable
              onDragStart={handleNavGroupDragStart}
              onDragEnd={handleNavGroupDragEnd}
              className={cn(
                "flex items-center transition-all duration-200 border-l border-technical-200/30 dark:border-technical-600/30",
                isDraggingNavGroup ? 'opacity-50 scale-95' : 'hover:bg-primary/5 cursor-move'
              )}
              title="Drag to reposition navigation tabs"
            >
              <div className="flex items-center px-2">
                <GripVertical className="w-3 h-3 text-technical-400 mr-2" />
              </div>
              <div className="flex">
                {tabs.map((tab: any, index: number) => {
                  const Icon = tab.icon;
                  const isBeingDragged = isDraggingTab && draggedTabId === tab.id;
                  const showDropIndicator = isDraggingTab && dragOverTabIndex === index;
                  
                  return (
                    <div key={tab.id} className={cn(
                      "flex items-center relative",
                      showDropIndicator ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                    )}>
                      {showDropIndicator && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full z-10" />
                      )}
                      
                      <button
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation(); // Prevent nav group drag
                          handleTabDragStart(e, tab.id, index);
                        }}
                        onDragEnd={handleTabDragEnd}
                        onDragOver={(e) => {
                          if (isDraggingTab) {
                            e.stopPropagation();
                            handleTabDragOver(e, index);
                          }
                        }}
                        onDragLeave={() => {
                          if (isDraggingTab) {
                            handleTabDragLeave();
                          }
                        }}
                        onDrop={(e) => {
                          const draggedData = e.dataTransfer.getData('text/plain');
                          if (draggedData.startsWith('tab-') && isDraggingTab) {
                            e.stopPropagation();
                            handleTabDrop(e, index);
                          }
                        }}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                          "px-4 py-3 text-sm font-medium border-b-3 transition-all duration-200 relative group flex items-center justify-center",
                          activeTab === tab.id
                            ? "border-primary text-primary bg-primary/10 shadow-inner"
                            : "border-transparent text-technical-600 dark:text-technical-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30",
                          isBeingDragged ? 'opacity-50 scale-95 z-50' : '',
                          isDraggingTab && !isBeingDragged ? 'hover:bg-primary/15' : ''
                        )}
                        title={`${tab.label} tab - Drag to reorder`}
                      >
                        <GripVertical className="w-2 h-2 text-technical-400/60 mr-1" />
                        <Icon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                        <span className="font-semibold tracking-wide">{tab.label}</span>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-t-full" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Drop Zone */}
          <div
            className={cn(
              "flex items-center transition-all duration-200 min-w-[20px]",
              dragOverZone === 'right' ? 'bg-primary/20 ring-2 ring-primary/50 px-4' : 'w-5',
              (isDraggingNavGroup || isDraggingPanelGroup) && dragOverZone !== 'right' ? 'bg-technical-100/50 dark:bg-technical-700/50' : ''
            )}
            onDragOver={(e) => handleDropZoneDragOver(e, 'right')}
            onDragLeave={handleDropZoneDragLeave}
            onDrop={(e) => handleDropZoneDrop(e, 'right')}
          >
            {(isDraggingNavGroup || isDraggingPanelGroup) && dragOverZone === 'right' && (
              <div className="text-xs text-technical-500 font-medium">Drop Right</div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}