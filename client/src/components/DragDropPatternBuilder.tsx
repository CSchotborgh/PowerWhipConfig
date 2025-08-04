import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Download, Zap, Copy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentItem {
  id: string;
  name: string;
  type: 'receptacle' | 'conduit' | 'length' | 'color' | 'feature';
  value: string;
  category: string;
  specifications?: any;
  dragType?: string;
}

interface DroppedPattern {
  id: string;
  receptacle?: ComponentItem;
  conduit?: ComponentItem;
  whipLength?: string;
  tailLength?: string;
  color?: ComponentItem;
  features?: ComponentItem[];
  isComplete: boolean;
}

const DragDropPatternBuilder: React.FC = () => {
  const [droppedPatterns, setDroppedPatterns] = useState<DroppedPattern[]>([]);
  const [draggedItem, setDraggedItem] = useState<ComponentItem | null>(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null);
  const [customWhipLength, setCustomWhipLength] = useState('25');
  const [customTailLength, setCustomTailLength] = useState('10');

  // Component library for drag-and-drop
  const componentLibrary: ComponentItem[] = [
    // Receptacles
    { id: 'cs8269a', name: 'CS8269A', type: 'receptacle', value: 'CS8269A', category: 'IEC Pin & Sleeve', dragType: 'receptacle' },
    { id: '460c9w', name: '460C9W', type: 'receptacle', value: '460C9W', category: 'NEMA Standard', dragType: 'receptacle' },
    { id: 'l6-30r', name: 'L6-30R', type: 'receptacle', value: 'L6-30R', category: 'NEMA Locking', dragType: 'receptacle' },
    { id: '5-20r', name: '5-20R', type: 'receptacle', value: '5-20R', category: 'NEMA Standard', dragType: 'receptacle' },
    { id: 'l14-30r', name: 'L14-30R', type: 'receptacle', value: 'L14-30R', category: 'NEMA Locking', dragType: 'receptacle' },
    
    // Conduit Types
    { id: 'lmzc', name: 'LMZC', type: 'conduit', value: 'LMZC', category: 'Liquid Tight', dragType: 'conduit' },
    { id: 'fmc', name: 'FMC', type: 'conduit', value: 'FMC', category: 'Flexible Metal', dragType: 'conduit' },
    { id: 'so', name: 'SO', type: 'conduit', value: 'SO', category: 'Portable Cord', dragType: 'conduit' },
    { id: 'mc', name: 'MC', type: 'conduit', value: 'MC', category: 'Metal Clad', dragType: 'conduit' },
    
    // Colors
    { id: 'red', name: 'Red', type: 'color', value: 'Red', category: 'Colors', dragType: 'color' },
    { id: 'blue', name: 'Blue', type: 'color', value: 'Blue', category: 'Colors', dragType: 'color' },
    { id: 'green', name: 'Green', type: 'color', value: 'Green', category: 'Colors', dragType: 'color' },
    { id: 'yellow', name: 'Yellow', type: 'color', value: 'Yellow', category: 'Colors', dragType: 'color' },
    { id: 'orange', name: 'Orange', type: 'color', value: 'Orange', category: 'Colors', dragType: 'color' },
    { id: 'purple', name: 'Purple', type: 'color', value: 'Purple', category: 'Colors', dragType: 'color' },
    
    // Features
    { id: 'ip67', name: 'IP67 Rated', type: 'feature', value: 'IP67', category: 'Protection', dragType: 'feature' },
    { id: 'bellbox', name: 'Bell Box', type: 'feature', value: 'Bell Box', category: 'Enclosure', dragType: 'feature' },
    { id: '60a', name: '60A Rating', type: 'feature', value: '60A', category: 'Current', dragType: 'feature' },
  ];

  const groupedComponents = componentLibrary.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, ComponentItem[]>);

  const handleDragStart = useCallback((item: ComponentItem) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setHoveredDropZone(null);
  }, []);

  const handleDrop = useCallback((patternId: string, dropZoneType: string) => {
    if (!draggedItem) return;

    setDroppedPatterns(prev => 
      prev.map(pattern => {
        if (pattern.id !== patternId) return pattern;

        const updated = { ...pattern };
        
        switch (dropZoneType) {
          case 'receptacle':
            if (draggedItem.type === 'receptacle') {
              updated.receptacle = draggedItem;
            }
            break;
          case 'conduit':
            if (draggedItem.type === 'conduit') {
              updated.conduit = draggedItem;
            }
            break;
          case 'color':
            if (draggedItem.type === 'color') {
              updated.color = draggedItem;
            }
            break;
          case 'features':
            if (draggedItem.type === 'feature') {
              updated.features = [...(updated.features || []), draggedItem];
            }
            break;
        }

        // Check if pattern is complete
        updated.isComplete = !!(updated.receptacle && updated.conduit && updated.whipLength && updated.tailLength);
        
        return updated;
      })
    );

    setDraggedItem(null);
    setHoveredDropZone(null);
  }, [draggedItem]);

  const addNewPattern = useCallback(() => {
    const newPattern: DroppedPattern = {
      id: `pattern-${Date.now()}`,
      whipLength: customWhipLength,
      tailLength: customTailLength,
      features: [],
      isComplete: false
    };
    setDroppedPatterns(prev => [...prev, newPattern]);
  }, [customWhipLength, customTailLength]);

  const removePattern = useCallback((patternId: string) => {
    setDroppedPatterns(prev => prev.filter(p => p.id !== patternId));
  }, []);

  const clearPattern = useCallback((patternId: string) => {
    setDroppedPatterns(prev => 
      prev.map(pattern => 
        pattern.id === patternId 
          ? { ...pattern, receptacle: undefined, conduit: undefined, color: undefined, features: [], isComplete: false }
          : pattern
      )
    );
  }, []);

  const duplicatePattern = useCallback((patternId: string) => {
    const pattern = droppedPatterns.find(p => p.id === patternId);
    if (!pattern) return;

    const duplicated: DroppedPattern = {
      ...pattern,
      id: `pattern-${Date.now()}`,
    };
    setDroppedPatterns(prev => [...prev, duplicated]);
  }, [droppedPatterns]);

  const generatePatterns = useCallback(() => {
    const completePatterns = droppedPatterns.filter(p => p.isComplete);
    const patterns = completePatterns.map(pattern => {
      const parts = [
        pattern.receptacle?.value,
        pattern.conduit?.value,
        pattern.whipLength,
        pattern.tailLength
      ];
      
      if (pattern.color) {
        parts.push(pattern.color.value);
      }
      
      return parts.filter(Boolean).join(', ');
    });

    return patterns;
  }, [droppedPatterns]);

  const exportPatterns = useCallback(async () => {
    const patterns = generatePatterns();
    if (patterns.length === 0) return;

    try {
      const response = await fetch('/api/excel/fast-transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patterns })
      });
      
      const result = await response.json();
      console.log('Export result:', result);
      
      // Here you could trigger a download or display results
      alert(`Successfully processed ${patterns.length} patterns in ${result.processingTimeMs}ms`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [generatePatterns]);

  const DropZone: React.FC<{
    patternId: string;
    type: string;
    children: React.ReactNode;
    isEmpty: boolean;
    className?: string;
  }> = ({ patternId, type, children, isEmpty, className }) => (
    <div
      className={cn(
        "min-h-[60px] border-2 border-dashed rounded-lg p-3 transition-all duration-200",
        isEmpty ? "border-technical-300 dark:border-technical-600" : "border-transparent",
        hoveredDropZone === `${patternId}-${type}` && draggedItem?.type === type && "border-green-400 bg-green-50 dark:bg-green-900/20",
        hoveredDropZone === `${patternId}-${type}` && draggedItem?.type !== type && "border-red-400 bg-red-50 dark:bg-red-900/20",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setHoveredDropZone(`${patternId}-${type}`);
      }}
      onDragLeave={() => setHoveredDropZone(null)}
      onDrop={(e) => {
        e.preventDefault();
        handleDrop(patternId, type);
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Drag-and-Drop Pattern Builder
          </CardTitle>
          <p className="text-sm text-technical-600 dark:text-technical-400">
            Build electrical configurations by dragging components into patterns. Visual feedback guides your design process.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Component Library */}
          <div>
            <h3 className="font-medium mb-3">Component Library</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(groupedComponents).map(([category, components]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-technical-700 dark:text-technical-300">{category}</h4>
                  <div className="space-y-1">
                    {components.map((component) => (
                      <div
                        key={component.id}
                        draggable
                        onDragStart={() => handleDragStart(component)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "p-2 bg-white dark:bg-technical-800 border border-technical-200 dark:border-technical-600 rounded cursor-grab active:cursor-grabbing",
                          "hover:border-blue-400 hover:shadow-sm transition-all duration-200",
                          draggedItem?.id === component.id && "opacity-50 scale-95"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{component.name}</span>
                          <Badge variant="outline" className="text-xs">{component.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pattern Builder Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="whip-length">Default Whip Length (ft):</Label>
              <Input
                id="whip-length"
                type="number"
                value={customWhipLength}
                onChange={(e) => setCustomWhipLength(e.target.value)}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="tail-length">Default Tail Length (ft):</Label>
              <Input
                id="tail-length"
                type="number"
                value={customTailLength}
                onChange={(e) => setCustomTailLength(e.target.value)}
                className="w-20"
              />
            </div>
            <Button onClick={addNewPattern} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Pattern
            </Button>
          </div>

          {/* Pattern Builder Area */}
          <div className="space-y-4">
            <h3 className="font-medium">Pattern Configurations</h3>
            {droppedPatterns.length === 0 ? (
              <div className="text-center py-8 text-technical-500 dark:text-technical-400">
                <p>No patterns created yet. Click "Add Pattern" to start building configurations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {droppedPatterns.map((pattern, index) => (
                  <Card key={pattern.id} className={cn(
                    "relative",
                    pattern.isComplete && "ring-2 ring-green-500 ring-opacity-50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Pattern {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          {pattern.isComplete && (
                            <Badge variant="default" className="bg-green-600">Complete</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicatePattern(pattern.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => clearPattern(pattern.id)}
                            className="h-8 w-8 p-0"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePattern(pattern.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Receptacle Drop Zone */}
                        <div>
                          <Label className="text-xs text-technical-600 dark:text-technical-400">Receptacle</Label>
                          <DropZone patternId={pattern.id} type="receptacle" isEmpty={!pattern.receptacle}>
                            {pattern.receptacle ? (
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">{pattern.receptacle.name}</span>
                                <Badge variant="outline">{pattern.receptacle.category}</Badge>
                              </div>
                            ) : (
                              <div className="text-technical-400 text-sm text-center">
                                Drop receptacle here
                              </div>
                            )}
                          </DropZone>
                        </div>

                        {/* Conduit Drop Zone */}
                        <div>
                          <Label className="text-xs text-technical-600 dark:text-technical-400">Conduit Type</Label>
                          <DropZone patternId={pattern.id} type="conduit" isEmpty={!pattern.conduit}>
                            {pattern.conduit ? (
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">{pattern.conduit.name}</span>
                                <Badge variant="outline">{pattern.conduit.category}</Badge>
                              </div>
                            ) : (
                              <div className="text-technical-400 text-sm text-center">
                                Drop conduit here
                              </div>
                            )}
                          </DropZone>
                        </div>

                        {/* Lengths */}
                        <div>
                          <Label className="text-xs text-technical-600 dark:text-technical-400">Lengths (ft)</Label>
                          <div className="min-h-[60px] border border-technical-200 dark:border-technical-600 rounded-lg p-3 bg-technical-50 dark:bg-technical-800">
                            <div className="text-sm">
                              <div>Whip: {pattern.whipLength} ft</div>
                              <div>Tail: {pattern.tailLength} ft</div>
                            </div>
                          </div>
                        </div>

                        {/* Color Drop Zone */}
                        <div>
                          <Label className="text-xs text-technical-600 dark:text-technical-400">Color</Label>
                          <DropZone patternId={pattern.id} type="color" isEmpty={!pattern.color}>
                            {pattern.color ? (
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-4 h-4 rounded-full border border-technical-300",
                                  pattern.color.value.toLowerCase() === 'red' && "bg-red-500",
                                  pattern.color.value.toLowerCase() === 'blue' && "bg-blue-500",
                                  pattern.color.value.toLowerCase() === 'green' && "bg-green-500",
                                  pattern.color.value.toLowerCase() === 'yellow' && "bg-yellow-500",
                                  pattern.color.value.toLowerCase() === 'orange' && "bg-orange-500",
                                  pattern.color.value.toLowerCase() === 'purple' && "bg-purple-500"
                                )} />
                                <span className="font-mono text-sm">{pattern.color.name}</span>
                              </div>
                            ) : (
                              <div className="text-technical-400 text-sm text-center">
                                Drop color here
                              </div>
                            )}
                          </DropZone>
                        </div>
                      </div>

                      {/* Features */}
                      {(pattern.features && pattern.features.length > 0) && (
                        <div className="mt-4">
                          <Label className="text-xs text-technical-600 dark:text-technical-400">Features</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {pattern.features.map((feature, idx) => (
                              <Badge key={idx} variant="secondary">{feature.name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Features Drop Zone */}
                      <div className="mt-4">
                        <Label className="text-xs text-technical-600 dark:text-technical-400">Additional Features</Label>
                        <DropZone patternId={pattern.id} type="features" isEmpty={!pattern.features?.length} className="min-h-[40px]">
                          <div className="text-technical-400 text-sm text-center">
                            Drop features here (optional)
                          </div>
                        </DropZone>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Export Controls */}
          {droppedPatterns.some(p => p.isComplete) && (
            <div className="flex items-center justify-between pt-4 border-t border-technical-200 dark:border-technical-600">
              <div className="text-sm text-technical-600 dark:text-technical-400">
                {droppedPatterns.filter(p => p.isComplete).length} complete patterns ready for export
              </div>
              <Button onClick={exportPatterns} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Patterns
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DragDropPatternBuilder;