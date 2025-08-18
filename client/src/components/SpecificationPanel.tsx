import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClipboardList, Thermometer, Zap, ChevronDown } from "lucide-react";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { calculateVoltageDrops, calculateThermalAnalysis } from "@/lib/electricalCalculations";
import { cn } from "@/lib/utils";

interface SpecificationPanelProps {
  isExpanded: boolean;
}

export default function SpecificationPanel({ isExpanded }: SpecificationPanelProps) {
  const { configuration, components } = useConfiguration();
  const [openSections, setOpenSections] = useState<string[]>(["current-config", "component-list"]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const voltageDrops = calculateVoltageDrops({
    voltage: configuration.voltage || 120,
    current: configuration.current || 20,
    wireGauge: configuration.wireGauge || "12",
    totalLength: configuration.totalLength || 12.5,
  });
  const thermalAnalysis = calculateThermalAnalysis({
    voltage: configuration.voltage || 120,
    current: configuration.current || 20,
    wireGauge: configuration.wireGauge || "12",
    totalLength: configuration.totalLength || 12.5,
  });
  
  const totalLength = 12.5; // Calculate based on actual component positions
  const wireCount = 3; // Based on configuration
  const totalWeight = components.length * 0.5 + totalLength * 0.2; // Simplified calculation
  const estimatedCost = components.reduce((sum, comp) => sum + (comp.price || 0), 0) + totalLength * 2.5;

  return (
    <div className={cn(
      "bg-white dark:bg-technical-800 border-l border-technical-200 dark:border-technical-700 flex flex-col transition-all duration-300 ease-in-out max-h-screen h-full",
      !isExpanded && "w-12"
    )}>
      <div className="p-4 border-b border-technical-200 dark:border-technical-700">
        <h3 className="font-semibold text-technical-900 dark:text-technical-100 flex items-center">
          <ClipboardList className="w-4 h-4 mr-2 text-primary" />
          {isExpanded && "Configuration Details"}
        </h3>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-technical-300 dark:scrollbar-thumb-technical-600 scrollbar-track-transparent touch-scroll relative">
        <div className="block md:hidden absolute top-2 right-2 text-xs text-technical-500 bg-technical-100 dark:bg-technical-700 px-2 py-1 rounded animate-pulse">
          Swipe to scroll ↕
        </div>
        {/* Current Configuration */}
        <Collapsible
          open={openSections.includes("current-config")}
          onOpenChange={() => toggleSection("current-config")}
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
                <CardTitle className="flex items-center justify-between text-sm text-technical-800 dark:text-technical-200">
                  <span>Current Configuration</span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    openSections.includes("current-config") ? "rotate-180" : ""
                  )} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="bg-technical-50 dark:bg-technical-800 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-technical-600 dark:text-technical-400">Total Length:</span>
                    <span className="font-mono text-technical-900 dark:text-technical-100">
                      {totalLength.toFixed(1)} ft
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-technical-600 dark:text-technical-400">Wire Count:</span>
                    <span className="font-mono text-technical-900 dark:text-technical-100">
                      {wireCount} conductors
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-technical-600 dark:text-technical-400">Total Weight:</span>
                    <span className="font-mono text-technical-900 dark:text-technical-100">
                      {totalWeight.toFixed(1)} lbs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-technical-600 dark:text-technical-400">Estimated Cost:</span>
                    <span className="font-mono text-technical-900 dark:text-technical-100">
                      ${estimatedCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Component List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-technical-800 dark:text-technical-200">
              Components Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {components.length === 0 ? (
                <div className="text-sm text-technical-500 dark:text-technical-500 text-center py-4">
                  No components added yet
                </div>
              ) : (
                components.map((component, index) => (
                  <div
                    key={`${component.id}-${index}`}
                    className="flex items-center justify-between p-2 bg-technical-50 dark:bg-technical-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${
                        component.type === 'connector' ? 'text-orange-500' :
                        component.type === 'protection' ? 'text-blue-500' :
                        'text-technical-500'
                      }`}>
                        {component.type === 'connector' ? '🔌' :
                         component.type === 'protection' ? '🛡️' : '📦'}
                      </span>
                      <span className="text-sm font-medium">{component.name}</span>
                    </div>
                    <span className="text-xs text-technical-600 dark:text-technical-400">
                      ${component.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Technical Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-technical-800 dark:text-technical-200">
              Technical Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200 text-sm font-medium mb-2">
                <Zap className="w-4 h-4" />
                <span>Voltage Drop Analysis</span>
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Calculated voltage drop: {voltageDrops.drop.toFixed(1)}V ({voltageDrops.percentage.toFixed(1)}%)<br />
                {voltageDrops.percentage < 3 ? 'Within acceptable limits (<3%)' : 'Exceeds recommended limits'}
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm font-medium mb-2">
                <Thermometer className="w-4 h-4" />
                <span>Thermal Analysis</span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Ambient temp: {thermalAnalysis.ambientTemp}°C<br />
                Max conductor temp: {thermalAnalysis.conductorTemp}°C<br />
                Safety margin: {thermalAnalysis.safetyMargin}°C
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}
      
      {/* Collapsed State */}
      {!isExpanded && (
        <div className="flex-1 flex flex-col items-center justify-center p-2 space-y-4">
          <div className="text-technical-400 dark:text-technical-500 text-xs text-center">
            <ClipboardList className="w-6 h-6 mx-auto mb-1" />
            <div className="text-[10px] leading-tight">
              Config<br />Details
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
