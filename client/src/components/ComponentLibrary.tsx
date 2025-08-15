import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ChevronDown, Puzzle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ElectricalComponent } from "@shared/schema";

export default function ComponentLibrary() {
  const [openCategories, setOpenCategories] = useState<string[]>(["connector", "protection"]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [highlightedComponent, setHighlightedComponent] = useState<string | null>(null);
  
  const { data: components, isLoading } = useQuery<ElectricalComponent[]>({
    queryKey: ["/api/components"],
  });

  // Filter components based on search query
  const filteredComponents = useMemo(() => {
    if (!components) return [];
    if (!searchQuery.trim()) return components;
    
    const query = searchQuery.toLowerCase();
    return components.filter(component => 
      component.name.toLowerCase().includes(query) ||
      component.type.toLowerCase().includes(query) ||
      component.category.toLowerCase().includes(query) ||
      (component.specifications && JSON.stringify(component.specifications).toLowerCase().includes(query))
    );
  }, [components, searchQuery]);

  const componentsByType = filteredComponents?.reduce((acc, component) => {
    if (!acc[component.type]) {
      acc[component.type] = [];
    }
    acc[component.type].push(component);
    return acc;
  }, {} as Record<string, ElectricalComponent[]>) || {};

  // Auto-expand categories when searching
  const effectiveOpenCategories = searchQuery.trim() 
    ? Object.keys(componentsByType) 
    : openCategories;

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

  const clearSearch = () => {
    setSearchQuery("");
    setHighlightedComponent(null);
  };

  const isComponentHighlighted = (componentId: string) => {
    return highlightedComponent === componentId || 
           (searchQuery.trim() && !highlightedComponent);
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-technical-900 dark:text-technical-100 mb-3">
          <Puzzle className="w-4 h-4 mr-2 text-primary" />
          Component Library
        </CardTitle>
        
        {/* Search Bar */}
        <div className="relative component-search">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-technical-400 h-4 w-4" />
          <Input
            placeholder="Search components... (e.g., NEMA, 20A, junction)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-technical-50 dark:bg-technical-800 border-technical-200 dark:border-technical-600 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-technical-100 dark:hover:bg-technical-700"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {searchQuery && (
          <div className="text-xs text-technical-500 mt-2 flex items-center justify-between">
            <span>
              Found {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}
              {filteredComponents.length === 0 && (
                <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                  - Try searching by name, type, or rating
                </span>
              )}
            </span>
            {filteredComponents.length > 0 && (
              <span className="text-green-600 dark:text-green-400 text-xs">
                Drag to Design Canvas →
              </span>
            )}
          </div>
        )}
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
              open={effectiveOpenCategories.includes(type)}
              onOpenChange={() => toggleCategory(type)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="border border-technical-200 dark:border-technical-700 rounded-lg">
                  <div className="w-full px-3 py-2 flex items-center justify-between text-left font-medium text-technical-800 dark:text-technical-200 hover:bg-technical-50 dark:hover:bg-technical-800 rounded-lg">
                    <span className="flex items-center">
                      <span className={`mr-2 ${config.color}`}>{config.icon}</span>
                      {config.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${effectiveOpenCategories.includes(type) ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-2 p-3 border border-technical-200 dark:border-technical-700 rounded-lg bg-technical-50 dark:bg-technical-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {typeComponents.map((component) => (
                      <div
                        key={component.id}
                        className={`component-item p-3 md:p-2 border rounded cursor-move text-center transition-all duration-200 touch-manipulation active:scale-95 ${
                          isComponentHighlighted(component.id)
                            ? 'border-primary bg-primary/20 dark:bg-primary/30 shadow-lg ring-2 ring-primary/50 search-highlight'
                            : 'border-technical-200 dark:border-technical-600 hover:bg-primary/10 dark:hover:bg-primary/20'
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, component)}
                        onMouseEnter={() => searchQuery && setHighlightedComponent(component.id)}
                        onMouseLeave={() => searchQuery && setHighlightedComponent(null)}
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
