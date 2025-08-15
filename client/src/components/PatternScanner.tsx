import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Download, Search, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PatternScanResult {
  success: boolean;
  fileName: string;
  patterns: {
    sheetName: string;
    patterns: {
      type: string;
      value: string;
      location: string;
      cellValue: string;
      row: number;
      column: number;
    }[];
    totalRows: number;
    totalPatterns: number;
  }[];
  transformedOutput: any[];
  summary: {
    totalSheets: number;
    totalPatterns: number;
  };
}

export function PatternScanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<PatternScanResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setScanResults(null);
      setError(null);
    }
  };

  const handleScanPatterns = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/excel/scan-patterns', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to scan patterns');
      }

      const result: PatternScanResult = await response.json();
      setScanResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan patterns');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportTransformedOutput = async () => {
    if (!scanResults?.transformedOutput) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/excel/export-transformed-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transformedOutput: scanResults.transformedOutput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export transformed patterns');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transformed_output_pattern.xlsx';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export patterns');
    } finally {
      setIsExporting(false);
    }
  };

  const patternTypeColors = {
    'Receptacle IDs': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Cable/Conduit Type IDs': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Whip Length IDs': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Tail Length IDs': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Comprehensive Pattern Scanner
          </CardTitle>
          <CardDescription>
            Upload multi-sheet Excel files (like files with "row 1", "row 2" tabs) to scan and extract all patterns across every sheet. 
            Each receptacle type is transformed into "choose receptacle" format with complete pattern traceability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="pattern-file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedFile ? selectedFile.name : 'Choose multi-sheet Excel file to scan'}
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Files with multiple tabs (row 1, row 2, etc.) are fully supported
                </p>
                <input
                  id="pattern-file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <Button
                onClick={() => document.getElementById('pattern-file-upload')?.click()}
                variant="outline"
                className="mt-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Excel File
              </Button>
            </div>
          </div>

          {/* Scan Button */}
          {selectedFile && (
            <Button
              onClick={handleScanPatterns}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Scanning Patterns...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan All Patterns
                </>
              )}
            </Button>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Section */}
          {scanResults && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Pattern Scanning Complete
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">File:</span>{' '}
                    <span className="font-medium">{scanResults.fileName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Sheets:</span>{' '}
                    <span className="font-medium">{scanResults.summary.totalSheets}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Total Patterns Found:</span>{' '}
                    <span className="font-medium text-lg">{scanResults.summary.totalPatterns}</span>
                  </div>
                </div>
              </div>

              {/* Sheet-by-Sheet Results */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Patterns by Sheet:
                </h4>
                {scanResults.patterns.map((sheet, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{sheet.sheetName}</CardTitle>
                        <Badge variant="secondary">
                          {sheet.totalPatterns} patterns
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(
                          sheet.patterns.reduce((acc, pattern) => {
                            acc[pattern.type] = (acc[pattern.type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <Badge
                            key={type}
                            className={`${patternTypeColors[type as keyof typeof patternTypeColors]} text-xs`}
                          >
                            {type}: {count}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExportTransformedOutput}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Transformed Output Pattern
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}