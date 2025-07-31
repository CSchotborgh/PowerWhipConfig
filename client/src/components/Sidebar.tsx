import React from "react";
import { cn } from "@/lib/utils";
import { Settings, Eye, FileText, ShoppingCart } from "lucide-react";
import ConfigurationTab from "./ConfigurationTab";
import VisualDesignTab from "./VisualDesignTab";
import DocumentationTab from "./DocumentationTab";
import OrderEntryTab from "./OrderEntryTab";

interface SidebarProps {
  activeTab: "configuration" | "visual" | "documentation" | "order";
  onTabChange: (tab: "configuration" | "visual" | "documentation" | "order") => void;
  isExpanded: boolean;
}

export default function Sidebar({ activeTab, onTabChange, isExpanded }: SidebarProps) {
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
      id: "order" as const,
      label: "Order Entry",
      icon: ShoppingCart,
    },
    {
      id: "documentation" as const,
      label: "Documentation",
      icon: FileText,
    },
  ];

  return (
    <aside className={cn(
      "bg-white dark:bg-technical-800 border-r border-technical-200 dark:border-technical-700 flex flex-col transition-all duration-300 ease-in-out",
      isExpanded ? "w-80" : "w-12"
    )}>
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
                    : "border-transparent text-technical-600 dark:text-technical-400 hover:text-technical-900 dark:hover:text-technical-200",
                  !isExpanded && "px-2"
                )}
                title={!isExpanded ? tab.label : undefined}
              >
                <Icon className={cn("w-4 h-4", isExpanded ? "mr-2 inline" : "mx-auto")} />
                {isExpanded && tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          {activeTab === "configuration" && <ConfigurationTab />}
          {activeTab === "visual" && <VisualDesignTab />}
          {activeTab === "order" && <OrderEntryTab />}
          {activeTab === "documentation" && <DocumentationTab />}
        </div>
      )}
      
      {/* Collapsed State Icons */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-4">
          <div className="text-technical-400 dark:text-technical-500 text-xs text-center">
            {tabs.find(tab => tab.id === activeTab)?.icon && (
              React.createElement(tabs.find(tab => tab.id === activeTab)!.icon, {
                className: "w-6 h-6 mx-auto mb-1"
              })
            )}
            <div className="text-[10px] leading-tight">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
