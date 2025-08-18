import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid, Layers, Settings, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import AGGridOrderEntry from "./AGGridOrderEntry";
import VirtualizedOrderEntry from "./VirtualizedOrderEntry";
import PerformanceOrderEntry from "./PerformanceOrderEntry";
import ExcelTransformer from "./ExcelTransformer";
import ExcelFileViewer from "./ExcelFileViewer";
import ExcelLikeInterface from "./ExcelLikeInterface";

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
  const [viewMode, setViewMode] = useState<"design" | "order" | "transformer" | "configurator" | "excel">("design");
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
      if (prev === "transformer") return "configurator";
      if (prev === "configurator") return "excel";
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

  if (viewMode === "configurator") {
    return <ExcelFileViewer onToggleView={toggleViewMode} />;
  }

  if (viewMode === "excel") {
    return <ExcelLikeInterface onToggleView={toggleViewMode} />;
  }

  return (
    <div className="flex-1 flex h-full">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-technical-900">
        {/* Canvas Toolbar - Responsive */}
        <div className="p-2 sm:p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            {/* Top Row - Title and Zoom Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-technical-900 dark:text-technical-100 truncate mr-2">
                {viewMode === "design" ? "Design Canvas" : 
                 viewMode === "order" ? "Order Entry" : 
                 viewMode === "transformer" ? "Excel Transformer" :
                 viewMode === "configurator" ? "Configurator" :
                 "Excel Interface"}
              </h2>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCanvasScale(prev => Math.max(0.25, prev - 0.25))}
                  className="px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Zoom Out</span>
                  <span className="sm:hidden">-</span>
                </Button>
                <span className="text-xs sm:text-sm text-technical-600 dark:text-technical-400 min-w-8 sm:min-w-16 text-center">
                  {Math.round(canvasScale * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCanvasScale(prev => Math.min(3, prev + 0.25))}
                  className="px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Zoom In</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </div>
            </div>
            
            {/* Bottom Row - Action Buttons */}
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button size="sm" variant="outline" onClick={clearCanvas} className="px-2 sm:px-3">
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
                <Button size="sm" variant="default" className="px-2 sm:px-3">
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
              
              {/* Mode Buttons - Responsive */}
              <div className="flex gap-1">
                <Button 
                  onClick={() => setViewMode("design")} 
                  variant={viewMode === "design" ? "default" : "outline"}
                  size="sm"
                  className="px-2 sm:px-3 text-xs sm:text-sm"
                >
                  Design
                </Button>
                <Button 
                  onClick={() => setViewMode("order")} 
                  variant={viewMode === "order" ? "default" : "outline"}
                  size="sm"
                  className="px-2 sm:px-3 text-xs sm:text-sm"
                >
                  Order
                </Button>
                <Button 
                  onClick={() => setViewMode("transformer")} 
                  variant={viewMode === "transformer" ? "default" : "outline"}
                  size="sm"
                  className="px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Transformer</span>
                  <span className="sm:hidden">Excel</span>
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

      {/* Properties Panel - Responsive */}
      {selectedComponentData && (
        <div className="w-64 sm:w-72 lg:w-80 border-l border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 flex-shrink-0">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="border-b border-technical-200 dark:border-technical-600 p-3 sm:p-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="truncate">Component Properties</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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