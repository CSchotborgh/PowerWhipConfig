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
      "bg-white dark:bg-technical-800 border-r-2 border-technical-200/50 dark:border-technical-600/50 flex flex-col transition-all duration-300 ease-in-out shadow-lg",
      isExpanded ? "w-80" : "w-12"
    )}>
      {/* Navigation Tabs */}
      <div className="border-b-2 border-technical-200/30 dark:border-technical-600/30 bg-gradient-to-r from-technical-50 to-white dark:from-technical-700 dark:to-technical-800">
        <nav className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 px-4 py-4 text-sm font-medium border-b-3 transition-all duration-200 relative group",
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/10 shadow-inner"
                    : "border-transparent text-technical-600 dark:text-technical-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30",
                  !isExpanded && "px-2"
                )}
                title={!isExpanded ? tab.label : undefined}
              >
                <div className="flex items-center justify-center">
                  <Icon className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110", 
                    isExpanded ? "mr-2 inline" : "mx-auto"
                  )} />
                  {isExpanded && (
                    <span className="font-semibold tracking-wide">{tab.label}</span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-technical-50/30 dark:from-technical-800 dark:to-technical-700/30">
          <div className="h-full border-r border-technical-100 dark:border-technical-600/30">
            {activeTab === "configuration" && <ConfigurationTab />}
            {activeTab === "visual" && <VisualDesignTab />}
            {activeTab === "order" && <OrderEntryTab />}
            {activeTab === "documentation" && <DocumentationTab />}
          </div>
        </div>
      )}
      
      {/* Collapsed State Icons */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-4 bg-gradient-to-b from-technical-50/50 to-white dark:from-technical-700/50 dark:to-technical-800">
          <div className="text-technical-400 dark:text-technical-500 text-xs text-center p-3 rounded-xl bg-white dark:bg-technical-700 shadow-md">
            {tabs.find(tab => tab.id === activeTab)?.icon && (
              React.createElement(tabs.find(tab => tab.id === activeTab)!.icon, {
                className: "w-6 h-6 mx-auto mb-2 text-primary"
              })
            )}
            <div className="text-[10px] leading-tight font-medium">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
