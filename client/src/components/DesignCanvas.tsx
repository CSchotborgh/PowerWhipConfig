import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid, Layers, Settings, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import AGGridOrderEntry from "./AGGridOrderEntry";
import VirtualizedOrderEntry from "./VirtualizedOrderEntry";
import PerformanceOrderEntry from "./PerformanceOrderEntry";
import ExcelTransformer from "./ExcelTransformer";

interface DroppedComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  specifications?: Record<string, any>;
  partNumber?: string;
}

interface DesignCanvasProps {
  onToggleView?: () => void;
}



export default function DesignCanvas({ onToggleView }: DesignCanvasProps) {
  const [droppedComponents, setDroppedComponents] = useState<DroppedComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [viewMode, setViewMode] = useState<"design" | "order" | "transformer">("design");
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      const rect = canvasRef.current?.getBoundingClientRect();
      
      if (rect) {
        const x = (e.clientX - rect.left) / canvasScale;
        const y = (e.clientY - rect.top) / canvasScale;
        
        const newComponent: DroppedComponent = {
          id: `${componentData.id}-${Date.now()}`,
          type: componentData.type,
          name: componentData.name,
          x,
          y,
          specifications: componentData.specifications,
          partNumber: componentData.partNumber
        };
        
        setDroppedComponents(prev => [...prev, newComponent]);
      }
    } catch (error) {
      console.error('Error parsing dropped component:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleComponentClick = (componentId: string) => {
    setSelectedComponent(componentId === selectedComponent ? null : componentId);
  };

  const deleteComponent = (componentId: string) => {
    setDroppedComponents(prev => prev.filter(comp => comp.id !== componentId));
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
  };

  const clearCanvas = () => {
    setDroppedComponents([]);
    setSelectedComponent(null);
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'connector': return '🔌';
      case 'receptacle': return '⚡';
      case 'cable': return '🔗';
      case 'conduit': return '🚇';
      case 'enclosure': return '📦';
      case 'protection': return '🛡️';
      default: return '⚙️';
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => {
      if (prev === "design") return "order";
      if (prev === "order") return "transformer";
      return "design";
    });
  };

  const selectedComponentData = droppedComponents.find(comp => comp.id === selectedComponent);

  // Show different views based on mode
  if (viewMode === "order") {
    return <PerformanceOrderEntry onToggleView={toggleViewMode} />;
  }

  if (viewMode === "transformer") {
    return <ExcelTransformer onToggleView={toggleViewMode} />;
  }

  return (
    <div className="flex-1 flex h-full">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-technical-900">
        {/* Canvas Toolbar */}
        <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
                {viewMode === "design" ? "Design Canvas" : 
                 viewMode === "order" ? "Order Entry System" : 
                 "Excel Transformer"}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCanvasScale(prev => Math.max(0.25, prev - 0.25))}
                >
                  Zoom Out
                </Button>
                <span className="text-sm text-technical-600 dark:text-technical-400 min-w-16 text-center">
                  {Math.round(canvasScale * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCanvasScale(prev => Math.min(3, prev + 0.25))}
                >
                  Zoom In
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={clearCanvas}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button size="sm" variant="default">
                <Save className="w-4 h-4 mr-2" />
                Save Design
              </Button>
              <div className="flex gap-2">
                <Button onClick={toggleViewMode} variant="outline">
                  {viewMode === "design" ? "Switch to Order Entry" : 
                   viewMode === "order" ? "Switch to Excel Transformer" : 
                   "Switch to Design Canvas"}
                </Button>
                <Button 
                  onClick={() => setViewMode("design")} 
                  variant={viewMode === "design" ? "default" : "outline"}
                  size="sm"
                >
                  Design
                </Button>
                <Button 
                  onClick={() => setViewMode("order")} 
                  variant={viewMode === "order" ? "default" : "outline"}
                  size="sm"
                >
                  Order Entry
                </Button>
                <Button 
                  onClick={() => setViewMode("transformer")} 
                  variant={viewMode === "transformer" ? "default" : "outline"}
                  size="sm"
                >
                  Excel Transformer
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-technical-25 dark:bg-technical-950">
          <div 
            ref={canvasRef}
            className="relative w-full min-h-full"
            style={{
              backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
              backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
              transform: `scale(${canvasScale})`,
              transformOrigin: 'top left',
              minWidth: `${100 / canvasScale}%`,
              minHeight: `${100 / canvasScale}%`
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path 
                      d="M 50 0 L 0 0 0 50" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1"
                      className="text-technical-400"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Dropped Components */}
            {droppedComponents.map((component) => (
              <div
                key={component.id}
                className={cn(
                  "absolute cursor-pointer p-3 rounded-lg border-2 bg-white dark:bg-technical-800 shadow-lg transition-all",
                  selectedComponent === component.id 
                    ? "border-primary ring-2 ring-primary/50" 
                    : "border-technical-300 dark:border-technical-600 hover:border-primary/50"
                )}
                style={{
                  left: component.x,
                  top: component.y,
                  transform: `scale(${1 / canvasScale})`
                }}
                onClick={() => handleComponentClick(component.id)}
                onDoubleClick={() => deleteComponent(component.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getComponentIcon(component.type)}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-technical-900 dark:text-technical-100 truncate">
                      {component.name}
                    </div>
                    {component.partNumber && (
                      <div className="text-xs text-technical-600 dark:text-technical-400 font-mono">
                        {component.partNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Drop zone hint */}
            {droppedComponents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-technical-400 dark:text-technical-500">
                  <Grid className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Drop Components Here</p>
                  <p className="text-sm">Drag components from the library to start designing</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedComponentData && (
        <div className="w-80 border-l border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="border-b border-technical-200 dark:border-technical-600">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Component Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-technical-700 dark:text-technical-300">
                  Name
                </label>
                <p className="text-sm text-technical-900 dark:text-technical-100 mt-1">
                  {selectedComponentData.name}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-technical-700 dark:text-technical-300">
                  Type
                </label>
                <p className="text-sm text-technical-900 dark:text-technical-100 mt-1 capitalize">
                  {selectedComponentData.type}
                </p>
              </div>

              {selectedComponentData.partNumber && (
                <div>
                  <label className="text-sm font-medium text-technical-700 dark:text-technical-300">
                    Part Number
                  </label>
                  <p className="text-sm text-technical-900 dark:text-technical-100 mt-1 font-mono">
                    {selectedComponentData.partNumber}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-technical-700 dark:text-technical-300">
                  Position
                </label>
                <p className="text-sm text-technical-900 dark:text-technical-100 mt-1">
                  X: {Math.round(selectedComponentData.x)}px, Y: {Math.round(selectedComponentData.y)}px
                </p>
              </div>

              {selectedComponentData.specifications && Object.keys(selectedComponentData.specifications).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-technical-700 dark:text-technical-300 mb-2 block">
                    Specifications
                  </label>
                  <div className="space-y-2">
                    {Object.entries(selectedComponentData.specifications).slice(0, 5).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-technical-600 dark:text-technical-400">{key}:</span>
                        <span className="text-technical-900 dark:text-technical-100 text-right">
                          {String(value).substring(0, 20)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => deleteComponent(selectedComponentData.id)}
                className="w-full"
              >
                Delete Component
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}