import { useState } from "react";
import Header from "@/components/Header";
import DesignCanvas from "@/components/DesignCanvas";
import { PanelControlsFloating, PanelControlsContent } from "@/components/PanelControlsFloating";
import { ContentPanel, ContentPanelContent } from "@/components/ContentPanel";
import { ExpandedComponentLibrary } from "@/components/ExpandedComponentLibrary";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { DesignCanvasProvider, useDesignCanvas } from "@/contexts/DesignCanvasContext";
import { DockZones } from "@/components/DockZones";
import { PanelManagerProvider } from "@/components/PanelManager";
import { FloatingPanelCoordinatorProvider } from "@/contexts/FloatingPanelCoordinator";

function ConfiguratorContent() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation">("configuration");
  const { setActiveDockZone, dockedPanels, undockPanel, isDraggingPanel } = useDesignCanvas();

  const handleDockZoneHover = (zone: 'top' | 'bottom' | 'left' | 'right' | null) => {
    setActiveDockZone(zone);
  };

  // Helper function to render panel content based on panel ID (without DraggablePanel wrapper)
  const renderPanelContent = (panelId: string) => {
    switch (panelId) {
      case 'all-features-panel':
        return (
          <PanelControlsContent 
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as "configuration" | "visual" | "documentation")}
          />
        );
      case 'content-panel':
        return <ContentPanelContent activeTab={activeTab} />;
      case 'component-library-panel':
        return <ExpandedComponentLibrary />;
      default:
        return null;
    }
  };

  // Calculate docked panel sizes
  const topPanel = dockedPanels.find(p => p.position === 'top');
  const bottomPanel = dockedPanels.find(p => p.position === 'bottom');
  const leftPanel = dockedPanels.find(p => p.position === 'left');
  const rightPanel = dockedPanels.find(p => p.position === 'right');

  return (
    <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50">
      {/* Header */}
      <Header />
      
      {/* Dock Zones - Show when dragging */}
      <DockZones isDragging={isDraggingPanel} onDockZoneHover={handleDockZoneHover} />
      
      {/* Floating Panels */}
      <PanelControlsFloating 
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as "configuration" | "visual" | "documentation")} 
      />
      <ContentPanel activeTab={activeTab} />
    
      {/* Main Layout Container with Docked Panels */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-technical-50 to-technical-100 dark:from-technical-900 dark:to-technical-800 flex flex-col">
        {/* Top Docked Panel */}
        {topPanel && (
          <div 
            className="border-b border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-[5] flex flex-col"
            style={{ height: topPanel.size, minHeight: topPanel.size }}
            data-testid="docked-panel-top"
          >
            <div className="p-3 flex items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
              <h3 className="font-semibold text-sm">{topPanel.title}</h3>
              <button
                onClick={() => undockPanel(topPanel.id)}
                className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                data-testid="undock-button-top"
              >
                Undock
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto w-full">{renderPanelContent(topPanel.id)}</div>
          </div>
        )}

        {/* Middle Row: Left Panel | Canvas | Right Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Docked Panel */}
          {leftPanel && (
            <div 
              className="border-r border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10 flex flex-col"
              style={{ width: leftPanel.size, minWidth: leftPanel.size }}
              data-testid="docked-panel-left"
            >
              <div className="p-3 flex flex-col items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
                <h3 className="font-semibold text-sm text-center">{leftPanel.title}</h3>
                <button
                  onClick={() => undockPanel(leftPanel.id)}
                  className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                  data-testid="undock-button-left"
                >
                  Undock
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto h-full">{renderPanelContent(leftPanel.id)}</div>
            </div>
          )}

          {/* Design Canvas - Resizes based on docked panels */}
          <div className="flex-1 p-6 relative z-0">
            <div className="h-full w-full rounded-xl border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 shadow-lg overflow-hidden">
              <DesignCanvas />
            </div>
          </div>

          {/* Right Docked Panel */}
          {rightPanel && (
            <div 
              className="border-l border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10 flex flex-col"
              style={{ width: rightPanel.size, minWidth: rightPanel.size }}
              data-testid="docked-panel-right"
            >
              <div className="p-3 flex flex-col items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
                <h3 className="font-semibold text-sm text-center">{rightPanel.title}</h3>
                <button
                  onClick={() => undockPanel(rightPanel.id)}
                  className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                  data-testid="undock-button-right"
                >
                  Undock
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto h-full">{renderPanelContent(rightPanel.id)}</div>
            </div>
          )}
        </div>

        {/* Bottom Docked Panel */}
        {bottomPanel && (
          <div 
            className="border-t border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-[5] flex flex-col"
            style={{ height: bottomPanel.size, minHeight: bottomPanel.size }}
            data-testid="docked-panel-bottom"
          >
            <div className="p-3 flex items-center gap-2 border-b border-technical-200 dark:border-technical-600 shrink-0">
              <h3 className="font-semibold text-sm">{bottomPanel.title}</h3>
              <button
                onClick={() => undockPanel(bottomPanel.id)}
                className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 whitespace-nowrap"
                data-testid="undock-button-bottom"
              >
                Undock
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto w-full">{renderPanelContent(bottomPanel.id)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Configurator() {
  return (
    <ConfigurationProvider>
      <DesignCanvasProvider>
        <FloatingPanelCoordinatorProvider>
          <PanelManagerProvider>
            <ConfiguratorContent />
          </PanelManagerProvider>
        </FloatingPanelCoordinatorProvider>
      </DesignCanvasProvider>
    </ConfigurationProvider>
  );
}