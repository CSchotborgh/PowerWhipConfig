import { useState } from "react";
import Header from "@/components/Header";
import DesignCanvas from "@/components/DesignCanvas";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";
import { DesignCanvasProvider } from "@/contexts/DesignCanvasContext";

export default function Configurator() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation">("configuration");



  return (
    <ConfigurationProvider>
      <DesignCanvasProvider>
        <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50">
          {/* Header Navbar with Navigation and Panel Controls */}
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* RC-Dock Layout Container */}
          <div className="flex-1 relative overflow-hidden">
            {/* Design Canvas as Background/Main Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-white to-technical-50/30 dark:from-technical-800 dark:to-technical-700/30">
              <div className="h-full w-full p-6">
                <div className="h-full w-full rounded-xl border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 shadow-sm overflow-hidden">
                  <DesignCanvas />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DesignCanvasProvider>
    </ConfigurationProvider>
  );
}