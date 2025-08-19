import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Plug, Shield, Zap, Cable, Settings, Package, Tag, Wrench, Terminal, X, Filter, Edit3, Check } from 'lucide-react';
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
  const [editingVoltage, setEditingVoltage] = useState<string | null>(null);
  const [editingVoltageValue, setEditingVoltageValue] = useState<string>('');
  const [editingCurrent, setEditingCurrent] = useState<string | null>(null);
  const [editingCurrentValue, setEditingCurrentValue] = useState<string>('');
  const [editingGauge, setEditingGauge] = useState<string | null>(null);
  const [editingGaugeValue, setEditingGaugeValue] = useState<string>('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  const { data: components = [], isLoading } = useQuery<ElectricalComponent[]>({
    queryKey: ['/api/components'],
    refetchOnWindowFocus: false
  });

  // Mutation for creating new components
  const createComponentMutation = useMutation({
    mutationFn: async (component: Omit<ElectricalComponent, 'id'>) => {
      const response = await fetch('/api/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(component)
      });
      if (!response.ok) {
        throw new Error('Failed to create component');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch components
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
    }
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

  // Helper functions for voltage editing
  const startEditingVoltage = (componentId: string, currentVoltage: number | null) => {
    setEditingVoltage(componentId);
    setEditingVoltageValue((currentVoltage || 0).toString());
  };

  const saveVoltageEdit = async (componentId: string) => {
    const newVoltage = parseInt(editingVoltageValue);
    if (!isNaN(newVoltage) && newVoltage > 0) {
      const originalComponent = components.find(c => c.id === componentId);
      if (originalComponent && originalComponent.maxVoltage !== newVoltage) {
        // Create new component with modified voltage
        const newComponent = {
          ...originalComponent,
          id: undefined, // Let backend generate new ID
          name: `${originalComponent.name} (${newVoltage}V)`,
          maxVoltage: newVoltage,
        };
        
        try {
          await createComponentMutation.mutateAsync(newComponent);
        } catch (error) {
          console.error('Failed to create modified component:', error);
        }
      }
    }
    setEditingVoltage(null);
    setEditingVoltageValue('');
  };

  const cancelVoltageEdit = () => {
    setEditingVoltage(null);
    setEditingVoltageValue('');
  };

  // Helper functions for current editing
  const startEditingCurrent = (componentId: string, currentAmp: number | null) => {
    setEditingCurrent(componentId);
    setEditingCurrentValue((currentAmp || 0).toString());
  };

  const saveCurrentEdit = async (componentId: string) => {
    const newCurrent = parseInt(editingCurrentValue);
    if (!isNaN(newCurrent) && newCurrent > 0) {
      const originalComponent = components.find(c => c.id === componentId);
      if (originalComponent && originalComponent.maxCurrent !== newCurrent) {
        // Create new component with modified current
        const newComponent = {
          ...originalComponent,
          id: undefined, // Let backend generate new ID
          name: `${originalComponent.name} (${newCurrent}A)`,
          maxCurrent: newCurrent,
        };
        
        try {
          await createComponentMutation.mutateAsync(newComponent);
        } catch (error) {
          console.error('Failed to create modified component:', error);
        }
      }
    }
    setEditingCurrent(null);
    setEditingCurrentValue('');
  };

  const cancelCurrentEdit = () => {
    setEditingCurrent(null);
    setEditingCurrentValue('');
  };

  // Helper functions for gauge editing
  const startEditingGauge = (componentId: string, currentGauge: string) => {
    setEditingGauge(componentId);
    setEditingGaugeValue(currentGauge);
  };

  const saveGaugeEdit = async (componentId: string) => {
    const newGauge = editingGaugeValue.trim();
    if (newGauge) {
      const originalComponent = components.find(c => c.id === componentId);
      const currentGauge = (originalComponent?.compatibleGauges as any)?.[0];
      if (originalComponent && currentGauge !== newGauge) {
        // Create new component with modified gauge
        const newComponent = {
          ...originalComponent,
          id: undefined, // Let backend generate new ID
          name: `${originalComponent.name} (${newGauge} AWG)`,
          compatibleGauges: [newGauge],
        };
        
        try {
          await createComponentMutation.mutateAsync(newComponent);
        } catch (error) {
          console.error('Failed to create modified component:', error);
        }
      }
    }
    setEditingGauge(null);
    setEditingGaugeValue('');
  };

  const cancelGaugeEdit = () => {
    setEditingGauge(null);
    setEditingGaugeValue('');
  };

  // Helper functions for name editing
  const startEditingName = (componentId: string, currentName: string) => {
    setEditingName(componentId);
    setEditingNameValue(currentName);
  };

  const saveNameEdit = async (componentId: string) => {
    const newName = editingNameValue.trim();
    if (newName && newName.length > 0) {
      const originalComponent = components.find(c => c.id === componentId);
      if (originalComponent && originalComponent.name !== newName) {
        // Create new component with modified name
        const newComponent = {
          ...originalComponent,
          id: undefined, // Let backend generate new ID
          name: newName,
        };
        
        try {
          await createComponentMutation.mutateAsync(newComponent);
        } catch (error) {
          console.error('Failed to create renamed component:', error);
        }
      }
    }
    setEditingName(null);
    setEditingNameValue('');
  };

  const cancelNameEdit = () => {
    setEditingName(null);
    setEditingNameValue('');
  };

  // Helper functions for price editing
  const startEditingPrice = (componentId: string, currentPrice: number | null) => {
    setEditingPrice(componentId);
    setEditingPriceValue((currentPrice || 0).toFixed(2));
  };

  const savePriceEdit = async (componentId: string) => {
    const newPrice = parseFloat(editingPriceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const originalComponent = components.find(c => c.id === componentId);
      if (originalComponent && originalComponent.price !== newPrice) {
        // Create new component with modified price
        const newComponent = {
          ...originalComponent,
          id: undefined, // Let backend generate new ID
          name: `${originalComponent.name} ($${newPrice.toFixed(2)})`,
          price: newPrice,
        };
        
        try {
          await createComponentMutation.mutateAsync(newComponent);
        } catch (error) {
          console.error('Failed to create component with new price:', error);
        }
      }
    }
    setEditingPrice(null);
    setEditingPriceValue('');
  };

  const cancelPriceEdit = () => {
    setEditingPrice(null);
    setEditingPriceValue('');
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
        const searchInput = document.querySelector('.component-search input') as HTMLInputElement;
        searchInput?.focus();
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
      headerColor: 'bg-blue-100 dark:bg-blue-800/30 border-blue-200 dark:border-blue-700',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-500 text-white',
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
      headerColor: 'bg-green-100 dark:bg-green-800/30 border-green-200 dark:border-green-700',
      iconColor: 'text-green-600 dark:text-green-400',
      badgeColor: 'bg-green-500 text-white',
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
      headerColor: 'bg-purple-100 dark:bg-purple-800/30 border-purple-200 dark:border-purple-700',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badgeColor: 'bg-purple-500 text-white',
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
      headerColor: 'bg-orange-100 dark:bg-orange-800/30 border-orange-200 dark:border-orange-700',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeColor: 'bg-orange-500 text-white',
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
      headerColor: 'bg-red-100 dark:bg-red-800/30 border-red-200 dark:border-red-700',
      iconColor: 'text-red-600 dark:text-red-400',
      badgeColor: 'bg-red-500 text-white',
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
      headerColor: 'bg-indigo-100 dark:bg-indigo-800/30 border-indigo-200 dark:border-indigo-700',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      badgeColor: 'bg-indigo-500 text-white',
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
      headerColor: 'bg-pink-100 dark:bg-pink-800/30 border-pink-200 dark:border-pink-700',
      iconColor: 'text-pink-600 dark:text-pink-400',
      badgeColor: 'bg-pink-500 text-white',
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
      headerColor: 'bg-teal-100 dark:bg-teal-800/30 border-teal-200 dark:border-teal-700',
      iconColor: 'text-teal-600 dark:text-teal-400',
      badgeColor: 'bg-teal-500 text-white',
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
            <AccordionItem key={category.id} value={category.id} className="border rounded-lg mb-2">
              <AccordionTrigger className={`hover:no-underline rounded-t-lg px-4 py-3 ${category.headerColor} transition-colors`}>
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-1.5 rounded-md bg-white/70 dark:bg-black/20 ${category.iconColor}`}>
                    {category.icon}
                  </div>
                  <span className={`font-semibold text-left ${category.iconColor}`}>{category.name}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge className={`${category.badgeColor} font-medium shadow-sm`}>
                      {category.items.length} items
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className={`${category.color} border-t-0 rounded-b-lg`}>
                <div className="space-y-3 p-4">
                  {category.items.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-4 text-center bg-white/50 dark:bg-black/20 rounded-lg">
                      No components found in this category
                      {searchQuery && (
                        <div className="text-xs mt-1">Try adjusting your search terms</div>
                      )}
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
                        <CardContent className="p-3 bg-white/60 dark:bg-black/10 rounded-lg shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`${category.iconColor}`}>
                                  {category.icon}
                                </div>
                                {editingName === component.id && (component.type === 'connector' || component.type === 'receptacle') ? (
                                  <div className="flex items-center gap-1 flex-1">
                                    <Input
                                      type="text"
                                      value={editingNameValue}
                                      onChange={(e) => setEditingNameValue(e.target.value)}
                                      className="h-6 text-xs px-1 flex-1"
                                      autoFocus
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter') await saveNameEdit(component.id);
                                        if (e.key === 'Escape') cancelNameEdit();
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={async () => await saveNameEdit(component.id)}
                                      className="h-5 w-5 p-0"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelNameEdit}
                                      className="h-5 w-5 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <h4 
                                    className={`font-medium text-sm truncate flex items-center gap-1 flex-1 ${
                                      (component.type === 'connector' || component.type === 'receptacle') 
                                        ? 'cursor-pointer hover:bg-secondary/20 px-1 py-0.5 rounded group' 
                                        : ''
                                    }`}
                                    onClick={() => {
                                      if (component.type === 'connector' || component.type === 'receptacle') {
                                        startEditingName(component.id, component.name);
                                      }
                                    }}
                                  >
                                    <span className="truncate">{component.name}</span>
                                    {(component.type === 'connector' || component.type === 'receptacle') && (
                                      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    )}
                                  </h4>
                                )}
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
                                {component.maxVoltage && component.maxVoltage > 0 && 
                                 (component.type === 'connector' || component.type === 'receptacle' || component.type === 'protection') && (
                                  <div className="relative">
                                    {editingVoltage === component.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          value={editingVoltageValue}
                                          onChange={(e) => setEditingVoltageValue(e.target.value)}
                                          className="h-6 w-16 text-xs px-1"
                                          autoFocus
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') await saveVoltageEdit(component.id);
                                            if (e.key === 'Escape') cancelVoltageEdit();
                                          }}
                                        />
                                        <span className="text-xs">V</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={async () => await saveVoltageEdit(component.id)}
                                          className="h-5 w-5 p-0"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelVoltageEdit}
                                          className="h-5 w-5 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs cursor-pointer hover:bg-secondary/80 group"
                                        onClick={() => startEditingVoltage(component.id, component.maxVoltage)}
                                      >
                                        <span>{component.maxVoltage}V</span>
                                        <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {component.maxCurrent && component.maxCurrent > 0 && 
                                 (component.type === 'connector' || component.type === 'receptacle' || component.type === 'protection') && (
                                  <div className="relative">
                                    {editingCurrent === component.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          value={editingCurrentValue}
                                          onChange={(e) => setEditingCurrentValue(e.target.value)}
                                          className="h-6 w-16 text-xs px-1"
                                          autoFocus
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') await saveCurrentEdit(component.id);
                                            if (e.key === 'Escape') cancelCurrentEdit();
                                          }}
                                        />
                                        <span className="text-xs">A</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={async () => await saveCurrentEdit(component.id)}
                                          className="h-5 w-5 p-0"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelCurrentEdit}
                                          className="h-5 w-5 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs cursor-pointer hover:bg-secondary/80 group"
                                        onClick={() => startEditingCurrent(component.id, component.maxCurrent)}
                                      >
                                        <span>{component.maxCurrent}A</span>
                                        <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {(component.compatibleGauges as any)?.length > 0 && 
                                 (component.type === 'connector' || component.type === 'receptacle' || component.type === 'wire') && (
                                  <div className="relative">
                                    {editingGauge === component.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="text"
                                          value={editingGaugeValue}
                                          onChange={(e) => setEditingGaugeValue(e.target.value)}
                                          className="h-6 w-16 text-xs px-1"
                                          autoFocus
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') await saveGaugeEdit(component.id);
                                            if (e.key === 'Escape') cancelGaugeEdit();
                                          }}
                                        />
                                        <span className="text-xs">AWG</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={async () => await saveGaugeEdit(component.id)}
                                          className="h-5 w-5 p-0"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelGaugeEdit}
                                          className="h-5 w-5 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs cursor-pointer hover:bg-secondary/20 group"
                                        onClick={() => startEditingGauge(component.id, (component.compatibleGauges as any)[0])}
                                      >
                                        <span>{(component.compatibleGauges as any)[0]} AWG</span>
                                        <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {component.price && (
                                <div className="relative">
                                  {editingPrice === component.id ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingPriceValue}
                                        onChange={(e) => setEditingPriceValue(e.target.value)}
                                        className="h-6 w-20 text-xs px-1"
                                        autoFocus
                                        onKeyDown={async (e) => {
                                          if (e.key === 'Enter') await savePriceEdit(component.id);
                                          if (e.key === 'Escape') cancelPriceEdit();
                                        }}
                                      />
                                      {(component.type === 'wire' || component.type === 'conduit') && (
                                        <span className="text-xs">/ft</span>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => await savePriceEdit(component.id)}
                                        className="h-5 w-5 p-0"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelPriceEdit}
                                        className="h-5 w-5 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="text-xs font-medium text-green-600 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 px-1 py-0.5 rounded group inline-flex items-center gap-1"
                                      onClick={() => startEditingPrice(component.id, component.price)}
                                    >
                                      <span>${component.price.toFixed(2)}</span>
                                      {(component.type === 'wire' || component.type === 'conduit') && <span> /ft</span>}
                                      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  )}
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