import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Search, 
  Download, 
  Archive, 
  Formula, 
  Pattern, 
  FileText,
  Database,
  Calculator,
  Layers,
  Code,
  FileSpreadsheet,
  BookOpen,
  Filter,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExcelFormulaLibraryProps {
  onToggleView: () => void;
}

export default function ExcelFormulaLibrary({ onToggleView }: ExcelFormulaLibraryProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch formulas from library
  const { data: formulas = [], isLoading: formulasLoading } = useQuery({
    queryKey: ['/api/excel/formulas', selectedCategory],
    queryFn: () => fetch(`/api/excel/formulas${selectedCategory ? `?category=${selectedCategory}` : ''}`).then(res => res.json())
  });

  // Fetch patterns from library
  const { data: patterns = [], isLoading: patternsLoading } = useQuery({
    queryKey: ['/api/excel/patterns'],
    queryFn: () => fetch('/api/excel/patterns').then(res => res.json())
  });

  // Fetch archived files
  const { data: archivedFiles = [], isLoading: archiveLoading } = useQuery({
    queryKey: ['/api/excel/archive'],
    queryFn: () => fetch('/api/excel/archive').then(res => res.json())
  });

  // Search formulas mutation
  const searchFormulasMutation = useMutation({
    mutationFn: (searchTerm: string) => 
      fetch(`/api/excel/formulas/search?q=${encodeURIComponent(searchTerm)}`).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/excel/formulas/search', searchTerm], data);
    }
  });

  // Upload and analyze Excel file
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('excelFile', file);
      
      const response = await fetch('/api/excel/analyze-formulas', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze Excel file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Excel Analysis Complete",
        description: data.message
      });
      
      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/excel/formulas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/excel/patterns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/excel/archive'] });
      
      setActiveTab('formulas');
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchFormulasMutation.mutate(searchTerm.trim());
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'CALCULATION': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'LOOKUP': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'CONDITIONAL': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'TEXT_MANIPULATION': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'DATE_TIME': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'FINANCIAL': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getComplexityColor = (complexity: string) => {
    const colors: { [key: string]: string } = {
      'SIMPLE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'INTERMEDIATE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'ADVANCED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[complexity] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-technical-50 to-technical-100 dark:from-technical-950 dark:to-technical-900">
      {/* Header */}
      <div className="border-b border-technical-200 dark:border-technical-700 bg-white/80 dark:bg-technical-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleView}
              className="text-technical-600 hover:text-technical-900 dark:text-technical-400 dark:hover:text-technical-100"
            >
              ← Back to Excel Viewer
            </Button>
            <div className="h-6 w-px bg-technical-300 dark:bg-technical-600" />
            <Database className="w-6 h-6 text-technical-600 dark:text-technical-400" />
            <div>
              <h1 className="text-xl font-semibold text-technical-900 dark:text-technical-100">
                Excel Formula Library
              </h1>
              <p className="text-sm text-technical-600 dark:text-technical-400">
                Archive and reuse Excel formulas and patterns
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {formulas.length} Formulas
            </Badge>
            <Badge variant="outline" className="text-xs">
              {patterns.length} Patterns
            </Badge>
            <Badge variant="outline" className="text-xs">
              {archivedFiles.length} Files
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload & Analyze
            </TabsTrigger>
            <TabsTrigger value="formulas" className="flex items-center gap-2">
              <Formula className="w-4 h-4" />
              Formula Library
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Pattern className="w-4 h-4" />
              Pattern Library
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              File Archive
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Excel Formula Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="border-2 border-dashed border-technical-300 dark:border-technical-600 rounded-lg p-8">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-technical-400" />
                    <h3 className="text-lg font-medium mb-2">Upload Excel File for Analysis</h3>
                    <p className="text-technical-600 dark:text-technical-400 mb-4">
                      Extract formulas, patterns, and expressions to build your reusable library
                    </p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="mb-4"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Excel File
                        </>
                      )}
                    </Button>
                    
                    <div className="text-sm text-technical-500 dark:text-technical-400">
                      Supports .xlsx and .xls files up to 200MB
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Calculator className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Formula Extraction</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Automatically extracts and categorizes all Excel formulas
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium text-green-900 dark:text-green-100">Pattern Recognition</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Identifies repeating patterns and formula sequences
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Library Building</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Creates reusable templates and expression libraries
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Formulas Tab */}
          <TabsContent value="formulas" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-technical-400" />
                <Input
                  placeholder="Search formulas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
                Search
              </Button>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-technical-300 dark:border-technical-600 rounded-md bg-white dark:bg-technical-800"
              >
                <option value="">All Categories</option>
                <option value="CALCULATION">Calculation</option>
                <option value="LOOKUP">Lookup</option>
                <option value="CONDITIONAL">Conditional</option>
                <option value="TEXT_MANIPULATION">Text</option>
                <option value="DATE_TIME">Date/Time</option>
                <option value="FINANCIAL">Financial</option>
              </select>
            </div>

            <div className="grid gap-4">
              {formulasLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-technical-300 border-t-technical-600 rounded-full animate-spin mx-auto mb-4" />
                  Loading formulas...
                </div>
              ) : formulas.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Formula className="w-12 h-12 mx-auto mb-4 text-technical-400" />
                    <h3 className="text-lg font-medium mb-2">No Formulas Found</h3>
                    <p className="text-technical-600 dark:text-technical-400">
                      Upload an Excel file to start building your formula library
                    </p>
                  </CardContent>
                </Card>
              ) : (
                formulas.map((formula: any) => (
                  <Card key={formula.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(formula.category)}>
                            {formula.category}
                          </Badge>
                          <Badge className={getComplexityColor(formula.complexity)}>
                            {formula.complexity}
                          </Badge>
                        </div>
                        <div className="text-sm text-technical-500 dark:text-technical-400">
                          {formula.cellReference} • {formula.sheetName}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <code className="bg-technical-100 dark:bg-technical-800 px-2 py-1 rounded text-sm font-mono">
                          {formula.formulaText}
                        </code>
                      </div>
                      
                      <p className="text-technical-700 dark:text-technical-300 mb-3">
                        {formula.description}
                      </p>
                      
                      {formula.dependencies && formula.dependencies.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-technical-600 dark:text-technical-400 mb-1">
                            Dependencies:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {formula.dependencies.map((dep: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-technical-500 dark:text-technical-400">
                        <span>From: {formula.fileName}</span>
                        <span>Used {formula.usage || 0} times</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <div className="grid gap-4">
              {patternsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-technical-300 border-t-technical-600 rounded-full animate-spin mx-auto mb-4" />
                  Loading patterns...
                </div>
              ) : patterns.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Pattern className="w-12 h-12 mx-auto mb-4 text-technical-400" />
                    <h3 className="text-lg font-medium mb-2">No Patterns Found</h3>
                    <p className="text-technical-600 dark:text-technical-400">
                      Upload Excel files with repeating patterns to build your pattern library
                    </p>
                  </CardContent>
                </Card>
              ) : (
                patterns.map((pattern: any) => (
                  <Card key={pattern.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {pattern.patternType}
                          </Badge>
                          {pattern.isTemplate && (
                            <Badge variant="outline">Template</Badge>
                          )}
                        </div>
                        <div className="text-sm text-technical-500 dark:text-technical-400">
                          {pattern.cellRange} • {pattern.sheetName}
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-technical-900 dark:text-technical-100 mb-2">
                        {pattern.patternName}
                      </h4>
                      
                      <p className="text-technical-700 dark:text-technical-300 mb-3">
                        {pattern.businessLogic}
                      </p>
                      
                      {pattern.tags && pattern.tags.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {pattern.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-technical-500 dark:text-technical-400">
                        <span>From: {pattern.fileName}</span>
                        <span>Used {pattern.usage || 0} times</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="space-y-6">
            <div className="grid gap-4">
              {archiveLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-technical-300 border-t-technical-600 rounded-full animate-spin mx-auto mb-4" />
                  Loading archive...
                </div>
              ) : archivedFiles.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Archive className="w-12 h-12 mx-auto mb-4 text-technical-400" />
                    <h3 className="text-lg font-medium mb-2">No Archived Files</h3>
                    <p className="text-technical-600 dark:text-technical-400">
                      Upload and analyze Excel files to build your archive
                    </p>
                  </CardContent>
                </Card>
              ) : (
                archivedFiles.map((file: any) => (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-technical-600 dark:text-technical-400" />
                          <h4 className="font-medium text-technical-900 dark:text-technical-100">
                            {file.fileName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(file.businessDomain)}>
                            {file.businessDomain}
                          </Badge>
                          <Badge className={getComplexityColor(file.complexity)}>
                            {file.complexity}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-technical-900 dark:text-technical-100">
                            {file.sheetCount}
                          </div>
                          <div className="text-xs text-technical-500 dark:text-technical-400">Sheets</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-technical-900 dark:text-technical-100">
                            {file.formulaCount}
                          </div>
                          <div className="text-xs text-technical-500 dark:text-technical-400">Formulas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-technical-900 dark:text-technical-100">
                            {file.patternCount}
                          </div>
                          <div className="text-xs text-technical-500 dark:text-technical-400">Patterns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-technical-900 dark:text-technical-100">
                            {((file.fileSize || 0) / 1024).toFixed(1)}KB
                          </div>
                          <div className="text-xs text-technical-500 dark:text-technical-400">Size</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-technical-500 dark:text-technical-400">
                        <span>Processed: {new Date(file.createdAt).toLocaleDateString()}</span>
                        <Badge variant="outline" className={file.isProcessed ? 'text-green-600' : 'text-yellow-600'}>
                          {file.isProcessed ? 'Processed' : 'Pending'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}