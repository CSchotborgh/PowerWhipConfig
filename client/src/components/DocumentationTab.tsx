import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Share } from "lucide-react";

export default function DocumentationTab() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
            <FileText className="w-4 h-4 mr-2 text-primary" />
            Documentation Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Technical Specifications
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Installation Guide
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Safety Instructions
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Material List
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-technical-900 dark:text-technical-100">
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Download Technical Drawing
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Export Cut Sheet
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Share className="w-4 h-4 mr-2" />
            Share Configuration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-technical-900 dark:text-technical-100">
            Compliance Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-technical-700 dark:text-technical-300">NEC Article 400</span>
              <span className="text-green-500">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-technical-700 dark:text-technical-300">UL 62</span>
              <span className="text-green-500">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-technical-700 dark:text-technical-300">OSHA 1926.405</span>
              <span className="text-green-500">✓ Compliant</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
