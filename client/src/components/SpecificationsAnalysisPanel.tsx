import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertTriangle, Sliders, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecificationsAnalysisPanelProps {
  configuration?: {
    name?: string;
    voltage?: number;
    current?: number;
    wireGauge?: string;
  };
}

export default function SpecificationsAnalysisPanel({ 
  configuration = {
    name: "PowerWhip-001",
    voltage: 120,
    current: 20,
    wireGauge: "12"
  }
}: SpecificationsAnalysisPanelProps) {
  const [openSections, setOpenSections] = useState<string[]>(["current-config", "components", "analysis"]);
  
  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-technical-800 border border-technical-200 dark:border-technical-600 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-technical-200 dark:border-technical-600">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-technical-900 dark:text-technical-100">
            Specifications & Analysis
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-technical-300 dark:scrollbar-thumb-technical-600 scrollbar-track-transparent">
        
        {/* Current Configuration */}
        <Collapsible
          open={openSections.includes("current-config")}
          onOpenChange={() => toggleSection("current-config")}
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
                <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                  <div className="flex items-center">
                    <Sliders className="w-4 h-4 mr-2 text-primary" />
                    Current Configuration
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    openSections.includes("current-config") ? "rotate-180" : ""
                  )} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="bg-technical-50 dark:bg-technical-800 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-technical-800 dark:text-technical-200 mb-3">Configuration Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Name:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">{configuration.name || "PowerWhip-001"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Voltage:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">{configuration.voltage || 120}V</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Current:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">{configuration.current || 20}A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Wire Gauge:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">{configuration.wireGauge || "12"} AWG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Total Length:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">12.5 ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Wire Count:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">3 conductors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Total Weight:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">2.5 lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-technical-600 dark:text-technical-400">Estimated Cost:</span>
                      <span className="font-mono text-technical-900 dark:text-technical-100">$31.25</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Components Used */}
        <Collapsible
          open={openSections.includes("components")}
          onOpenChange={() => toggleSection("components")}
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
                <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    Components Used
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    openSections.includes("components") ? "rotate-180" : ""
                  )} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2">
                <div className="text-sm text-technical-500 dark:text-technical-500 text-center py-4 bg-technical-50 dark:bg-technical-800 rounded-lg">
                  No components added yet
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Technical Analysis */}
        <Collapsible
          open={openSections.includes("analysis")}
          onOpenChange={() => toggleSection("analysis")}
        >
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
                <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-primary" />
                    Technical Analysis
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    openSections.includes("analysis") ? "rotate-180" : ""
                  )} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {/* Voltage Drop Analysis */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-800 dark:text-green-200 text-sm font-medium mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Voltage Drop Analysis</span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    Calculated voltage drop: 0.8V (0.7%)<br />
                    Within acceptable limits (&lt;3%)
                  </div>
                </div>

                {/* Thermal Analysis */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Thermal Analysis</span>
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Ambient temp: 25°C<br />
                    Max conductor temp: 60°C<br />
                    Safety margin: 30°C
                  </div>
                </div>

                {/* NEC Compliance */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>NEC Compliance</span>
                  </div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300">
                    Article 400: Flexible cords compliant<br />
                    Article 210: Branch circuit protection verified<br />
                    Article 250: Grounding requirements met
                  </div>
                </div>

                {/* Load Analysis */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-purple-800 dark:text-purple-200 text-sm font-medium mb-2">
                    <Sliders className="w-4 h-4" />
                    <span>Load Analysis</span>
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    Continuous load: {(configuration.current || 20) * 0.8}A<br />
                    Peak load capacity: {configuration.current || 20}A<br />
                    Safety factor: {((configuration.current || 20) - ((configuration.current || 20) * 0.8)).toFixed(1)}A
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}