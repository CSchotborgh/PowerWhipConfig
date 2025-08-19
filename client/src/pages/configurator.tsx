import { useState } from "react";
import Header from "@/components/Header";
import DesignCanvas from "@/components/DesignCanvas";
import SpecificationPanel from "@/components/SpecificationPanel";
import ConfigurationTab from "@/components/ConfigurationTab";
import VisualDesignTab from "@/components/VisualDesignTab";
import OrderEntryTab from "@/components/OrderEntryTab";
import DocumentationTab from "@/components/DocumentationTab";
import ExpandedComponentLibrary from "@/components/ExpandedComponentLibrary";
import { DraggablePanel } from "@/components/DraggablePanel";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { DesignCanvasProvider } from "@/contexts/DesignCanvasContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Configurator() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation" | "order">("configuration");
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // Default width in pixels
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case "configuration":
        return <ConfigurationTab />;
      case "visual":
        return <VisualDesignTab />;
      case "order":
        return <OrderEntryTab />;
      case "documentation":
        return <DocumentationTab />;
      default:
        return <ConfigurationTab />;
    }
  };

  const handleLeftPanelDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLeft(true);
    
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    
    // Add global cursor style
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(window.innerWidth * 0.8, startWidth + deltaX));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRightPanelDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingRight(true);
    
    const startX = e.clientX;
    const startWidth = rightPanelWidth;
    
    // Add global cursor style
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = startX - e.clientX;
      const newWidth = Math.max(200, Math.min(window.innerWidth * 0.8, startWidth + deltaX));
      setRightPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <ConfigurationProvider>
      <DesignCanvasProvider>
        <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50">
          {/* Header Navbar with Navigation */}
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main Body Container - Enhanced Mobile Layout */}
        <div className="flex flex-1 overflow-hidden bg-gradient-to-br from-technical-50 to-technical-100 dark:from-technical-900 dark:to-technical-800 relative">
          
          {/* Mobile Scroll Hint */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
            <div className="bg-technical-700/90 text-white text-xs px-3 py-1 rounded-full animate-bounce">
              ↕ Scroll panels to see more
            </div>
          </div>
          
          {/* Left Panel - Tab Content */}
          <div className="relative flex">
            <aside 
              className={`bg-white dark:bg-technical-800 border-r-2 border-technical-200/50 dark:border-technical-600/50 flex flex-col transition-all duration-300 ease-in-out shadow-lg max-h-screen ${
                leftPanelExpanded ? "" : "w-12"
              } ${isDraggingLeft ? 'select-none' : ''}`}
              style={{
                width: leftPanelExpanded ? `${leftPanelWidth}px` : '48px'
              }}
            >
              {leftPanelExpanded && (
                <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-technical-50/30 dark:from-technical-800 dark:to-technical-700/30 h-full">
                  <div className="h-full border-r border-technical-100 dark:border-technical-600/30 flex flex-col">
                    {/* Panel Header with Width Display */}
                    <div className="flex items-center justify-between p-3 border-b border-technical-200/50 dark:border-technical-600/50">
                      <h2 className="text-sm font-semibold text-technical-700 dark:text-technical-300">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                      </h2>
                      <div className="text-xs text-muted-foreground">
                        {leftPanelWidth}px wide
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {renderTabContent()}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Collapsed State */}
              {!leftPanelExpanded && (
                <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-4 bg-gradient-to-b from-technical-50/50 to-white dark:from-technical-700/50 dark:to-technical-800">
                  <div className="text-technical-400 dark:text-technical-500 text-xs text-center p-3 rounded-xl bg-white dark:bg-technical-700 shadow-md">
                    <div className="text-[10px] leading-tight font-medium">
                      Panel Collapsed
                    </div>
                  </div>
                </div>
              )}
            </aside>
            
            {/* Left Panel Resize Handle */}
            {leftPanelExpanded && (
              <div
                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-primary/50 hover:bg-primary/70 transition-all duration-200 z-20 border-r-2 border-primary/60 shadow-sm hover:shadow-md"
                onMouseDown={handleLeftPanelDrag}
                title="Drag to resize configuration panel horizontally"
                style={{ right: '-4px' }}
              />
            )}
            
            {/* Left Panel Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelExpanded(!leftPanelExpanded)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-6 rounded-r-xl border border-l-0 border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 hover:bg-technical-50 dark:hover:bg-technical-700 shadow-lg hover:shadow-xl transition-all"
              title={leftPanelExpanded ? "Collapse panel" : "Expand panel"}
            >
              {leftPanelExpanded ? (
                <ChevronLeft className="h-4 w-4 text-technical-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-technical-500" />
              )}
            </Button>
          </div>
          
          {/* Main Content Area */}
          <main className="flex-1 flex bg-white dark:bg-technical-800 rounded-tl-xl shadow-inner">
            {/* Design Canvas Area - Fully Responsive */}
            <div className="w-full p-6 bg-gradient-to-br from-white to-technical-50/30 dark:from-technical-800 dark:to-technical-700/30">
              <div className="h-full w-full rounded-xl border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 shadow-sm overflow-hidden">
                <DesignCanvas />
              </div>
            </div>
          </main>
        </div>
        </div>
      </DesignCanvasProvider>
    </ConfigurationProvider>
  );
}