import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, FileSpreadsheet, FileText, Save } from "lucide-react";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { exportToXLSX, exportToPDF } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import type { PowerWhipConfiguration } from "@shared/schema";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { configuration, components, saveConfiguration } = useConfiguration();
  const { toast } = useToast();

  const handleExportXLSX = async () => {
    try {
      if (!configuration.name || !configuration.voltage || !configuration.current) {
        toast({
          title: "Export Failed",
          description: "Please complete the configuration before exporting.",
          variant: "destructive",
        });
        return;
      }
      
      const exportData = {
        configuration: configuration as PowerWhipConfiguration,
        components
      };
      await exportToXLSX(exportData);
      toast({
        title: "Export Successful",
        description: "Configuration exported to XLSX format.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export configuration to XLSX.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!configuration.name || !configuration.voltage || !configuration.current) {
        toast({
          title: "Export Failed",
          description: "Please complete the configuration before exporting.",
          variant: "destructive",
        });
        return;
      }
      
      const exportData = {
        configuration: configuration as PowerWhipConfiguration,
        components
      };
      await exportToPDF(exportData);
      toast({
        title: "Export Successful",
        description: "Configuration exported to PDF format.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export configuration to PDF.",
        variant: "destructive",
      });
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      await saveConfiguration();
      toast({
        title: "Configuration Saved",
        description: "Your power whip configuration has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white dark:bg-technical-800 shadow-sm border-b border-technical-200 dark:border-technical-700 sticky top-0 z-50">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-technical-900 dark:text-technical-50">
                  ElectricalPowerWhip Configurator
                </h1>
                <p className="text-sm text-technical-600 dark:text-technical-400">
                  Professional Power Distribution Design Tool
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-technical-600" />
              )}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleExportXLSX}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export XLSX
              </Button>
              
              <Button
                onClick={handleExportPDF}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              
              <Button
                onClick={handleSaveConfiguration}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Config
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
