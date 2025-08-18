import { useState } from "react";
import Header from "@/components/Header";
import ConfigurationTab from "@/components/ConfigurationTab";
import VisualDesignTab from "@/components/VisualDesignTab";
import DocumentationTab from "@/components/DocumentationTab";
import OrderEntryTab from "@/components/OrderEntryTab";
import DesignCanvas from "@/components/DesignCanvas";
import SpecificationPanel from "@/components/SpecificationPanel";
import { ParticleComponentLibrary, ParticleConfigurationPanel } from "@/components/ParticleStylePanel";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function Configurator() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation" | "order">("configuration");
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [showParticlePanels, setShowParticlePanels] = useState(true);

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

  return (
    <ConfigurationProvider>
      <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50">
        {/* Header Navbar with Navigation */}
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Particle Style Toggle */}
        <div className="fixed top-20 right-4 z-40">
          <Button
            variant={showParticlePanels ? "default" : "outline"}
            size="sm"
            onClick={() => setShowParticlePanels(!showParticlePanels)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Particle Mode
          </Button>
        </div>
        
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
            <aside className={`bg-white dark:bg-technical-800 border-r-2 border-technical-200/50 dark:border-technical-600/50 flex flex-col transition-all duration-300 ease-in-out shadow-lg ${leftPanelExpanded ? "w-80 md:w-80" : "w-12"} max-h-screen`}>
              {leftPanelExpanded && (
                <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-technical-50/30 dark:from-technical-800 dark:to-technical-700/30 h-full">
                  <div className="h-full border-r border-technical-100 dark:border-technical-600/30 flex flex-col">
                    {renderTabContent()}
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
            
            {/* Left Panel Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelExpanded(!leftPanelExpanded)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-6 rounded-r-xl border border-l-0 border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 hover:bg-technical-50 dark:hover:bg-technical-700 shadow-lg hover:shadow-xl transition-all"
              title={leftPanelExpanded ? "Collapse panel" : "Expand panel"}
            >
              {leftPanelExpanded ? (
                <ChevronLeft className="h-4 w-4 text-technical-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-technical-500" />
              )}
            </Button>
          </div>
          
          {/* Main Content Area - Responsive to Panel Expansion */}
          <main className={`flex-1 flex bg-white dark:bg-technical-800 rounded-tl-xl shadow-inner transition-all duration-300 ease-in-out ${
            !leftPanelExpanded ? 'ml-12' : ''
          } ${!rightPanelExpanded ? 'mr-12' : ''}`}>
            {/* Design Canvas Area - Flexible Scale */}
            <div className={`flex-1 p-6 bg-gradient-to-br from-white to-technical-50/30 dark:from-technical-800 dark:to-technical-700/30 transition-all duration-300 ease-in-out ${
              leftPanelExpanded && rightPanelExpanded ? 'scale-100' : 
              !leftPanelExpanded && !rightPanelExpanded ? 'scale-110' : 'scale-105'
            }`}>
              <div className="h-full rounded-xl border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 shadow-sm overflow-hidden">
                <DesignCanvas 
                  leftPanelExpanded={leftPanelExpanded} 
                  rightPanelExpanded={rightPanelExpanded}
                />
              </div>
            </div>
            
            {/* Right Panel - Specifications */}
            <div className="relative flex">
              {/* Right Panel Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-6 rounded-l-xl border border-r-0 border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 hover:bg-technical-50 dark:hover:bg-technical-700 shadow-lg hover:shadow-xl transition-all"
                title={rightPanelExpanded ? "Collapse specifications" : "Expand specifications"}
              >
                {rightPanelExpanded ? (
                  <ChevronRight className="h-4 w-4 text-technical-500" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-technical-500" />
                )}
              </Button>
              
              <SpecificationPanel isExpanded={rightPanelExpanded} />
            </div>
          </main>
          
          {/* Particle Style Floating Panels */}
          {showParticlePanels && (
            <>
              <ParticleComponentLibrary onClose={() => setShowParticlePanels(false)} />
              <ParticleConfigurationPanel />
            </>
          )}
        </div>
      </div>
    </ConfigurationProvider>
  );
}