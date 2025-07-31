import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DesignCanvas from "@/components/DesignCanvas";
import SpecificationPanel from "@/components/SpecificationPanel";
import { ConfigurationProvider } from "@/contexts/ConfigurationContext";

export default function Configurator() {
  const [activeTab, setActiveTab] = useState<"configuration" | "visual" | "documentation">("configuration");

  return (
    <ConfigurationProvider>
      <div className="h-screen flex flex-col bg-technical-50 dark:bg-technical-900 text-technical-900 dark:text-technical-50">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <main className="flex-1 flex">
            <div className="flex-1 p-6">
              <DesignCanvas />
            </div>
            <SpecificationPanel />
          </main>
        </div>
      </div>
    </ConfigurationProvider>
  );
}
