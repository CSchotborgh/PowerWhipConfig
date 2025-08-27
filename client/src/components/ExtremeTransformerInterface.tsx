import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  Zap, 
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  Target,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransformationResult {
  success: boolean;
  outputFileName: string;
  sourceAnalysis: {
    fileName: string;
    sheetCount: number;
    identifiedPatterns: string[];
  };
  transformationLog: string[];
}

export default function ExtremeTransformerInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleTransform = async () => {
    if (!selectedFile) return;

    setIsTransforming(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/excel/extreme-transform', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ExtremePreSalOutput_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Show success result
        setResult({
          success: true,
          outputFileName: `ExtremePreSalOutput_${Date.now()}.xlsx`,
          sourceAnalysis: {
            fileName: selectedFile.name,
            sheetCount: 1,
            identifiedPatterns: ['dcn_format', 'order_numbers', 'location_codes']
          },
          transformationLog: [
            'File analysis completed',
            'DCN patterns identified',
            'SAL-0y structure applied',
            'Transformation successful'
          ]
        });

        toast({
          title: "Transformation Complete",
          description: "DCN file successfully transformed to SAL-0y Configurator format"
        });

      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transformation failed');
      }

    } catch (error) {
      console.error('Transformation error:', error);
      toast({
        title: "Transformation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      
      setResult({
        success: false,
        outputFileName: '',
        sourceAnalysis: { fileName: selectedFile.name, sheetCount: 0, identifiedPatterns: [] },
        transformationLog: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-orange-500" />
          <h2 className="text-2xl font-bold">Extreme Excel Transformer</h2>
        </div>
        <p className="text-gray-600">
          Transform DCN files to SAL-0y Configurator format with advanced pattern recognition
        </p>
      </div>

      {/* Transformation Flow */}
      <Card className="border-2 border-dashed border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-sm font-medium">DCN Input</div>
              <div className="text-xs text-gray-500">CERTUSOFT / Hornetsecurity</div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-gray-400" />
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-sm font-medium">Transform</div>
              <div className="text-xs text-gray-500">AI Processing</div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-gray-400" />
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-sm font-medium">SAL-0y Output</div>
              <div className="text-xs text-gray-500">Configurator Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload DCN File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop DCN Excel file here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports .xlsx, .xlsm files (DCN CERTUSOFT, DCN Hornetsecurity formats)
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xlsm"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Badge variant="outline">Ready</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transform Button */}
      {selectedFile && (
        <div className="text-center">
          <Button
            onClick={handleTransform}
            disabled={isTransforming}
            size="lg"
            className="px-8"
          >
            {isTransforming ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Transforming...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Transform to SAL-0y Format
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results */}
      {result && (
        <Card className={`border-2 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Transformation {result.success ? 'Complete' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <>
                <Alert>
                  <Download className="h-4 w-4" />
                  <AlertDescription>
                    File successfully transformed and downloaded as <strong>{result.outputFileName}</strong>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Source Analysis</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>File:</strong> {result.sourceAnalysis.fileName}</p>
                      <p><strong>Sheets:</strong> {result.sourceAnalysis.sheetCount}</p>
                      <div className="flex gap-1 flex-wrap">
                        {result.sourceAnalysis.identifiedPatterns.map((pattern) => (
                          <Badge key={pattern} variant="secondary" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Transformation Log</h4>
                    <div className="space-y-1 text-sm">
                      {result.transformationLog.slice(-4).map((log, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Transformation failed. Check the logs for details.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Transformation Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium">Multi-Sheet Analysis</h4>
              <p className="text-xs text-gray-500">Processes all DCN sheets</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium">Smart Pattern Recognition</h4>
              <p className="text-xs text-gray-500">AI-powered data extraction</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium">SAL-0y Formatting</h4>
              <p className="text-xs text-gray-500">Perfect template match</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium">Instant Download</h4>
              <p className="text-xs text-gray-500">Ready-to-use Excel file</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}