import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertTriangle, Sliders, ChevronDown, Database } from "lucide-react";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { cn } from "@/lib/utils";
import ComponentLibrary from "./ComponentLibrary";
import { validateConfiguration, calculateVoltageDrops, calculateThermalAnalysis } from "@/lib/electricalCalculations";
import { ValidationOptions } from "./ValidationOptions";


const configurationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  voltage: z.number().min(1).max(600),
  current: z.number().min(1).max(400),
  wireGauge: z.string(),
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

export default function ConfigurationTab() {
  const { configuration, updateConfiguration } = useConfiguration();
  const [openSections, setOpenSections] = useState<string[]>(["basic-config", "component-library", "validation-status"]);
  const [validationMode, setValidationMode] = useState<"live" | "static" | "hidden">("live");
  
  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      name: configuration.name || "PowerWhip-001",
      voltage: configuration.voltage || 120,
      current: configuration.current || 20,
      wireGauge: configuration.wireGauge || "12",
    },
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const onSubmit = (data: ConfigurationFormData) => {
    updateConfiguration(data);
  };

  // Real-time validation using electrical calculations
  const currentConfig = {
    voltage: configuration.voltage || 120,
    current: configuration.current || 20,
    wireGauge: configuration.wireGauge || "12",
    totalLength: 12.5, // Default length, could be from design canvas
  };

  const validation = validateConfiguration(currentConfig);
  const voltageDrops = calculateVoltageDrops(currentConfig);
  const thermalAnalysis = calculateThermalAnalysis(currentConfig);

  // Generate dynamic validation results
  const validationResults = [
    {
      status: validation.isValid ? "success" : "error",
      message: validation.isValid ? "Configuration validated successfully" : "Configuration has validation errors"
    },
    {
      status: voltageDrops.percentage <= 3 ? "success" : voltageDrops.percentage <= 5 ? "warning" : "error",
      message: `Voltage drop: ${voltageDrops.percentage.toFixed(1)}% (${voltageDrops.percentage <= 3 ? "Excellent" : voltageDrops.percentage <= 5 ? "Acceptable" : "Exceeds limit"})`
    },
    {
      status: thermalAnalysis.withinLimits && thermalAnalysis.safetyMargin >= 20 ? "success" : thermalAnalysis.withinLimits ? "warning" : "error",
      message: `Thermal margin: ${thermalAnalysis.safetyMargin.toFixed(1)}°C (${thermalAnalysis.withinLimits ? "Safe" : "Unsafe"})`
    },
    ...validation.warnings.map(warning => ({ status: "warning" as const, message: warning })),
    ...validation.errors.map(error => ({ status: "error" as const, message: error }))
  ];

  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-technical-300 dark:scrollbar-thumb-technical-600 scrollbar-track-transparent touch-scroll mobile-scroll-indicator relative">
      {/* Basic Configuration */}
      <Collapsible
        open={openSections.includes("basic-config")}
        onOpenChange={() => toggleSection("basic-config")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <Sliders className="w-4 h-4 mr-2 text-primary" />
                  Basic Configuration
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("basic-config") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-technical-700 dark:text-technical-300">
                    Whip Name
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="PowerWhip-001"
                    className="bg-white dark:bg-technical-800"
                  />
                </div>
                
                <div>
                  <Label htmlFor="voltage" className="text-technical-700 dark:text-technical-300">
                    Voltage Rating
                  </Label>
                  <Select 
                    value={form.watch("voltage")?.toString()} 
                    onValueChange={(value) => form.setValue("voltage", parseInt(value))}
                  >
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select voltage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="120">120V AC</SelectItem>
                      <SelectItem value="240">240V AC</SelectItem>
                      <SelectItem value="480">480V AC</SelectItem>
                      <SelectItem value="208">208V AC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="current" className="text-technical-700 dark:text-technical-300">
                    Current Rating (A)
                  </Label>
                  <Input
                    id="current"
                    type="number"
                    {...form.register("current", { valueAsNumber: true })}
                    placeholder="20"
                    min="1"
                    max="400"
                    className="bg-white dark:bg-technical-800"
                  />
                </div>
                
                <div>
                  <Label htmlFor="wireGauge" className="text-technical-700 dark:text-technical-300">
                    Wire Gauge
                  </Label>
                  <Select 
                    value={form.watch("wireGauge")} 
                    onValueChange={(value) => form.setValue("wireGauge", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select wire gauge" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 AWG</SelectItem>
                      <SelectItem value="10">10 AWG</SelectItem>
                      <SelectItem value="8">8 AWG</SelectItem>
                      <SelectItem value="6">6 AWG</SelectItem>
                      <SelectItem value="4">4 AWG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Component Library */}
      <Collapsible
        open={openSections.includes("component-library")}
        onOpenChange={() => toggleSection("component-library")}
      >
        <ComponentLibrary />
      </Collapsible>



      {/* Validation Status with Mode Options */}
      {validationMode !== "hidden" && (
        <Collapsible
          open={openSections.includes("validation-status")}
          onOpenChange={() => toggleSection("validation-status")}
        >
          <ValidationOptions
            mode={validationMode}
            onModeChange={setValidationMode}
            validationResults={validationResults}
          />
        </Collapsible>
      )}


      </div>
    </div>
  );
}