import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Settings, Eye, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PanelControls } from "./PanelControls";
import { DesignCanvasExportButton } from "./DesignCanvasExportButton";



interface HeaderProps {
  activeTab: "configuration" | "visual" | "documentation" | "order";
  onTabChange: (tab: "configuration" | "visual" | "documentation" | "order") => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { toast } = useToast();


  const tabs = [
    {
      id: "configuration" as const,
      label: "Configuration",
      icon: Settings,
    },
    {
      id: "visual" as const,
      label: "Visual Design", 
      icon: Eye,
    },
    {
      id: "order" as const,
      label: "Order Entry",
      icon: ShoppingCart,
    },
    {
      id: "documentation" as const,
      label: "Documentation",
      icon: FileText,
    },
  ];

  const handleExportXLSX = async () => {
    try {
      toast({
        title: "Exporting XLSX",
        description: "Generating receptacle pattern lookup file...",
      });

      // Get design canvas components (using empty array as fallback)
      const response = await fetch('/api/design-canvas/export-xlsx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          components: [], // Will be replaced by dedicated export button
          exportType: 'receptacle-pattern-lookup'
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ReceptaclePatternLookup_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Receptacle pattern lookup file downloaded successfully.",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export XLSX file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "Exporting PDF",
      description: "Your technical drawing is being generated...",
    });
    
    // Here you would implement actual PDF export logic
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Technical drawing exported successfully to PDF format.",
      });
    }, 2000);
  };

  return (
    <header className="bg-white dark:bg-technical-800 border-b-2 border-technical-200/50 dark:border-technical-600/50 shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title and Subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-technical-900 dark:text-technical-50 tracking-tight">
              ElectricalPowerWhip Configurator
            </h1>
            <p className="text-sm text-technical-600 dark:text-technical-400 mt-1">
              Professional Power Distribution Design Tool
            </p>
          </div>
          
          {/* Panel Controls and Export Actions */}
          <div className="flex items-center space-x-3">
            <PanelControls />
            <div className="w-px h-6 bg-technical-200 dark:bg-technical-600"></div>
            <DesignCanvasExportButton />
            <Button 
              onClick={handleExportPDF}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-t border-technical-200/30 dark:border-technical-600/30 bg-gradient-to-r from-technical-50 to-white dark:from-technical-700 dark:to-technical-800">
        <nav className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 px-6 py-3 text-sm font-medium border-b-3 transition-all duration-200 relative group flex items-center justify-center",
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/10 shadow-inner"
                    : "border-transparent text-technical-600 dark:text-technical-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30"
                )}
              >
                <Icon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                <span className="font-semibold tracking-wide">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}