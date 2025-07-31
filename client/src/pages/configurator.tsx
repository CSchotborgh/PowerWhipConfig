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
        {/* Header Navbar */}
        <Header />
        
        {/* Main Body Container */}
        <div className="flex flex-1 overflow-hidden bg-gradient-to-br from-technical-50 to-technical-100 dark:from-technical-900 dark:to-technical-800">
          {/* Left Panel - Configuration Sidebar */}
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
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-6 rounded-r-xl border border-l-0 border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 hover:bg-technical-50 dark:hover:bg-technical-700 shadow-lg hover:shadow-xl transition-all"
              title={leftPanelExpanded ? "Collapse sidebar" : "Expand sidebar"}
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
            {/* Design Canvas Area */}
            <div className="flex-1 p-6 bg-gradient-to-br from-white to-technical-50/30 dark:from-technical-800 dark:to-technical-700/30">
              <div className="h-full rounded-xl border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 shadow-sm overflow-hidden">
                <DesignCanvas />
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
        </div>
      </div>
    </ConfigurationProvider>
  );
}
