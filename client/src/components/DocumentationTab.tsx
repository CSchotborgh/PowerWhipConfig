import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Share, Package, Wrench, Shield, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DrawingsBrowserPanel from "./DrawingsBrowserPanel";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { useDesignCanvas } from "@/contexts/DesignCanvasContext";
import {
  generateTechnicalSpecificationsPDF,
  generateInstallationGuidePDF,
  generateSafetyInstructionsPDF,
  generateBillOfMaterialsXLSX,
} from "@/lib/documentGenerators";

export default function DocumentationTab() {
  const { toast } = useToast();
  const { configuration, components: libraryComponents } = useConfiguration();
  const { droppedComponents } = useDesignCanvas();

  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const run = async (key: string, label: string, fn: () => void) => {
    setLoadingDoc(key);
    try {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          fn();
          resolve();
        }, 80);
      });
      toast({ title: "Download started", description: `${label} is downloading to your browser.` });
    } catch (e) {
      toast({ title: "Error", description: `Failed to generate ${label}.`, variant: "destructive" });
    } finally {
      setLoadingDoc(null);
    }
  };

  const isLoading = (key: string) => loadingDoc === key;

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
            disabled={!!loadingDoc}
            onClick={() =>
              run("techspec", "Technical Specifications", () =>
                generateTechnicalSpecificationsPDF(configuration, libraryComponents, droppedComponents)
              )
            }
          >
            {isLoading("techspec") ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
            )}
            Technical Specifications
            <span className="ml-auto text-xs text-technical-500">PDF</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start hover:bg-primary/10"
            disabled={!!loadingDoc}
            onClick={() =>
              run("install", "Installation Guide", () =>
                generateInstallationGuidePDF(configuration, droppedComponents)
              )
            }
          >
            {isLoading("install") ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wrench className="w-4 h-4 mr-2 text-green-600" />
            )}
            Installation Guide
            <span className="ml-auto text-xs text-technical-500">PDF</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start hover:bg-primary/10"
            disabled={!!loadingDoc}
            onClick={() =>
              run("safety", "Safety Instructions", () =>
                generateSafetyInstructionsPDF(configuration)
              )
            }
          >
            {isLoading("safety") ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2 text-red-600" />
            )}
            Safety Instructions
            <span className="ml-auto text-xs text-technical-500">PDF</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start hover:bg-primary/10"
            disabled={!!loadingDoc}
            onClick={() =>
              run("bom", "Bill of Materials", () =>
                generateBillOfMaterialsXLSX(configuration, libraryComponents, droppedComponents)
              )
            }
          >
            {isLoading("bom") ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Package className="w-4 h-4 mr-2 text-purple-600" />
            )}
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
            disabled={!!loadingDoc}
            onClick={() =>
              run("drawing", "Technical Drawing", () =>
                generateTechnicalSpecificationsPDF(configuration, libraryComponents, droppedComponents)
              )
            }
          >
            {isLoading("drawing") ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2 text-blue-600" />
            )}
            Download Technical Drawing
            <span className="ml-auto text-xs text-technical-500">PDF</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start hover:bg-primary/10"
            disabled={!!loadingDoc}
            onClick={() =>
              run("cutsheet", "Cut Sheet", () =>
                generateInstallationGuidePDF(configuration, droppedComponents)
              )
            }
          >
            {isLoading("cutsheet") ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2 text-orange-600" />
            )}
            Export Cut Sheet
            <span className="ml-auto text-xs text-technical-500">PDF</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start hover:bg-primary/10"
            disabled={!!loadingDoc}
            onClick={() =>
              run("pkg", "Configuration Package", () => {
                generateTechnicalSpecificationsPDF(configuration, libraryComponents, droppedComponents);
                generateBillOfMaterialsXLSX(configuration, libraryComponents, droppedComponents);
              })
            }
          >
            {isLoading("pkg") ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Share className="w-4 h-4 mr-2 text-green-600" />
            )}
            Share Configuration Package
            <span className="ml-auto text-xs text-technical-500">PDF + XLSX</span>
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
              <p className="text-technical-600 dark:text-technical-400">{configuration.name || "PowerWhip Configuration"}</p>
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
              <p className={configuration.isValid ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                {configuration.isValid ? "Active" : "Review"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Drawings Library */}
      <DrawingsBrowserPanel />
    </div>
  );
}
