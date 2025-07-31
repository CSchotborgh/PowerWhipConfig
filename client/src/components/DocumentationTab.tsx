import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Share, Package, Wrench, Shield, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DocumentationTab() {
  const { toast } = useToast();

  const handleExportDocument = (type: string) => {
    toast({
      title: "Generating Document",
      description: `Creating ${type} document...`,
    });

    // Simulate document generation
    setTimeout(() => {
      toast({
        title: "Document Ready",
        description: `${type} has been generated successfully.`,
      });
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Documentation Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
            <BookOpen className="w-4 h-4 mr-2 text-primary" />
            Documentation Templates
          </CardTitle>
        </CardHeader>
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
            onClick={() => handleExportDocument("Bill of Materials")}
          >
            <Package className="w-4 h-4 mr-2 text-purple-600" />
            Bill of Materials (BOM)
            <span className="ml-auto text-xs text-technical-500">XLSX</span>
          </Button>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
            <Download className="w-4 h-4 mr-2 text-primary" />
            Export & Sharing Options
          </CardTitle>
        </CardHeader>
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
      </Card>

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

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
            <FileText className="w-4 h-4 mr-2 text-primary" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-technical-700 dark:text-technical-300">Project:</span>
              <p className="text-technical-600 dark:text-technical-400">PowerWhip Configuration</p>
            </div>
            <div>
              <span className="font-semibold text-technical-700 dark:text-technical-300">Version:</span>
              <p className="text-technical-600 dark:text-technical-400">1.0.0</p>
            </div>
            <div>
              <span className="font-semibold text-technical-700 dark:text-technical-300">Created:</span>
              <p className="text-technical-600 dark:text-technical-400">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-semibold text-technical-700 dark:text-technical-300">Status:</span>
              <p className="text-green-600 dark:text-green-400">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}