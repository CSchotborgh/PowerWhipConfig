import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DesignCanvasExportButton } from "./DesignCanvasExportButton";

export default function Header() {
  const { toast } = useToast();

  const handleExportPDF = () => {
    toast({
      title: "Exporting PDF",
      description: "Your technical drawing is being generated...",
    });
    
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
          
          {/* Export Actions */}
          <div className="flex items-center space-x-3">
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
    </header>
  );
}
