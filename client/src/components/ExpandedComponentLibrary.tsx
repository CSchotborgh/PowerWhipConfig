import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Plug, Shield, Zap, Cable, Settings, Package, Tag, Wrench, Terminal, X, Filter } from 'lucide-react';
import type { ElectricalComponent } from '@shared/schema';

interface ExpandedComponentLibraryProps {
  onAddComponent?: (component: ElectricalComponent) => void;
}

export function ExpandedComponentLibrary({ onAddComponent }: ExpandedComponentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedComponent, setHighlightedComponent] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'connectors-receptacles', 'protection', 'wire-cable'
  ]);

  const { data: components = [], isLoading } = useQuery<ElectricalComponent[]>({
    queryKey: ['/api/components'],
    refetchOnWindowFocus: false
  });

  // Enhanced filtering logic from ComponentLibrary
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

  const clearSearch = () => {
    setSearchQuery('');
    setHighlightedComponent(null);
  };

  const isComponentHighlighted = (componentId: string) => {
    return highlightedComponent === componentId || 
           (searchQuery.trim() && !highlightedComponent);
  };

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const categoriesWithResults = componentCategories
        .filter(cat => cat.items.length > 0)
        .map(cat => cat.id);
      setExpandedCategories(categoriesWithResults);
    } else {
      setExpandedCategories(['connectors-receptacles', 'protection', 'wire-cable']);
    }
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.component-search input')?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const componentCategories = [
    {
      id: 'connectors-receptacles',
      name: 'Connectors & Receptacles',
      icon: <Plug className="h-4 w-4" />,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'receptacle' || 
        comp.category === 'plug' || 
        comp.category === 'connector' ||
        comp.type === 'connector'
      )
    },
    {
      id: 'protection',
      name: 'Protection Devices',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-green-50 dark:bg-green-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'breaker' || 
        comp.category === 'gfci' || 
        comp.category === 'afci' ||
        comp.category === 'surge' ||
        comp.type === 'protection'
      )
    },
    {
      id: 'wire-cable',
      name: 'Wire & Cable',
      icon: <Cable className="h-4 w-4" />,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'mc-cable' || 
        comp.category === 'thhn' || 
        comp.category === 'portable' || 
        comp.category === 'tray-cable' ||
        comp.category === 'flexible' ||
        comp.category === 'liquid-tight' ||
        comp.type === 'wire' ||
        comp.type === 'conduit'
      )
    },
    {
      id: 'fittings-adapters',
      name: 'Fittings & Adapters',
      icon: <Settings className="h-4 w-4" />,
      color: 'bg-orange-50 dark:bg-orange-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'adapter' || 
        comp.category === 'clamp' || 
        comp.category === 'bushing' ||
        comp.type === 'fitting'
      )
    },
    {
      id: 'terminals-hardware',
      name: 'Terminals & Hardware',
      icon: <Terminal className="h-4 w-4" />,
      color: 'bg-red-50 dark:bg-red-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'wire-nut' || 
        comp.category === 'grounding' || 
        comp.category === 'terminal' ||
        comp.type === 'terminal'
      )
    },
    {
      id: 'assemblies-backshells',
      name: 'Assemblies & Backshells',
      icon: <Wrench className="h-4 w-4" />,
      color: 'bg-indigo-50 dark:bg-indigo-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'backshell' || 
        comp.category === 'assembly' ||
        comp.type === 'assembly'
      )
    },
    {
      id: 'labels-marking',
      name: 'Labels & Marking',
      icon: <Tag className="h-4 w-4" />,
      color: 'bg-pink-50 dark:bg-pink-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'label' || 
        comp.category === 'marking' ||
        comp.type === 'marking'
      )
    },
    {
      id: 'enclosures-boxes',
      name: 'Enclosures & Boxes',
      icon: <Package className="h-4 w-4" />,
      color: 'bg-teal-50 dark:bg-teal-900/20',
      items: filteredComponents.filter(comp => 
        comp.category === 'outlet-box' || 
        comp.category === 'junction-box' || 
        comp.category === 'enclosure' ||
        comp.category === 'junction' ||
        comp.type === 'enclosure'
      )
    }
  ];

  const handleDragStart = (e: React.DragEvent, component: ElectricalComponent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: component.name,
      name: component.name,
      type: component.type,
      category: component.category,
      specifications: component.specifications,
      partNumber: (component.specifications as any)?.partNumber
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Enhanced Search with Clear Button */}
      <div className="relative component-search">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search components... (e.g., NEMA, 20A, junction, THHN, Brady) - Press Ctrl+K to focus"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 bg-white dark:bg-technical-800 border-technical-200 dark:border-technical-600 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          autoComplete="off"
          spellCheck={false}
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

      {/* Search Results Info & Filter Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Filter className="h-3 w-3" />
          <span>
            {searchQuery ? (
              <span className="font-medium">
                {filteredComponents.length} of {components.length} components
                {searchQuery && (
                  <span className="text-primary ml-1">
                    matching "{searchQuery}"
                  </span>
                )}
              </span>
            ) : (
              <>{filteredComponents.length} total components from MasterBubbleUpLookup</>
            )}
          </span>
        </div>
        {searchQuery && (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              ESC to clear
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 px-2 text-xs"
            >
              Clear search
            </Button>
          </div>
        )}
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1">
        <Accordion type="multiple" value={expandedCategories} onValueChange={setExpandedCategories}>
          {componentCategories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {category.items.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {category.items.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-2">
                      No components in this category
                    </div>
                  ) : (
                    category.items.map((component) => (
                      <Card 
                        key={component.name} 
                        className={`cursor-grab transition-all duration-200 ${
                          isComponentHighlighted(component.name)
                            ? 'border-primary bg-primary/10 dark:bg-primary/20 shadow-lg ring-2 ring-primary/30 search-highlight'
                            : 'hover:bg-muted/50 border-technical-200 dark:border-technical-600'
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, component)}
                        onMouseEnter={() => searchQuery && setHighlightedComponent(component.name)}
                        onMouseLeave={() => setHighlightedComponent(null)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {category.icon}
                                <h4 className="font-medium text-sm truncate">{component.name}</h4>
                              </div>
                              
                              {(component.specifications as any)?.partNumber && (
                                <p className="text-xs text-muted-foreground mb-1 font-mono">
                                  P/N: {(component.specifications as any).partNumber}
                                </p>
                              )}
                              
                              {(component.specifications as any)?.description && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {(component.specifications as any).description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-1 mb-2">
                                {component.maxVoltage && component.maxVoltage > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {component.maxVoltage}V
                                  </Badge>
                                )}
                                {component.maxCurrent && component.maxCurrent > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {component.maxCurrent}A
                                  </Badge>
                                )}
                                {(component.compatibleGauges as any)?.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {(component.compatibleGauges as any)[0]} AWG
                                  </Badge>
                                )}
                              </div>
                              
                              {component.price && (
                                <div className="text-xs font-medium text-green-600">
                                  ${component.price.toFixed(2)}
                                  {(component.type === 'wire' || component.type === 'conduit') && ' /ft'}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => onAddComponent?.(component)}
                              className="h-8 w-8 p-0 shrink-0"
                              title="Add to canvas"
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

export default ExpandedComponentLibrary;