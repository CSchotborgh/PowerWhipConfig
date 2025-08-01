import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileSpreadsheet, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExcelLikeInterface from './ExcelLikeInterface';
import AGGridExcelViewer from './AGGridExcelViewer';

interface ExcelFileViewerProps {
  onToggleView: () => void;
}

export default function ExcelFileViewer({ onToggleView }: ExcelFileViewerProps) {
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showExcelInterface, setShowExcelInterface] = useState(false);
  const [viewMode, setViewMode] = useState<'basic' | 'professional'>('professional');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
          description: `${data.originalName} is ready for viewing and editing`,
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

  const closeFile = () => {
    setUploadedFileId(null);
    setUploadedFileName('');
    setAnalysis(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
              {uploadedFileName ? `Excel Viewer: ${uploadedFileName}` : 'Excel File Viewer & Editor'}
            </h2>
            <p className="text-sm text-technical-600 dark:text-technical-400 mt-1">
              {uploadedFileName 
                ? 'Full Excel editing with functions, expressions, sheets, and VB script capabilities'
                : 'Upload any Excel file to view and edit with full spreadsheet functionality'
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
                onClick={closeFile}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Close File
              </Button>
            )}
            <Button onClick={onToggleView} variant="outline">
              Back to Design Canvas
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Show Excel Editor when file is uploaded */}
        {uploadedFileName && uploadedFileId ? (
          <div className="h-full">
            {/* View Mode Selector */}
            <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-900">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-technical-700 dark:text-technical-300">
                  Viewer Mode:
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'professional' ? 'default' : 'outline'}
                    onClick={() => setViewMode('professional')}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Professional (AG-Grid)
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'basic' ? 'default' : 'outline'}
                    onClick={() => setViewMode('basic')}
                  >
                    Basic Interface
                  </Button>
                </div>
                <Badge variant="outline" className="ml-auto">
                  Excel Paste: {viewMode === 'professional' ? 'Full 1:1 Support' : 'Basic Support'}
                </Badge>
              </div>
            </div>
            
            {/* Render appropriate interface */}
            {viewMode === 'professional' ? (
              <AGGridExcelViewer 
                onToggleView={closeFile}
                uploadedFileId={uploadedFileId}
                fileName={uploadedFileName}
              />
            ) : (
              <ExcelLikeInterface 
                onToggleView={closeFile}
                uploadedFileId={uploadedFileId}
                fileName={uploadedFileName}
              />
            )}
          </div>
        ) : (
          /* Upload Prompt */
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Excel File Editor
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    size="sm"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload Excel File'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-technical-400" />
                  <h3 className="text-lg font-medium mb-2">Upload Excel File for Editing</h3>
                  <p className="text-technical-600 dark:text-technical-400 mb-6">
                    Upload any Excel file (.xlsx/.xls) to view and edit it with full spreadsheet functionality
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-left max-w-2xl mx-auto mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>View all sheets and tabs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Edit cells with formulas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Execute VB scripts</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>API integration capabilities</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Function calculations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Expression processing</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-5 h-5 mr-2" />
                    )}
                    Choose Excel File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}