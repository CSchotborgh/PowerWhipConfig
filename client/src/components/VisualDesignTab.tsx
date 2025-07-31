import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, ZoomIn, ZoomOut, Move, Hand, ChevronDown, Database, Layers, Layout, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import EnhancedComponentLibrary from "./EnhancedComponentLibrary";
import DesignCanvas from "./DesignCanvas";
import AGGridOrderEntry from "./AGGridOrderEntry";

export default function VisualDesignTab() {
  const [openSections, setOpenSections] = useState<string[]>(["canvas-tools", "lookup-library"]);
  const [viewMode, setViewMode] = useState<"design" | "order">("design");

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <Collapsible
        open={openSections.includes("canvas-tools")}
        onOpenChange={() => toggleSection("canvas-tools")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-primary" />
                  Canvas Tools
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("canvas-tools") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="flex items-center justify-center">
                  <Move className="w-4 h-4 mr-2" />
                  Select
                </Button>
                <Button variant="outline" size="sm" className="flex items-center justify-center">
                  <Hand className="w-4 h-4 mr-2" />
                  Pan
                </Button>
                <Button variant="outline" size="sm" className="flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 mr-2" />
                  Zoom In
                </Button>
                <Button variant="outline" size="sm" className="flex items-center justify-center">
                  <ZoomOut className="w-4 h-4 mr-2" />
                  Zoom Out
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={openSections.includes("layer-management")}
        onOpenChange={() => toggleSection("layer-management")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <span>Layer Management</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("layer-management") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-technical-700 dark:text-technical-300">Components</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-technical-700 dark:text-technical-300">Wires</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-technical-700 dark:text-technical-300">Labels</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-technical-700 dark:text-technical-300">Grid</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={openSections.includes("lookup-library")}
        onOpenChange={() => toggleSection("lookup-library")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <Database className="w-4 h-4 mr-2 text-primary" />
                  Lookup Component Library
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("lookup-library") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-hidden">
                <EnhancedComponentLibrary />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible
        open={openSections.includes("view-options")}
        onOpenChange={() => toggleSection("view-options")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <span>View Options</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("view-options") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-technical-700 dark:text-technical-300 mb-1">
                  Scale
                </label>
                <select 
                  className="w-full px-3 py-2 border border-technical-300 dark:border-technical-600 rounded-lg bg-white dark:bg-technical-800"
                  defaultValue="1:10"
                >
                  <option value="1:1">1:1</option>
                  <option value="1:5">1:5</option>
                  <option value="1:10">1:10</option>
                  <option value="1:20">1:20</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-technical-700 dark:text-technical-300 mb-1">
                  Units
                </label>
                <select 
                  className="w-full px-3 py-2 border border-technical-300 dark:border-technical-600 rounded-lg bg-white dark:bg-technical-800"
                  defaultValue="Inches"
                >
                  <option value="Inches">Inches</option>
                  <option value="Feet">Feet</option>
                  <option value="Millimeters">Millimeters</option>
                  <option value="Centimeters">Centimeters</option>
                </select>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
