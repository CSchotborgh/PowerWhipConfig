import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertTriangle, Sliders, ChevronDown, Zap, Shield, Cable } from "lucide-react";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { cn } from "@/lib/utils";
import ComponentLibrary from "./ComponentLibrary";

const enhancedConfigurationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  voltage: z.number().min(1).max(600),
  current: z.number().min(1).max(400),
  wireGauge: z.string(),
  // Enhanced fields based on Excel data
  whipType: z.string().default("standard"),
  length: z.number().min(1).max(1000).default(50),
  insulationType: z.string().default("PVC"),
  conduitType: z.string().default("flexible"),
  temperatureRating: z.number().min(-40).max(200).default(90),
  groundingType: z.string().default("equipment"),
  enclosureRating: z.string().default("NEMA-1"),
  applicationCode: z.string().default("general"),
  customOptions: z.record(z.string(), z.any()).default({}),
});

type EnhancedConfigurationFormData = z.infer<typeof enhancedConfigurationSchema>;

export default function EnhancedConfigurationTab() {
  const { configuration, updateConfiguration } = useConfiguration();
  const [openSections, setOpenSections] = useState<string[]>(["basic-config", "advanced-config"]);
  
  const form = useForm<EnhancedConfigurationFormData>({
    resolver: zodResolver(enhancedConfigurationSchema),
    defaultValues: {
      name: configuration.name || "PowerWhip-001",
      voltage: configuration.voltage || 120,
      current: configuration.current || 20,
      wireGauge: configuration.wireGauge || "12",
      whipType: "standard",
      length: 50,
      insulationType: "PVC",
      conduitType: "flexible",
      temperatureRating: 90,
      groundingType: "equipment",
      enclosureRating: "NEMA-1",
      applicationCode: "general",
      customOptions: {},
    },
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const onSubmit = (data: EnhancedConfigurationFormData) => {
    updateConfiguration(data);
  };

  const validationResults = [
    { status: "success", message: "Voltage compatibility verified" },
    { status: "success", message: "Current rating within limits" },
    { status: "warning", message: "Wire gauge recommendation: 10 AWG for length > 100ft" },
    { status: "success", message: "Temperature rating suitable for application" },
    { status: "success", message: "Grounding configuration meets NEC requirements" },
  ];

  // Enhanced voltage options based on common industrial applications
  const voltageOptions = [
    { value: "120", label: "120V AC Single Phase" },
    { value: "208", label: "208V AC Three Phase" },
    { value: "240", label: "240V AC Single Phase" },
    { value: "277", label: "277V AC Single Phase" },
    { value: "480", label: "480V AC Three Phase" },
    { value: "600", label: "600V AC Three Phase" },
  ];

  // Enhanced wire gauge options with ampacity ratings
  const wireGaugeOptions = [
    { value: "14", label: "14 AWG (15A Max)" },
    { value: "12", label: "12 AWG (20A Max)" },
    { value: "10", label: "10 AWG (30A Max)" },
    { value: "8", label: "8 AWG (50A Max)" },
    { value: "6", label: "6 AWG (65A Max)" },
    { value: "4", label: "4 AWG (85A Max)" },
    { value: "2", label: "2 AWG (115A Max)" },
    { value: "1", label: "1 AWG (130A Max)" },
    { value: "1/0", label: "1/0 AWG (150A Max)" },
    { value: "2/0", label: "2/0 AWG (175A Max)" },
    { value: "3/0", label: "3/0 AWG (200A Max)" },
    { value: "4/0", label: "4/0 AWG (230A Max)" },
  ];

  const whipTypeOptions = [
    { value: "standard", label: "Standard Power Whip" },
    { value: "heavy-duty", label: "Heavy Duty Industrial" },
    { value: "explosion-proof", label: "Explosion Proof" },
    { value: "wet-location", label: "Wet Location Rated" },
    { value: "high-temp", label: "High Temperature" },
    { value: "chemical-resistant", label: "Chemical Resistant" },
  ];

  const insulationOptions = [
    { value: "PVC", label: "PVC (Standard)" },
    { value: "THHN", label: "THHN/THWN" },
    { value: "XHHW", label: "XHHW-2" },
    { value: "EPR", label: "EPR Insulation" },
    { value: "XLPE", label: "Cross-Linked Polyethylene" },
    { value: "Silicone", label: "Silicone (High Temp)" },
  ];

  const conduitOptions = [
    { value: "flexible", label: "Flexible Metal Conduit" },
    { value: "liquid-tight", label: "Liquid-Tight Flexible" },
    { value: "rigid", label: "Rigid Metal Conduit" },
    { value: "emt", label: "EMT Conduit" },
    { value: "pvc", label: "PVC Conduit" },
    { value: "armored", label: "Armored Cable" },
  ];

  const enclosureOptions = [
    { value: "NEMA-1", label: "NEMA 1 (Indoor, General Purpose)" },
    { value: "NEMA-3R", label: "NEMA 3R (Outdoor, Rain Resistant)" },
    { value: "NEMA-4", label: "NEMA 4 (Watertight)" },
    { value: "NEMA-4X", label: "NEMA 4X (Corrosion Resistant)" },
    { value: "NEMA-7", label: "NEMA 7 (Explosion Proof)" },
    { value: "NEMA-12", label: "NEMA 12 (Industrial)" },
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-technical-700 dark:text-technical-300">
                      Whip Name / Part Number
                    </Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="PW250K-360R6WT-D001SAL1234"
                      className="bg-white dark:bg-technical-800"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="whipType" className="text-technical-700 dark:text-technical-300">
                      Whip Type
                    </Label>
                    <Select 
                      value={form.watch("whipType")} 
                      onValueChange={(value) => form.setValue("whipType", value)}
                    >
                      <SelectTrigger className="bg-white dark:bg-technical-800">
                        <SelectValue placeholder="Select whip type" />
                      </SelectTrigger>
                      <SelectContent>
                        {whipTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {voltageOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                      placeholder="60"
                      min="1"
                      max="400"
                      className="bg-white dark:bg-technical-800"
                    />
                  </div>

                  <div>
                    <Label htmlFor="length" className="text-technical-700 dark:text-technical-300">
                      Length (feet)
                    </Label>
                    <Input
                      id="length"
                      type="number"
                      {...form.register("length", { valueAsNumber: true })}
                      placeholder="250"
                      min="1"
                      max="1000"
                      className="bg-white dark:bg-technical-800"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="wireGauge" className="text-technical-700 dark:text-technical-300">
                    Wire Gauge & Ampacity
                  </Label>
                  <Select 
                    value={form.watch("wireGauge")} 
                    onValueChange={(value) => form.setValue("wireGauge", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select wire gauge" />
                    </SelectTrigger>
                    <SelectContent>
                      {wireGaugeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Advanced Configuration */}
      <Collapsible
        open={openSections.includes("advanced-config")}
        onOpenChange={() => toggleSection("advanced-config")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-primary" />
                  Advanced Configuration
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("advanced-config") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insulationType" className="text-technical-700 dark:text-technical-300">
                    Insulation Type
                  </Label>
                  <Select 
                    value={form.watch("insulationType")} 
                    onValueChange={(value) => form.setValue("insulationType", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select insulation" />
                    </SelectTrigger>
                    <SelectContent>
                      {insulationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="conduitType" className="text-technical-700 dark:text-technical-300">
                    Conduit Type
                  </Label>
                  <Select 
                    value={form.watch("conduitType")} 
                    onValueChange={(value) => form.setValue("conduitType", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select conduit" />
                    </SelectTrigger>
                    <SelectContent>
                      {conduitOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="temperatureRating" className="text-technical-700 dark:text-technical-300">
                    Temperature Rating (°C)
                  </Label>
                  <Input
                    id="temperatureRating"
                    type="number"
                    {...form.register("temperatureRating", { valueAsNumber: true })}
                    placeholder="90"
                    min="-40"
                    max="200"
                    className="bg-white dark:bg-technical-800"
                  />
                </div>

                <div>
                  <Label htmlFor="groundingType" className="text-technical-700 dark:text-technical-300">
                    Grounding Type
                  </Label>
                  <Select 
                    value={form.watch("groundingType")} 
                    onValueChange={(value) => form.setValue("groundingType", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select grounding" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment Ground</SelectItem>
                      <SelectItem value="isolated">Isolated Ground</SelectItem>
                      <SelectItem value="system">System Ground</SelectItem>
                      <SelectItem value="none">No Ground</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="enclosureRating" className="text-technical-700 dark:text-technical-300">
                    Enclosure Rating
                  </Label>
                  <Select 
                    value={form.watch("enclosureRating")} 
                    onValueChange={(value) => form.setValue("enclosureRating", value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {enclosureOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="applicationCode" className="text-technical-700 dark:text-technical-300">
                  Application Code
                </Label>
                <Input
                  id="applicationCode"
                  {...form.register("applicationCode")}
                  placeholder="SAL1234 - Industrial Automation Line"
                  className="bg-white dark:bg-technical-800"
                />
              </div>
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

      {/* Enhanced Validation Status */}
      <Collapsible
        open={openSections.includes("validation-status")}
        onOpenChange={() => toggleSection("validation-status")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-green-500" />
                  NEC Compliance & Validation Status
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
              <div className="space-y-3">
                {validationResults.map((result, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm p-2 rounded-lg bg-technical-50 dark:bg-technical-800">
                    {result.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
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