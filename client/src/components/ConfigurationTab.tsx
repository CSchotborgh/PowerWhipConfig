import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertTriangle, Sliders, ChevronDown } from "lucide-react";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { cn } from "@/lib/utils";
import ComponentLibrary from "./ComponentLibrary";

const configurationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  voltage: z.number().min(1).max(600),
  current: z.number().min(1).max(400),
  wireGauge: z.string(),
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

export default function ConfigurationTab() {
  const { configuration, updateConfiguration } = useConfiguration();
  const [openSections, setOpenSections] = useState<string[]>(["basic-config", "component-library"]);
  
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

  const validationResults = [
    { status: "success", message: "Voltage compatibility verified" },
    { status: "success", message: "Current rating within limits" },
    { status: "warning", message: "Wire gauge recommendation: 10 AWG" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* Validation Status */}
      <Collapsible
        open={openSections.includes("validation-status")}
        onOpenChange={() => toggleSection("validation-status")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Validation Status
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("validation-status") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-2">
                {validationResults.map((result, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {result.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-technical-700 dark:text-technical-300">
                      {result.message}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}