import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileSpreadsheet, 
  Brain, 
  Zap, 
  Settings, 
  Download,
  Upload,
  Eye,
  Edit3,
  GitCompare,
  Target,
  FileCheck,
  Layers,
  Calculator
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExcelAnalysis {
  fileId: string;
  fileName: string;
  sheets: SheetAnalysis[];
  patterns: PatternAnalysis[];
  expressions: ExpressionAnalysis[];
  nomenclatureMapping: NomenclatureMapping[];
  instructionsScope: InstructionsScope | null;
  processingStatus: 'analyzing' | 'completed' | 'error';
  transformationRules: TransformationRule[];
}

interface SheetAnalysis {
  name: string;
  rowCount: number;
  columnCount: number;
  dataTypes: Record<string, string>;
  formulaCount: number;
  hasHeaders: boolean;
  primaryDataPattern: string;
}

interface PatternAnalysis {
  id: string;
  pattern: string;
  category: 'length' | 'receptacle' | 'cable' | 'voltage' | 'current' | 'other';
  frequency: number;
  variations: string[];
  standardMapping: string;
  confidence: number;
}

interface ExpressionAnalysis {
  id: string;
  formula: string;
  cell: string;
  sheet: string;
  complexity: number;
  dependencies: string[];
  purpose: string;
  category: 'calculation' | 'lookup' | 'validation' | 'transformation';
}

interface NomenclatureMapping {
  id: string;
  originalTerms: string[];
  standardTerm: string;
  category: string;
  mappingRule: string;
  confidence: number;
}

interface InstructionsScope {
  sheetName: string;
  configurationScope: string;
  requirements: string[];
  specifications: Record<string, any>;
  voltage?: number;
  current?: number;
  componentCount?: number;
}

interface TransformationRule {
  id: string;
  name: string;
  sourcePattern: string;
  targetColumn: string;
  transformFunction: string;
  priority: number;
  isActive: boolean;
}

interface ExcelFileViewerEditorProps {
  onFileAnalyzed?: (analysis: ExcelAnalysis) => void;
  onTransformComplete?: (outputFile: string) => void;
}

export function ExcelFileViewerEditor({ 
  onFileAnalyzed, 
  onTransformComplete 
}: ExcelFileViewerEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File upload and analysis
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/excel/upload-analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setActiveTab('analysis');
      onFileAnalyzed?.(data);
      toast({
        title: "File Analyzed Successfully",
        description: `Found ${data.patterns.length} patterns and ${data.expressions.length} expressions`,
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload and analyze the Excel file",
        variant: "destructive",
      });
    }
  });

  // Get analysis results
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['/api/excel/analysis', selectedFile?.name],
    queryFn: () => fetch(`/api/excel/analysis/${uploadMutation.data?.fileId}`).then(r => r.json()),
    enabled: !!uploadMutation.data?.fileId,
    refetchInterval: (data: ExcelAnalysis) => data?.processingStatus === 'analyzing' ? 2000 : false,
  }) as { data: ExcelAnalysis | undefined, isLoading: boolean };

  // Pattern recognition and mapping
  const patternMappingMutation = useMutation({
    mutationFn: async (mappings: NomenclatureMapping[]) => {
      const response = await fetch('/api/excel/apply-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: analysis?.fileId,
          mappings
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/excel/analysis'] });
      toast({
        title: "Mappings Applied",
        description: "Nomenclature mappings have been applied successfully",
      });
    }
  });

  // Transform to PreSal format
  const transformMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/excel/transform-presal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: analysis?.fileId,
          transformationRules: analysis?.transformationRules
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      onTransformComplete?.(data.outputFile);
      toast({
        title: "Transformation Complete",
        description: "File transformed to PreSal format successfully",
      });
    }
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.xlsx')) {
      setSelectedFile(file);
      setUploadProgress(0);
      setAnalysisProgress(0);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid .xlsx file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  }, [selectedFile, uploadMutation]);

  const renderUploadTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Advanced Excel File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <div className="space-y-2">
              <Input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                className="max-w-xs mx-auto"
              />
              <p className="text-sm text-gray-500">
                Upload Excel files for advanced analysis and transformation
              </p>
            </div>
          </div>
          
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Analyzing...' : 'Analyze File'}
                </Button>
              </div>
              
              {uploadMutation.isPending && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intelligent Analysis Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Pattern Recognition</h4>
                <p className="text-sm text-gray-600">
                  Identifies nomenclature variations and standardizes terminology
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calculator className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium">Formula Analysis</h4>
                <p className="text-sm text-gray-600">
                  Analyzes expressions and creates reusable transformation rules
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">Multi-Sheet Processing</h4>
                <p className="text-sm text-gray-600">
                  Processes all worksheets and identifies relationships
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-orange-500 mt-1" />
              <div>
                <h4 className="font-medium">PreSal Output</h4>
                <p className="text-sm text-gray-600">
                  Transforms any Excel format to standardized PreSal structure
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalysisTab = () => {
    if (!analysis) return <div>No analysis data available</div>;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              File Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.sheets.length}</div>
                <div className="text-sm text-gray-500">Sheets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.patterns.length}</div>
                <div className="text-sm text-gray-500">Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.expressions.length}</div>
                <div className="text-sm text-gray-500">Expressions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.nomenclatureMapping.length}</div>
                <div className="text-sm text-gray-500">Mappings</div>
              </div>
            </div>

            {analysis.processingStatus === 'analyzing' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis Progress</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="sheets" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sheets">Sheets</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="expressions">Expressions</TabsTrigger>
            <TabsTrigger value="nomenclature">Nomenclature</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="sheets" className="space-y-4">
            {analysis.sheets.map((sheet: SheetAnalysis, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{sheet.name}</span>
                    <Badge variant={sheet.hasHeaders ? "default" : "secondary"}>
                      {sheet.hasHeaders ? "Has Headers" : "No Headers"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="font-medium">{sheet.rowCount}</div>
                      <div className="text-sm text-gray-500">Rows</div>
                    </div>
                    <div>
                      <div className="font-medium">{sheet.columnCount}</div>
                      <div className="text-sm text-gray-500">Columns</div>
                    </div>
                    <div>
                      <div className="font-medium">{sheet.formulaCount}</div>
                      <div className="text-sm text-gray-500">Formulas</div>
                    </div>
                    <div>
                      <Badge variant="outline">{sheet.primaryDataPattern}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {analysis.patterns.map((pattern: PatternAnalysis) => (
              <Card key={pattern.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium">{pattern.pattern}</div>
                      <div className="text-sm text-gray-500">
                        Category: {pattern.category} | Frequency: {pattern.frequency}
                      </div>
                    </div>
                    <Badge variant={pattern.confidence > 0.8 ? "default" : "secondary"}>
                      {Math.round(pattern.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Variations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.variations.map((variation: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {variation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Standard Mapping:</span>
                      <Badge className="ml-2">{pattern.standardMapping}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="expressions" className="space-y-4">
            {analysis.expressions.map((expr: ExpressionAnalysis) => (
              <Card key={expr.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {expr.formula}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {expr.sheet}!{expr.cell} | {expr.purpose}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{expr.category}</Badge>
                      <Badge variant={expr.complexity > 3 ? "destructive" : "default"}>
                        Complexity: {expr.complexity}
                      </Badge>
                    </div>
                  </div>
                  
                  {expr.dependencies.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Dependencies:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {expr.dependencies.map((dep: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="nomenclature" className="space-y-4">
            {analysis.nomenclatureMapping.map((mapping: NomenclatureMapping) => (
              <Card key={mapping.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="font-medium">{mapping.standardTerm}</div>
                      <div className="text-sm text-gray-500">{mapping.category}</div>
                    </div>
                    <Badge variant={mapping.confidence > 0.8 ? "default" : "secondary"}>
                      {Math.round(mapping.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Original Terms:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mapping.originalTerms.map((term: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Mapping Rule:</span>
                      <code className="ml-2 text-xs bg-gray-100 p-1 rounded">
                        {mapping.mappingRule}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            {analysis.instructionsScope ? (
              <Card>
                <CardHeader>
                  <CardTitle>Instructions Sheet Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">Sheet:</span>
                    <Badge className="ml-2">{analysis.instructionsScope.sheetName}</Badge>
                  </div>
                  
                  <div>
                    <span className="font-medium">Configuration Scope:</span>
                    <p className="mt-1 text-sm">{analysis.instructionsScope.configurationScope}</p>
                  </div>
                  
                  {analysis.instructionsScope.voltage && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium">Voltage:</span>
                        <div className="text-lg">{analysis.instructionsScope.voltage}V</div>
                      </div>
                      <div>
                        <span className="font-medium">Current:</span>
                        <div className="text-lg">{analysis.instructionsScope.current}A</div>
                      </div>
                      <div>
                        <span className="font-medium">Components:</span>
                        <div className="text-lg">{analysis.instructionsScope.componentCount}</div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">Requirements:</span>
                    <ul className="mt-1 space-y-1">
                      {analysis.instructionsScope.requirements.map((req: string, i: number) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <FileCheck className="h-3 w-3 text-green-500" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertDescription>
                  No instructions sheet found in the uploaded file.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderTransformTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Transform to PreSal Format
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Apply intelligent transformations to convert your Excel file to standardized PreSal format
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => patternMappingMutation.mutate(analysis?.nomenclatureMapping || [])}
              disabled={patternMappingMutation.isPending}
              variant="outline"
            >
              Apply Mappings
            </Button>
            
            <Button 
              onClick={() => transformMutation.mutate()}
              disabled={transformMutation.isPending || !analysis}
            >
              <Download className="h-4 w-4 mr-2" />
              {transformMutation.isPending ? 'Transforming...' : 'Generate PreSal Output'}
            </Button>
          </div>
          
          {analysis?.transformationRules && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Transformation Rules</h4>
              <div className="space-y-2">
                {analysis.transformationRules.map((rule: TransformationRule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-gray-500">
                        {rule.sourcePattern} → {rule.targetColumn}
                      </div>
                    </div>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      Priority: {rule.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Excel File Viewer & Editor</h2>
        <p className="text-gray-600">
          Advanced Excel analysis with pattern recognition, formula processing, and intelligent transformation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload & Analyze
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Analysis Results
          </TabsTrigger>
          <TabsTrigger value="transform" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Transform & Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">{renderUploadTab()}</TabsContent>
        <TabsContent value="analysis">{renderAnalysisTab()}</TabsContent>
        <TabsContent value="transform">{renderTransformTab()}</TabsContent>
      </Tabs>
    </div>
  );
}