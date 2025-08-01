import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Download, Upload, FileSpreadsheet, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExcelLikeInterface from './ExcelLikeInterface';
import ExcelFormulaLibrary from './ExcelFormulaLibrary';
import UnifiedFileUpload from './UnifiedFileUpload';

interface ConfiguratorAnalysis {
  sheetNames: string[];
  sheets: {
    [sheetName: string]: {
      rowCount: number;
      headers: string[];
      sampleData: any[][];
      columnCount: number;
    };
  };
  receptacleInputCells?: any[];
  expressionPatterns?: any[];
  enumDropdowns?: any;
}

interface ConfiguratorDatasetAnalyzerProps {
  onToggleView: () => void;
}

export default function ConfiguratorDatasetAnalyzer({ onToggleView }: ConfiguratorDatasetAnalyzerProps) {
  const [analysis, setAnalysis] = useState<ConfiguratorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentView, setCurrentView] = useState<'analysis' | 'excel' | 'formula-library'>('analysis');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [inputPatterns, setInputPatterns] = useState(`460C9W
460R9W
560C9W
L5-20R
L5-30R
L6-15R
L6-20R
L6-30R
L15-20R
L15-30R
L21-20R
L21-30R
L22-20R
L22-30R
CS8264C
CS8269A
CS8369A
9C54U2
CS8369`);
  const [processedResults, setProcessedResults] = useState<any>(null);

  const analyzeDataset = async () => {
    setIsLoading(true);
    try {
      const endpoint = uploadedFileId 
        ? `/api/excel/uploaded/${uploadedFileId}`
        : '/api/excel/analyze-configurator';
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis || data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the Excel file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch('/api/excel/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFileId(data.fileId);
        setUploadedFileName(data.originalName);
        setAnalysis(data.analysis);
        
        toast({
          title: "File Uploaded Successfully",
          description: `${data.originalName} is ready for editing`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload the Excel file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    // Only analyze if no file is uploaded
    if (!uploadedFileId) {
      analyzeDataset();
    }
  }, [uploadedFileId]);

  const processWithConfigurator = async () => {
    if (!analysis) return;
    
    setIsLoading(true);
    try {
      const patterns = inputPatterns.split('\n').filter(p => p.trim());
      
      const response = await fetch('/api/excel/process-configurator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputPatterns: patterns })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProcessedResults(data.results);
        
        toast({
          title: "Processing Complete",
          description: `Processed ${data.processedCount} patterns successfully`,
        });
      } else {
        throw new Error('Processing failed');
      }
    } catch (error) {
      console.error('Error processing with configurator:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process patterns with ConfiguratorDataset",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToMasterBubble = async () => {
    if (!processedResults) return;
    
    setIsLoading(true);
    try {
      // Convert processed results to the expected format for export
      const receptacles = processedResults.map((result: any) => ({
        type: result.inputPattern,
        generatedPatterns: result.generatedPatterns || [result.inputPattern],
        isQuantityBased: result.isQuantityBased,
        totalRows: result.totalGeneratedRows || 1
      }));

      const response = await fetch('/api/excel/export-master-bubble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receptacles: receptacles,
          rawData: processedResults
        })
      });

      if (response.ok) {
        // Get the blob and create download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MasterBubbleTransformed.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export Successful",
          description: "Master Bubble format file downloaded successfully",
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export to Master Bubble format",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
              {uploadedFileName ? `Excel Editor: ${uploadedFileName}` : 'ConfiguratorModelDatasetEPW Analyzer'}
            </h2>
            <p className="text-sm text-technical-600 dark:text-technical-400 mt-1">
              {uploadedFileName 
                ? 'Full Excel editing with functions, expressions, sheets, and VB script capabilities'
                : 'Analyze and process receptacle patterns using the ConfiguratorModelDatasetEPW with automated row expressions'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              size="sm"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Excel'}
            </Button>
            {uploadedFileName && (
              <Button
                onClick={() => {
                  setUploadedFileId(null);
                  setUploadedFileName('');
                  setCurrentView('analysis');
                }}
                variant="outline"
                size="sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Close Excel File
              </Button>
            )}
            <Button 
              onClick={() => setCurrentView('formula-library')} 
              variant="outline"
              size="sm"
            >
              <Database className="w-4 h-4 mr-2" />
              Formula Library
            </Button>
            <Button onClick={onToggleView} variant="outline">
              Back to Design Canvas
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Show Formula Library */}
        {currentView === 'formula-library' && (
          <div className="h-full">
            <ExcelFormulaLibrary 
              onToggleView={() => setCurrentView('analysis')}
            />
          </div>
        )}

        {/* Show Excel Editor when file is uploaded */}
        {uploadedFileName && currentView !== 'formula-library' && (
          <div className="h-full">
            <ExcelLikeInterface 
              onToggleView={() => {
                setUploadedFileId(null);
                setUploadedFileName('');
                setCurrentView('analysis');
              }}
              uploadedFileId={uploadedFileId}
              fileName={uploadedFileName}
            />
          </div>
        )}
        
        {/* Show Analysis view when no file uploaded */}
        {!uploadedFileName && currentView === 'analysis' && (
          <>
        {/* File Upload Prompt */}
        <Card>
          <CardContent className="p-6">
            <UnifiedFileUpload 
              mode="configurator"
              onFileUploaded={(fileId: string, fileName: string) => {
                setUploadedFileId(fileId);
                setUploadedFileName(fileName);
              }}
              className="border-0 bg-transparent shadow-none"
            />
          </CardContent>
        </Card>

        {/* Analysis Section - Only show if analysis data exists */}
        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ConfiguratorModelDatasetEPW Analysis (Reference)
                <Button onClick={analyzeDataset} disabled={isLoading} size="sm" variant="outline">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant="outline">{analysis.sheetNames?.length || 0} Sheets</Badge>
                  <Badge variant="secondary">
                    {Object.values(analysis.sheets || {}).reduce((total, sheet) => total + sheet.rowCount, 0)} Total Rows
                  </Badge>
                  <Badge variant="default">{analysis.receptacleInputCells?.length || 0} Input Cells</Badge>
                  <Badge variant="outline">{analysis.expressionPatterns?.length || 0} Expressions</Badge>
                  <Badge variant="secondary">{Object.keys(analysis.enumDropdowns || {}).length} Enum Columns</Badge>
                </div>
                
                <Tabs defaultValue={analysis.sheetNames?.[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                    {(analysis.sheetNames || []).slice(0, 6).map(sheetName => (
                      <TabsTrigger key={sheetName} value={sheetName} className="text-xs">
                        {sheetName.substring(0, 8)}...
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {(analysis.sheetNames || []).map(sheetName => (
                    <TabsContent key={sheetName} value={sheetName} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Sheet Info</h4>
                          <div className="text-sm space-y-1">
                            <div>Rows: {analysis.sheets?.[sheetName]?.rowCount || 0}</div>
                            <div>Columns: {analysis.sheets?.[sheetName]?.columnCount || 0}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Headers</h4>
                          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                            {(analysis.sheets?.[sheetName]?.headers || []).slice(0, 10).map((header, idx) => (
                              <div key={idx} className="font-mono">{header}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Sample Data</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border border-technical-200 dark:border-technical-600">
                            <tbody>
                              {(analysis.sheets?.[sheetName]?.sampleData || []).slice(0, 5).map((row, rowIdx) => (
                                <tr key={rowIdx} className="border-b border-technical-100 dark:border-technical-700">
                                  {row.slice(0, 6).map((cell, cellIdx) => (
                                    <td key={cellIdx} className="p-2 border-r border-technical-100 dark:border-technical-700">
                                      {cell?.toString().substring(0, 20) || ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : null}
            </CardContent>
          </Card>
        )}

        {/* Input Patterns Section */}
        <Card>
          <CardHeader>
            <CardTitle>Excel Master Bubble Format Transformer</CardTitle>
            <p className="text-sm text-technical-600 dark:text-technical-400">
              Transform receptacle patterns into Master Bubble Order Entry format with comma-delimited cell entry replacements
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Natural Language Pattern Generator
              </label>
              <p className="text-xs text-technical-600 dark:text-technical-400 mb-3">
                Transform human specifications into structured patterns with equal distribution logic
                <br />
                <strong>Enhanced Formats:</strong>
                <br />
                <span className="text-blue-600 dark:text-blue-400 font-medium">1. Comma-Delimited Patterns:</span>
                <br />
                <code className="bg-technical-100 dark:bg-technical-800 px-1 rounded text-xs">
                  Pattern, Cable/Conduit, Whip Length, Tail Length, Label Color
                </code>
                <br />
                <span className="text-green-600 dark:text-green-400 font-medium">2. Natural Language Specifications:</span>
                <br />
                <code className="text-xs bg-green-50 dark:bg-green-900/20 px-1 rounded">
                  860 power whips total | Whip lengths ranging from 20'-80' | Liquid tight conduit | Four colors: Red, Orange, Blue, Yellow | IEC pinned and sleeve plug
                </code>
                <br />
                <span className="text-orange-600 dark:text-orange-400 font-medium">3. Quantity-Based Patterns (! delimiter):</span>
                <br />
                <code className="text-xs bg-orange-50 dark:bg-orange-900/20 px-1 rounded">
                  CS8269A, LMZC, 20, 10, Red !43 | 460C9W, LMZC, 20, 10, Orange !43
                </code>
                <br />
                <strong className="text-purple-600 dark:text-purple-400">Translation Examples:</strong>
                <br />
                • "Liquid tight conduit" = LMZC
                <br />
                • "IEC pinned and sleeve plug" = CS8269A or 460C9W
                <br />
                • "860 power whips total" = 860 output rows with equal distribution
                <br />
                • "CS8269A, LMZC, 20, 10, Red !43" = 43 identical rows of that pattern
              </p>
              <Textarea
                value={inputPatterns}
                onChange={(e) => setInputPatterns(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder={`Enter patterns (one per line):

COMMA-DELIMITED PATTERNS:
460C9W, FMC, 115, 10
CS8264C, LMZC, 26, 8, Purple
L6-15R, LMZC, 22, 10, Purple

QUANTITY-BASED PATTERNS (! delimiter):
CS8269A, LMZC, 20, 10, Red !43
460C9W, LMZC, 20, 10, Orange !43
L6-15R, LMZC, 30, 15, Blue !25

NATURAL LANGUAGE SPECIFICATIONS:
860 power whips total
Whip lengths ranging from 20'-80'
Liquid tight conduit
Four colors of liquid tight: Red, Orange, Blue, Yellow
IEC pinned and sleeve plug
IP67 bell box included
60A
5 wires - #6 AWG
Purple, Tan, Pink, Gray, Green`}
              />
            </div>
            
            <Button 
              onClick={processWithConfigurator} 
              disabled={!analysis || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Process with ConfiguratorDataset
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {processedResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Processing Results
                <Button 
                  onClick={exportToMasterBubble}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export to Master Bubble Format
                </Button>
              </CardTitle>
              <p className="text-sm text-technical-600 dark:text-technical-400">
                Pattern matching results from ConfiguratorModelDatasetEPW
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {processedResults.map((result: any, idx: number) => (
                  <div 
                    key={idx}
                    className="p-4 border border-technical-200 dark:border-technical-600 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-lg">
                        {result.isNaturalLanguage ? 'Natural Language Specification' : 
                         result.isQuantityBased ? 'Quantity-Based Pattern' : 
                         result.inputPattern}
                      </span>
                      <div className="flex gap-2">
                        {result.isNaturalLanguage || result.isQuantityBased ? (
                          <Badge variant="default" className={result.isQuantityBased ? "bg-orange-600" : "bg-green-600"}>
                            {result.totalGeneratedRows} rows generated
                          </Badge>
                        ) : (
                          <Badge variant={result.matchCount > 0 ? "default" : "secondary"}>
                            {result.matchCount > 0 ? `${result.matchCount} matches in ${result.foundInSheets?.length || 0} sheet(s)` : 'No matches - using defaults'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quantity-Based Pattern Display */}
                    {result.isQuantityBased && (
                      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Quantity-Based Pattern Results</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Original Pattern:</span> {result.inputPattern.split('!')[0]}
                          </div>
                          <div>
                            <span className="font-medium">Quantity Specified:</span> {result.quantitySpecified}
                          </div>
                          <div>
                            <span className="font-medium">Receptacle:</span> {result.parsedPattern?.receptacle}
                          </div>
                          <div>
                            <span className="font-medium">Conduit Type:</span> {result.parsedPattern?.cableConduitType}
                          </div>
                          <div>
                            <span className="font-medium">Whip Length:</span> {result.parsedPattern?.whipLength}'
                          </div>
                          <div>
                            <span className="font-medium">Tail Length:</span> {result.parsedPattern?.tailLength}'
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Label Color:</span> {result.parsedPattern?.labelColor}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <details>
                            <summary className="cursor-pointer text-sm font-medium text-orange-700 dark:text-orange-300">
                              View Generated Patterns (first 10 of {result.totalGeneratedRows})
                            </summary>
                            <div className="mt-2 p-2 bg-white dark:bg-technical-900 rounded font-mono text-xs max-h-40 overflow-y-auto">
                              {result.generatedPatterns?.slice(0, 10).map((pattern: string, idx: number) => (
                                <div key={idx} className="py-1 border-b border-technical-100 dark:border-technical-700">
                                  {pattern}
                                </div>
                              ))}
                              {result.generatedPatterns?.length > 10 && (
                                <div className="py-1 text-technical-500 italic">
                                  ... and {result.generatedPatterns.length - 10} more identical patterns
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    )}

                    {/* Natural Language Processing Display */}
                    {result.isNaturalLanguage && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Natural Language Processing Results</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Quantity:</span> {result.specification?.totalQuantity}
                          </div>
                          <div>
                            <span className="font-medium">Receptacle Type:</span> {result.specification?.receptacleType}
                          </div>
                          <div>
                            <span className="font-medium">Conduit Type:</span> {result.specification?.conduitType}
                          </div>
                          <div>
                            <span className="font-medium">Length Range:</span> {result.specification?.lengthRange?.min}' - {result.specification?.lengthRange?.max}'
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Colors:</span> {result.specification?.colors?.join(', ')}
                          </div>
                          {result.specification?.features && result.specification.features.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium">Features:</span> {result.specification.features.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        {result.distributionSummary && (
                          <div className="mt-3 p-2 bg-white dark:bg-technical-800 rounded border">
                            <h6 className="font-medium mb-2">Equal Distribution Summary</h6>
                            <div className="text-xs space-y-1">
                              <div>Base quantity per configuration: {result.distributionSummary.baseQuantityPerConfig}</div>
                              <div>Total configurations: {result.distributionSummary.configurationsCount}</div>
                              <div>Lengths: {result.distributionSummary.lengths?.join(', ')} feet</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <details>
                            <summary className="cursor-pointer text-sm font-medium text-green-700 dark:text-green-300">
                              View Generated Patterns (first 10 of {result.totalGeneratedRows})
                            </summary>
                            <div className="mt-2 p-2 bg-white dark:bg-technical-900 rounded font-mono text-xs max-h-40 overflow-y-auto">
                              {result.generatedPatterns?.slice(0, 10).map((pattern: string, idx: number) => (
                                <div key={idx} className="py-1 border-b border-technical-100 dark:border-technical-700">
                                  {pattern}
                                </div>
                              ))}
                              {result.generatedPatterns?.length > 10 && (
                                <div className="py-1 text-technical-500 italic">
                                  ... and {result.generatedPatterns.length - 10} more patterns
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                    
                    {/* Auto-Fill Data - Only show for regular patterns */}
                    {!result.isNaturalLanguage && !result.isQuantityBased && (
                      <div className="bg-technical-50 dark:bg-technical-800 p-3 rounded">
                        <h4 className="font-medium mb-2 text-sm">Auto-Generated Row Data</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><strong>Receptacle:</strong> {result.autoFillData?.receptacle}</div>
                          <div><strong>Cable Type:</strong> {result.autoFillData?.cableType}</div>
                          <div><strong>Whip Length:</strong> {result.autoFillData?.whipLength} ft</div>
                          <div><strong>Tail Length:</strong> {result.autoFillData?.tailLength} ft</div>
                          <div><strong>Conduit Size:</strong> {result.autoFillData?.conduitSize}</div>
                          <div><strong>Conductor AWG:</strong> {result.autoFillData?.conductorAWG}</div>
                          <div><strong>Voltage:</strong> {result.autoFillData?.voltage}V</div>
                          <div><strong>Label Color:</strong> {result.autoFillData?.labelColor}</div>
                        </div>
                        {result.autoFillData?.sourceSheet && (
                          <div className="text-xs text-technical-600 dark:text-technical-400 mt-2">
                            Source: {result.autoFillData.sourceSheet} (Row {result.autoFillData.sourceRow})
                          </div>
                        )}
                        {result.autoFillData?.error && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                            {result.autoFillData.error}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Generated Expressions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <h4 className="font-medium mb-2 text-sm">Auto-Generated Expressions</h4>
                      <div className="space-y-2">
                        {result.generatedExpressions?.map((expr: any, exprIdx: number) => (
                          <div key={exprIdx} className="text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{expr.type}</Badge>
                              <span className="font-mono">{expr.expression}</span>
                            </div>
                            <div className="text-technical-600 dark:text-technical-400 ml-2 mt-1">
                              {expr.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Source Data */}
                    {result.foundInSheets.length > 0 && (
                      <div className="text-xs">
                        <strong>Found in sheets:</strong> {result.foundInSheets.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </div>
  );
}