import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileUp, Download, FileText, Layers, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProcessingResult {
  success: boolean;
  fileName: string;
  patterns: any[];
  transformedOutput: any[];
  summary: {
    totalSheets: number;
    totalPatterns: number;
    sheetNames: string[];
    combinedOutputRows: number;
    processing: string;
    sheetsProcessed: Array<{ name: string; patterns: number }>;
  };
}

export function UploadedExcelProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an Excel (.xlsx) file only.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const processAllSheets = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);
      
      const response = await fetch('/api/excel/scan-patterns', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setResults(result);
      setProgress(100);

      toast({
        title: "Processing Complete",
        description: `Successfully processed ${result.summary.totalSheets} sheets with ${result.summary.totalPatterns} total patterns combined into single output file.`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process Excel file",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const exportCombinedOutput = async () => {
    if (!results) return;

    try {
      const response = await fetch('/api/excel/export-transformed-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transformedOutput: results.transformedOutput,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file?.name.replace('.xlsx', '')}_combined_patterns.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Downloaded combined patterns from all ${results.summary.totalSheets} sheets (${results.summary.totalPatterns} total patterns).`,
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export combined output file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Uploaded Excel Multi-Sheet Processor
          </CardTitle>
          <CardDescription>
            Process ALL sheets (Row-3, Row-4, Sheet1, etc.) from uploaded Excel files and combine patterns into single output file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Upload Excel File for Multi-Sheet Processing
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Supports any sheet names (Row-3, Row-4, Sheet1, etc.) • XLSX format only
                  </span>
                </label>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
              </div>
              <Button
                onClick={processAllSheets}
                disabled={processing}
                className="ml-4"
              >
                {processing ? "Processing..." : "Process All Sheets"}
              </Button>
            </div>
          )}

          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing all sheets and combining patterns...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {/* Summary */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800 dark:text-green-200">
                    Processing Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">File:</span>{' '}
                      <span className="font-medium">{results.fileName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Sheets:</span>{' '}
                      <span className="font-medium">{results.summary.totalSheets}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Total Patterns Combined:</span>{' '}
                      <span className="font-medium text-lg text-green-600">{results.summary.totalPatterns}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Sheets Processed:</span>
                    <div className="flex flex-wrap gap-1">
                      {results.summary.sheetNames.map((sheetName, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {sheetName}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Pattern Count by Sheet:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {results.summary.sheetsProcessed.map((sheet, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{sheet.name}:</span>
                          <span className="font-medium">{sheet.patterns}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={exportCombinedOutput}
                    className="w-full mt-4"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Combined Output File ({results.summary.totalPatterns} patterns)
                  </Button>
                </CardContent>
              </Card>

              {/* Pattern Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Pattern Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p><strong>Processing Method:</strong> Multi-sheet comprehensive scanning</p>
                    <p><strong>Pattern Types:</strong> Receptacle IDs, Cable/Conduit Types, Whip Lengths, Tail Lengths, General Identifiers</p>
                    <p><strong>Output Format:</strong> Single Excel file with all sheets combined</p>
                    <p><strong>Duplicate Handling:</strong> All instances preserved with complete traceability</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}