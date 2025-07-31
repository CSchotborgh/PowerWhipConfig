import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronRight, Zap, Cable, Box, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExcelComponent {
  partNumber?: string;
  description?: string;
  category?: string;
  dragType?: string;
  specifications?: Record<string, any>;
  pricing?: number;
  availability?: boolean;
  manufacturer?: string;
}

interface CategoryGroup {
  [key: string]: ExcelComponent[];
}

const categoryIcons: Record<string, any> = {
  'Connectors & Plugs': Zap,
  'Receptacles & Outlets': Zap,
  'Cables & Wiring': Cable,
  'Conduit & Raceways': Cable,
  'Enclosures & Boxes': Box,
  'Circuit Protection': Shield,
  'Controls & Switches': Zap,
  'Lighting Components': Zap,
  'Miscellaneous': Box,
};

export default function EnhancedComponentLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Connectors & Plugs']));
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());

  const { data: components = [], isLoading } = useQuery<ExcelComponent[]>({
    queryKey: ['/api/excel/components'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Group components by category
  const categorizedComponents: CategoryGroup = components.reduce((acc, component) => {
    const category = component.category || 'Miscellaneous';
    if (!acc[category]) acc[category] = [];
    acc[category].push(component);
    return acc;
  }, {} as CategoryGroup);

  // Filter components based on search
  const filteredCategories = Object.entries(categorizedComponents).reduce((acc, [category, items]) => {
    const filteredItems = items.filter(item => 
      !searchTerm || 
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredItems.length > 0) {
      acc[category] = filteredItems;
    }
    return acc;
  }, {} as CategoryGroup);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, component: ExcelComponent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: `excel-${component.partNumber || Date.now()}`,
      type: component.dragType || 'misc',
      name: component.description || component.partNumber || 'Unknown Component',
      category: component.category || 'Miscellaneous',
      specifications: component.specifications || {},
      partNumber: component.partNumber,
      manufacturer: component.manufacturer,
      pricing: component.pricing
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const ComponentItem = ({ component }: { component: ExcelComponent }) => {
    const isSelected = selectedComponents.has(component.partNumber || '');
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, component)}
        className={cn(
          "p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing hover:shadow-md",
          "bg-white dark:bg-technical-800 border-technical-200 dark:border-technical-600",
          "hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10",
          isSelected && "border-primary bg-primary/10 dark:bg-primary/20"
        )}
        onClick={() => {
          const newSelected = new Set(selectedComponents);
          if (isSelected) {
            newSelected.delete(component.partNumber || '');
          } else {
            newSelected.add(component.partNumber || '');
          }
          setSelectedComponents(newSelected);
        }}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-technical-900 dark:text-technical-100 truncate">
                {component.description || 'No Description'}
              </h4>
              {component.partNumber && (
                <p className="text-xs text-technical-600 dark:text-technical-400 font-mono">
                  {component.partNumber}
                </p>
              )}
            </div>
            {component.availability && (
              <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Available
              </Badge>
            )}
          </div>
          
          {component.specifications && Object.keys(component.specifications).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(component.specifications).slice(0, 3).map(([key, value]) => (
                <Badge 
                  key={key} 
                  variant="outline" 
                  className="text-xs px-1 py-0 text-technical-600 dark:text-technical-400"
                >
                  {key}: {String(value).substring(0, 10)}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {component.manufacturer && (
              <span className="text-xs text-technical-500 dark:text-technical-400">
                {component.manufacturer}
              </span>
            )}
            {component.pricing && (
              <span className="text-xs font-semibold text-primary">
                ${component.pricing.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-technical-400" />
          <div className="h-8 bg-technical-200 dark:bg-technical-700 rounded animate-pulse flex-1" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-8 bg-technical-200 dark:bg-technical-700 rounded animate-pulse" />
            <div className="space-y-2 pl-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-16 bg-technical-100 dark:bg-technical-800 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Search Header */}
      <div className="sticky top-0 bg-white dark:bg-technical-800 z-10 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-technical-400" />
          <Input
            placeholder="Search components, part numbers, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-technical-50 dark:bg-technical-700 border-technical-200 dark:border-technical-600"
          />
        </div>
        <div className="mt-2 text-xs text-technical-600 dark:text-technical-400">
          Found {components.length} components across {Object.keys(categorizedComponents).length} categories
        </div>
      </div>

      {/* Component Categories */}
      <div className="space-y-3">
        {Object.entries(filteredCategories).map(([category, items]) => {
          const Icon = categoryIcons[category] || Box;
          const isExpanded = expandedCategories.has(category);
          
          return (
            <Card key={category} className="border-technical-200 dark:border-technical-600">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="p-3 cursor-pointer hover:bg-technical-50 dark:hover:bg-technical-700/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-technical-900 dark:text-technical-100">{category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-technical-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-technical-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="p-3 pt-0">
                    <div className="grid gap-2">
                      {items.slice(0, 20).map((component, index) => (
                        <ComponentItem key={`${component.partNumber}-${index}`} component={component} />
                      ))}
                      {items.length > 20 && (
                        <div className="text-center py-2">
                          <Button variant="outline" size="sm" className="text-xs">
                            Load {items.length - 20} more components
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {Object.keys(filteredCategories).length === 0 && (
        <div className="text-center py-8 text-technical-500 dark:text-technical-400">
          {searchTerm ? `No components found matching "${searchTerm}"` : 'No components available'}
        </div>
      )}
    </div>
  );
}