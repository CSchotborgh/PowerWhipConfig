import { useState } from "react";
import Header from "@/components/Header";
import DesignCanvas from "@/components/DesignCanvas";
import { PanelControlsFloating } from "@/components/PanelControlsFloating";
import { ContentPanel } from "@/components/ContentPanel";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { DesignCanvasProvider, useDesignCanvas } from "@/contexts/DesignCanvasContext";
import { DockZones } from "@/components/DockZones";

function ConfiguratorContent() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation">("configuration");
  const { setActiveDockZone, dockedPanels, undockPanel, isDraggingPanel } = useDesignCanvas();

  const handleDockZoneHover = (zone: 'top' | 'bottom' | 'left' | 'right' | null) => {
    setActiveDockZone(zone);
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
            className="border-b border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10"
            style={{ height: topPanel.size }}
            data-testid="docked-panel-top"
          >
            <div className="p-3 flex items-center justify-between border-b border-technical-200 dark:border-technical-600">
              <h3 className="font-semibold text-sm">{topPanel.title}</h3>
              <button
                onClick={() => undockPanel(topPanel.id)}
                className="text-xs text-muted-foreground hover:text-foreground"
                data-testid="undock-button-top"
              >
                Undock
              </button>
            </div>
            <div className="p-4">{topPanel.content}</div>
          </div>
        )}

        {/* Middle Row: Left Panel | Canvas | Right Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Docked Panel */}
          {leftPanel && (
            <div 
              className="border-r border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10"
              style={{ width: leftPanel.size }}
              data-testid="docked-panel-left"
            >
              <div className="p-3 flex items-center justify-between border-b border-technical-200 dark:border-technical-600">
                <h3 className="font-semibold text-sm">{leftPanel.title}</h3>
                <button
                  onClick={() => undockPanel(leftPanel.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  data-testid="undock-button-left"
                >
                  Undock
                </button>
              </div>
              <div className="p-4">{leftPanel.content}</div>
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
              className="border-l border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10"
              style={{ width: rightPanel.size }}
              data-testid="docked-panel-right"
            >
              <div className="p-3 flex items-center justify-between border-b border-technical-200 dark:border-technical-600">
                <h3 className="font-semibold text-sm">{rightPanel.title}</h3>
                <button
                  onClick={() => undockPanel(rightPanel.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  data-testid="undock-button-right"
                >
                  Undock
                </button>
              </div>
              <div className="p-4">{rightPanel.content}</div>
            </div>
          )}
        </div>

        {/* Bottom Docked Panel */}
        {bottomPanel && (
          <div 
            className="border-t border-technical-200 dark:border-technical-600 bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm overflow-auto relative z-10"
            style={{ height: bottomPanel.size }}
            data-testid="docked-panel-bottom"
          >
            <div className="p-3 flex items-center justify-between border-b border-technical-200 dark:border-technical-600">
              <h3 className="font-semibold text-sm">{bottomPanel.title}</h3>
              <button
                onClick={() => undockPanel(bottomPanel.id)}
                className="text-xs text-muted-foreground hover:text-foreground"
                data-testid="undock-button-bottom"
              >
                Undock
              </button>
            </div>
            <div className="p-4">{bottomPanel.content}</div>
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
        <ConfiguratorContent />
      </DesignCanvasProvider>
    </ConfigurationProvider>
  );
}