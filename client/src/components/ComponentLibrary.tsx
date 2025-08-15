import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Puzzle } from "lucide-react";
import type { ElectricalComponent } from "@shared/schema";

export default function ComponentLibrary() {
  const [openCategories, setOpenCategories] = useState<string[]>(["connector", "protection"]);
  
  const { data: components, isLoading } = useQuery<ElectricalComponent[]>({
    queryKey: ["/api/components"],
  });

  const componentsByType = components?.reduce((acc, component) => {
    if (!acc[component.type]) {
      acc[component.type] = [];
    }
    acc[component.type].push(component);
    return acc;
  }, {} as Record<string, ElectricalComponent[]>) || {};

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleDragStart = (e: React.DragEvent, component: ElectricalComponent) => {
    console.log("Starting drag for component:", component); // Debug log
    const componentData = JSON.stringify(component);
    console.log("Serialized component data:", componentData); // Debug log
    e.dataTransfer.setData("application/json", componentData);
    e.dataTransfer.effectAllowed = "copy";
  };

  const categoryConfig = {
    connector: { label: "Connectors", icon: "🔌", color: "text-orange-500" },
    protection: { label: "Protection", icon: "🛡️", color: "text-blue-500" },
    junction: { label: "Junction", icon: "📦", color: "text-gray-500" },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
            <Puzzle className="w-4 h-4 mr-2 text-primary" />
            Component Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-technical-600 dark:text-technical-400">
            Loading components...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
          <Puzzle className="w-4 h-4 mr-2 text-primary" />
          Component Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-technical-300 dark:scrollbar-thumb-technical-600 scrollbar-track-transparent touch-scroll relative">
        <div className="block md:hidden absolute top-2 right-2 text-xs text-technical-500 bg-technical-100 dark:bg-technical-700 px-2 py-1 rounded animate-pulse">
          Swipe to scroll ↕
        </div>
        {Object.entries(componentsByType).map(([type, typeComponents]) => {
          const config = categoryConfig[type as keyof typeof categoryConfig];
          if (!config) return null;
          
          return (
            <Collapsible
              key={type}
              open={openCategories.includes(type)}
              onOpenChange={() => toggleCategory(type)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="border border-technical-200 dark:border-technical-700 rounded-lg">
                  <div className="w-full px-3 py-2 flex items-center justify-between text-left font-medium text-technical-800 dark:text-technical-200 hover:bg-technical-50 dark:hover:bg-technical-800 rounded-lg">
                    <span className="flex items-center">
                      <span className={`mr-2 ${config.color}`}>{config.icon}</span>
                      {config.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openCategories.includes(type) ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-2 p-3 border border-technical-200 dark:border-technical-700 rounded-lg bg-technical-50 dark:bg-technical-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {typeComponents.map((component) => (
                      <div
                        key={component.id}
                        className="component-item p-3 md:p-2 border border-technical-200 dark:border-technical-600 rounded cursor-move hover:bg-primary/10 dark:hover:bg-primary/20 text-center transition-colors touch-manipulation active:scale-95"
                        draggable
                        onDragStart={(e) => handleDragStart(e, component)}
                      >
                        <div className={`text-lg mb-1 ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="text-xs font-medium text-technical-700 dark:text-technical-300">
                          {component.name}
                        </div>
                        {(component.maxVoltage || component.maxCurrent) && (
                          <div className="text-xs text-technical-500 dark:text-technical-500 mt-1">
                            {component.maxVoltage || 'N/A'}V / {component.maxCurrent || 'N/A'}A
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
