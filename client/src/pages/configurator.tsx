import { useState } from "react";
import Header from "@/components/Header";
import DesignCanvas from "@/components/DesignCanvas";
import { PanelControlsFloating } from "@/components/PanelControlsFloating";
import { ContentPanel } from "@/components/ContentPanel";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { DesignCanvasProvider } from "@/contexts/DesignCanvasContext";

export default function Configurator() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation">("configuration");



  return (
    <ConfigurationProvider>
      <DesignCanvasProvider>
        <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50">
          {/* Header */}
          <Header />
          
          {/* Floating Panels */}
          <PanelControlsFloating 
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as "configuration" | "visual" | "documentation")} 
          />
          <ContentPanel activeTab={activeTab} />
        
          {/* Main Design Canvas - Full Width */}
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-technical-50 to-technical-100 dark:from-technical-900 dark:to-technical-800">
            <div className="h-full w-full p-6">
              <div className="h-full w-full rounded-xl border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 shadow-lg overflow-hidden">
                <DesignCanvas />
              </div>
            </div>
          </div>
        </div>
      </DesignCanvasProvider>
    </ConfigurationProvider>
  );
}