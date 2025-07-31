import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DesignCanvas from "@/components/DesignCanvas";
import SpecificationPanel from "@/components/SpecificationPanel";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from "lucide-react";

export default function Configurator() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation" | "order">("configuration");
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);

  return (
    <ConfigurationProvider>
      <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Sidebar */}
          <div className="relative flex">
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              isExpanded={leftPanelExpanded}
            />
            
            {/* Left Panel Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelExpanded(!leftPanelExpanded)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-6 rounded-r-lg border border-l-0 border-technical-200 dark:border-technical-700 bg-white dark:bg-technical-800 hover:bg-technical-50 dark:hover:bg-technical-700 shadow-sm"
            >
              {leftPanelExpanded ? (
                <ChevronLeft className="h-4 w-4 text-technical-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-technical-500" />
              )}
            </Button>
          </div>
          
          <main className="flex-1 flex">
            <div className="flex-1 p-6">
              <DesignCanvas />
            </div>
            
            {/* Right Panel - Specifications */}
            <div className="relative flex">
              {/* Right Panel Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-6 rounded-l-lg border border-r-0 border-technical-200 dark:border-technical-700 bg-white dark:bg-technical-800 hover:bg-technical-50 dark:hover:bg-technical-700 shadow-sm"
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
        </div>
      </div>
    </ConfigurationProvider>
  );
}
