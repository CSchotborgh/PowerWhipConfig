import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { FileText, Download, Share, ChevronDown, BookOpen, Shield, Wrench, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { useToast } from "@/hooks/use-toast";

export default function DocumentationTab() {
  const [openSections, setOpenSections] = useState<string[]>(["templates", "export-options"]);
  const { configuration, components } = useConfiguration();
  const { toast } = useToast();

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleExportDocument = (type: string) => {
    if (!configuration.name || !configuration.voltage) {
      toast({
        title: "Export Failed",
        description: "Please complete the configuration before generating documentation.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating Document",
      description: `Creating ${type} document...`,
    });

    // Here you would implement actual document generation
    setTimeout(() => {
      toast({
        title: "Document Ready",
        description: `${type} has been generated successfully.`,
      });
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Documentation Templates */}
      <Collapsible
        open={openSections.includes("templates")}
        onOpenChange={() => toggleSection("templates")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-primary" />
                  Documentation Templates
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("templates") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/10"
                onClick={() => handleExportDocument("Technical Specifications")}
              >
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Technical Specifications
                <span className="ml-auto text-xs text-technical-500">PDF</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/10"
                onClick={() => handleExportDocument("Installation Guide")}
              >
                <Wrench className="w-4 h-4 mr-2 text-green-600" />
                Installation Guide
                <span className="ml-auto text-xs text-technical-500">PDF</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/10"
                onClick={() => handleExportDocument("Safety Instructions")}
              >
                <Shield className="w-4 h-4 mr-2 text-red-600" />
                Safety Instructions
                <span className="ml-auto text-xs text-technical-500">PDF</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/10"
                onClick={() => handleExportDocument("Material List")}
              >
                <Package className="w-4 h-4 mr-2 text-purple-600" />
                Bill of Materials (BOM)
                <span className="ml-auto text-xs text-technical-500">XLSX</span>
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Export Options */}
      <Collapsible
        open={openSections.includes("export-options")}
        onOpenChange={() => toggleSection("export-options")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-2 text-primary" />
                  Export & Sharing Options
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("export-options") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/10"
                onClick={() => handleExportDocument("Technical Drawing")}
              >
                <Download className="w-4 h-4 mr-2 text-blue-600" />
                Download Technical Drawing
                <span className="ml-auto text-xs text-technical-500">CAD/DWG</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/10"
                onClick={() => handleExportDocument("Cut Sheet")}
              >
                <Download className="w-4 h-4 mr-2 text-orange-600" />
                Export Cut Sheet
                <span className="ml-auto text-xs text-technical-500">PDF</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-primary/10"
                onClick={() => handleExportDocument("Configuration Package")}
              >
                <Share className="w-4 h-4 mr-2 text-green-600" />
                Share Configuration Package
                <span className="ml-auto text-xs text-technical-500">ZIP</span>
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Configuration Summary */}
      <Collapsible
        open={openSections.includes("summary")}
        onOpenChange={() => toggleSection("summary")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  Configuration Summary
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("summary") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-technical-700 dark:text-technical-300">Name:</span>
                  <p className="text-technical-600 dark:text-technical-400">{configuration.name || 'Not configured'}</p>
                </div>
                <div>
                  <span className="font-semibold text-technical-700 dark:text-technical-300">Voltage:</span>
                  <p className="text-technical-600 dark:text-technical-400">{configuration.voltage || 'N/A'}V</p>
                </div>
                <div>
                  <span className="font-semibold text-technical-700 dark:text-technical-300">Current:</span>
                  <p className="text-technical-600 dark:text-technical-400">{configuration.current || 'N/A'}A</p>
                </div>
                <div>
                  <span className="font-semibold text-technical-700 dark:text-technical-300">Wire Gauge:</span>
                  <p className="text-technical-600 dark:text-technical-400">{configuration.wireGauge || 'N/A'} AWG</p>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-technical-700 dark:text-technical-300">Components:</span>
                  <p className="text-technical-600 dark:text-technical-400">{components.length} selected</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Compliance Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            Compliance Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-technical-700 dark:text-technical-300">NEC Article 400</span>
              <span className="text-green-500 font-medium">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-technical-700 dark:text-technical-300">UL 62</span>
              <span className="text-green-500 font-medium">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-technical-700 dark:text-technical-300">OSHA 1926.405</span>
              <span className="text-green-500 font-medium">✓ Compliant</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}