import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MousePointer, Hand, ZoomIn, ZoomOut, Ruler } from "lucide-react";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import type { ElectricalComponent } from "@shared/schema";

interface CanvasComponent {
  id: string;
  component: ElectricalComponent;
  x: number;
  y: number;
  connections: string[];
}

export default function DesignCanvas() {
  const { configuration, addComponent } = useConfiguration();
  const [canvasComponents, setCanvasComponents] = useState<CanvasComponent[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [tool, setTool] = useState<"select" | "pan" | "zoom-in" | "zoom-out">("select");
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    try {
      const componentData = e.dataTransfer.getData("application/json");
      const component: ElectricalComponent = JSON.parse(componentData);
      
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        
        const newCanvasComponent: CanvasComponent = {
          id: `${component.id}_${Date.now()}`,
          component,
          x,
          y,
          connections: [],
        };
        
        setCanvasComponents(prev => [...prev, newCanvasComponent]);
        addComponent(component);
      }
    } catch (error) {
      console.error("Failed to parse dropped component:", error);
    }
  }, [scale, addComponent]);

  const renderWireConnections = () => {
    if (canvasComponents.length < 2) return null;

    const paths = [];
    for (let i = 0; i < canvasComponents.length - 1; i++) {
      const start = canvasComponents[i];
      const end = canvasComponents[i + 1];
      
      paths.push(
        <path
          key={`wire-${i}`}
          d={`M ${start.x + 32} ${start.y + 32} L ${end.x + 32} ${end.y + 32}`}
          className="wire-connection"
          strokeWidth={4}
          stroke="hsl(var(--primary))"
        />
      );
    }

    return paths;
  };

  const getComponentIcon = (component: ElectricalComponent) => {
    const iconMap: Record<string, string> = {
      connector: "🔌",
      protection: "🛡️",
      junction: "📦",
    };
    return iconMap[component.type] || "⚡";
  };

  const getComponentColor = (component: ElectricalComponent) => {
    const colorMap: Record<string, string> = {
      connector: component.category === "input" ? "bg-orange-100 dark:bg-orange-900/30 border-orange-400" : "bg-green-100 dark:bg-green-900/30 border-green-400",
      protection: "bg-blue-100 dark:bg-blue-900/30 border-blue-400",
      junction: "bg-technical-100 dark:bg-technical-800 border-technical-400",
    };
    return colorMap[component.type] || "bg-gray-100 dark:bg-gray-800 border-gray-400";
  };

  return (
    <div className="h-full w-full bg-technical-50 dark:bg-technical-900 rounded-xl shadow-sm border border-technical-200 dark:border-technical-700 relative overflow-hidden">
      {/* Canvas Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="bg-white dark:bg-technical-800 px-3 py-1 rounded-lg shadow-sm border border-technical-200 dark:border-technical-700 flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-technical-700 dark:text-technical-300">
            Scale: 1:{Math.round(10/scale)}
          </span>
        </div>
        <div className="bg-white dark:bg-technical-800 px-3 py-1 rounded-lg shadow-sm border border-technical-200 dark:border-technical-700 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${configuration.isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-medium text-technical-700 dark:text-technical-300">
            {configuration.isValid ? 'Configuration Valid' : 'Needs Validation'}
          </span>
        </div>
      </div>

      {/* Canvas Grid Background */}
      <div 
        className={`absolute inset-0 canvas-grid transition-opacity ${dragOver ? 'opacity-30' : 'opacity-20 dark:opacity-10'}`}
        style={{ 
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      />
      
      {/* Drop Zone */}
      <div
        ref={canvasRef}
        className={`absolute inset-0 ${dragOver ? 'drop-zone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {/* Wire Connections SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {renderWireConnections()}
          {canvasComponents.length > 0 && (
            <text x="50%" y="90%" textAnchor="middle" className="fill-technical-600 dark:fill-technical-400 text-xs font-mono">
              {configuration.wireGauge} AWG - {configuration.voltage}V / {configuration.current}A
            </text>
          )}
        </svg>

        {/* Canvas Components */}
        {canvasComponents.map((canvasComponent) => (
          <div
            key={canvasComponent.id}
            className={`absolute w-16 h-16 ${getComponentColor(canvasComponent.component)} border-2 rounded-lg flex items-center justify-center group hover:shadow-lg transition-all cursor-move component-hover`}
            style={{
              left: canvasComponent.x,
              top: canvasComponent.y,
            }}
            draggable
          >
            <div className="text-xl">
              {getComponentIcon(canvasComponent.component)}
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-technical-600 dark:text-technical-400 whitespace-nowrap">
              {canvasComponent.component.name}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {canvasComponents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-technical-500 dark:text-technical-500">
              <div className="text-4xl mb-4">⚡</div>
              <p className="text-lg font-medium mb-2">Drag components here to start designing</p>
              <p className="text-sm">Build your electrical power whip configuration</p>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Tools */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <Button
          variant={tool === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("select")}
          className="p-2"
        >
          <MousePointer className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === "pan" ? "default" : "outline"}
          size="sm"
          onClick={() => setTool("pan")}
          className="p-2"
        >
          <Hand className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(prev => Math.min(prev * 1.2, 3))}
          className="p-2"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(prev => Math.max(prev / 1.2, 0.5))}
          className="p-2"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
