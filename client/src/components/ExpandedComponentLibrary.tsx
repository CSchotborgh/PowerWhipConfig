import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Plug, Shield, Zap, Cable, Settings, Package, Tag, Wrench, Terminal } from 'lucide-react';
import type { ElectricalComponent } from '@shared/schema';

interface ExpandedComponentLibraryProps {
  onAddComponent?: (component: ElectricalComponent) => void;
}

export function ExpandedComponentLibrary({ onAddComponent }: ExpandedComponentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'connectors-receptacles', 'protection', 'wire-cable'
  ]);

  const { data: components = [], isLoading } = useQuery<ElectricalComponent[]>({
    queryKey: ['/api/components'],
    refetchOnWindowFocus: false
  });

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (component.specifications as any)?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (component.specifications as any)?.partNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Total count */}
      <div className="text-sm text-muted-foreground">
        {filteredComponents.length} total components from MasterBubbleUpLookup
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
                        className="cursor-grab hover:bg-muted/50 transition-colors"
                        draggable
                        onDragStart={(e) => handleDragStart(e, component)}
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