import { cn } from "@/lib/utils";
import { Settings, Eye, FileText } from "lucide-react";
import ConfigurationTab from "./ConfigurationTab";
import VisualDesignTab from "./VisualDesignTab";
import DocumentationTab from "./DocumentationTab";

interface SidebarProps {
  activeTab: "configuration" | "visual" | "documentation";
  onTabChange: (tab: "configuration" | "visual" | "documentation") => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
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

  return (
    <aside className="w-80 bg-white dark:bg-technical-800 border-r border-technical-200 dark:border-technical-700 flex flex-col">
      {/* Navigation Tabs */}
      <div className="border-b border-technical-200 dark:border-technical-700">
        <nav className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/10"
                    : "border-transparent text-technical-600 dark:text-technical-400 hover:text-technical-900 dark:hover:text-technical-200"
                )}
              >
                <Icon className="w-4 h-4 mr-2 inline" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "configuration" && <ConfigurationTab />}
        {activeTab === "visual" && <VisualDesignTab />}
        {activeTab === "documentation" && <DocumentationTab />}
      </div>
    </aside>
  );
}
