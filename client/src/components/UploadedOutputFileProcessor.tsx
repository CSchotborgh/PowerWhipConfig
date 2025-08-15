import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUp, Download, FileText, Layers, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedOutputFileResult {
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

export function UploadedOutputFileProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<UploadedOutputFileResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  // Specific file validation rules for UploadedOutputFile
  const validateUploadedOutputFile = (selectedFile: File): string | null => {
    // Rule 1: Must be Excel file
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      return "Only Excel (.xlsx) files are supported for UploadedOutputFile processing";
    }

    // Rule 2: File size limit (200MB)
    if (selectedFile.size > 200 * 1024 * 1024) {
      return "File size must be under 200MB for UploadedOutputFile processing";
    }

    // Rule 3: File name should contain patterns typical of multi-sheet files
    const fileName = selectedFile.name.toLowerCase();
    const isValidPattern = 
      fileName.includes('example') || 
      fileName.includes('row-') || 
      fileName.includes('sheet') ||
      fileName.includes('data') ||
      fileName.includes('pattern') ||
      fileName.includes('config');

    if (!isValidPattern) {
      console.warn("File name doesn't match expected patterns, but proceeding anyway");
    }

    return null; // Valid file
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setUploadError(null);
      
      const validationError = validateUploadedOutputFile(selectedFile);
      if (validationError) {
        setUploadError(validationError);
        toast({
          title: "Invalid File",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setResults(null);
      
      toast({
        title: "File Ready",
        description: `${selectedFile.name} is ready for UploadedOutputFile processing`,
      });
    }
  };

  const processUploadedOutputFile = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);
      
      // Use the dedicated UploadedOutputFile API endpoint
      const response = await fetch('/api/excel/process-uploaded-output-file', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Processing failed");
      }
      
      setResults(result);
      setProgress(100);

      toast({
        title: "UploadedOutputFile Processing Complete",
        description: `Successfully processed ${result.summary.totalSheets} sheets with ${result.summary.totalPatterns} total patterns combined into single UploadedOutputFile format.`,
      });

    } catch (error) {
      console.error('UploadedOutputFile processing error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process UploadedOutputFile";
      setUploadError(errorMessage);
      
      toast({
        title: "UploadedOutputFile Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const exportUploadedOutputFile = async () => {
    if (!results) return;

    try {
      const response = await fetch('/api/excel/export-uploaded-output-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transformedOutput: results.transformedOutput,
          fileName: file?.name || 'uploaded_output_file',
        }),
      });

      if (!response.ok) {
        throw new Error('UploadedOutputFile export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = Date.now();
      const originalName = file?.name.replace('.xlsx', '') || 'export';
      a.download = `UploadedOutputFile_${originalName}_${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "UploadedOutputFile Export Complete",
        description: `Downloaded UploadedOutputFile with ${results.summary.totalPatterns} patterns from ${results.summary.totalSheets} sheets.`,
      });

    } catch (error) {
      toast({
        title: "UploadedOutputFile Export Failed",
        description: "Failed to export UploadedOutputFile",
        variant: "destructive",
      });
    }
  };

  const clearUploadedOutputFile = () => {
    setFile(null);
    setResults(null);
    setUploadError(null);
    setProgress(0);
    setProcessing(false);
    
    toast({
      title: "Cleared",
      description: "UploadedOutputFile processor reset",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            UploadedOutputFile Processor
          </CardTitle>
          <CardDescription>
            Dedicated processor for creating UploadedOutputFile format from multi-sheet Excel files.
            Processes ALL sheet tabs (Row-3, Row-4, Sheet1, etc.) and combines into single comprehensive output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Upload Rules Alert */}
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>UploadedOutputFile Rules:</strong>
              <br />• Excel (.xlsx) files only
              <br />• Maximum 200MB file size
              <br />• Processes ALL sheet tabs automatically
              <br />• Combines patterns into single output file
              <br />• Separate from PreSal export functionality
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
            <div className="text-center">
              <FileUp className="mx-auto h-12 w-12 text-blue-500" />
              <div className="mt-2">
                <label htmlFor="uploaded-output-file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Upload Excel File for UploadedOutputFile Processing
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Multi-sheet files (Row-3, Row-4, Sheet1, etc.) • XLSX format only • 200MB max
                  </span>
                </label>
                <input
                  id="uploaded-output-file-upload"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </div>
              {!file && (
                <Button
                  onClick={() => document.getElementById('uploaded-output-file-upload')?.click()}
                  className="mt-4"
                  variant="outline"
                >
                  Select UploadedOutputFile
                </Button>
              )}
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* File Info */}
          {file && (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                  <span className="text-xs text-green-600">Ready for UploadedOutputFile processing</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={processUploadedOutputFile}
                  disabled={processing}
                  size="sm"
                >
                  {processing ? "Processing..." : "Process UploadedOutputFile"}
                </Button>
                <Button
                  onClick={clearUploadedOutputFile}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing UploadedOutputFile from all sheets...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">
                Scanning all sheet tabs and combining patterns into UploadedOutputFile format
              </p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Success Summary */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800 dark:text-green-200 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    UploadedOutputFile Processing Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Source File:</span>{' '}
                      <span className="font-medium">{results.fileName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Sheets Processed:</span>{' '}
                      <span className="font-medium">{results.summary.totalSheets}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Total Patterns in UploadedOutputFile:</span>{' '}
                      <span className="font-medium text-lg text-green-600">{results.summary.totalPatterns}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Processed Sheets:</span>
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
                    onClick={exportUploadedOutputFile}
                    className="w-full mt-4"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export UploadedOutputFile ({results.summary.totalPatterns} patterns)
                  </Button>
                </CardContent>
              </Card>

              {/* Processing Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    UploadedOutputFile Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p><strong>Processing Method:</strong> Multi-sheet comprehensive UploadedOutputFile scanning</p>
                    <p><strong>Pattern Types:</strong> Receptacle IDs, Cable/Conduit Types, Whip Lengths, Tail Lengths, General Identifiers</p>
                    <p><strong>Output Format:</strong> Single UploadedOutputFile Excel with all sheets combined</p>
                    <p><strong>Duplicate Handling:</strong> All instances preserved with complete traceability</p>
                    <p><strong>File Naming:</strong> UploadedOutputFile_[original_name]_[timestamp].xlsx</p>
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