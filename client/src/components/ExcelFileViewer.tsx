import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileSpreadsheet, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExcelLikeInterface from './ExcelLikeInterface';
import AGGridProfessional from './AGGridProfessional';
import UnifiedFileUpload from './UnifiedFileUpload';

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
              <div className="h-full">
                <AGGridProfessional 
                  onToggleView={closeFile}
                  uploadedFileId={uploadedFileId}
                  fileName={uploadedFileName}
                />
              </div>
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
            <UnifiedFileUpload
              mode="excel-viewer"
              onFileUploaded={(fileId, fileName, analysis) => {
                setUploadedFileId(fileId);
                setUploadedFileName(fileName);
                setAnalysis(analysis);
              }}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}