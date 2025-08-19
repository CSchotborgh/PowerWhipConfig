import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDesignCanvas } from "@/contexts/DesignCanvasContext";

export function DesignCanvasExportButton() {
  const { toast } = useToast();
  const { droppedComponents } = useDesignCanvas();

  const handleExportDesignCanvas = async () => {
    try {
      console.log('Exporting Design Canvas components:', droppedComponents);
      
      if (droppedComponents.length === 0) {
        toast({
          title: "No Components",
          description: "Add components to the Design Canvas before exporting",
          variant: "destructive"
        });
        return;
      }

      // Call dedicated Design Canvas export endpoint
      const response = await fetch('/api/design-canvas/export-xlsx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          components: droppedComponents,
          exportType: 'design-canvas-output'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'DesignCanvasOutput.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `DesignCanvasOutput.xlsx downloaded with ${droppedComponents.length} components`,
      });

    } catch (error) {
      console.error('Design Canvas export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Failed to export Design Canvas',
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={handleExportDesignCanvas}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
    >
      <FileSpreadsheet className="h-4 w-4" />
      Export Design Canvas
      {droppedComponents.length > 0 && (
        <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
          {droppedComponents.length}
        </span>
      )}
    </Button>
  );
}