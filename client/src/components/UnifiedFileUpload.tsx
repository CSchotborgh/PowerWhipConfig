import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  Database,
  Calculator,
  Layers,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedFileUploadProps {
  onFileUploaded?: (fileId: string, fileName: string, analysis?: any) => void;
  onAnalysisComplete?: (analysis: any) => void;
  mode: 'excel-viewer' | 'formula-library' | 'configurator';
  className?: string;
}

export default function UnifiedFileUpload({ 
  onFileUploaded, 
  onAnalysisComplete, 
  mode,
  className 
}: UnifiedFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getUploadEndpoint = () => {
    switch (mode) {
      case 'excel-viewer':
        return '/api/excel/upload';
      case 'formula-library':
        return '/api/excel/analyze-formulas';
      case 'configurator':
        return '/api/excel/upload';
      default:
        return '/api/excel/upload';
    }
  };

  const getUploadDescription = () => {
    switch (mode) {
      case 'excel-viewer':
        return 'Upload Excel files for viewing and editing with full spreadsheet functionality';
      case 'formula-library':
        return 'Upload Excel files to extract and archive formulas and patterns';
      case 'configurator':
        return 'Upload Excel files for analysis and configurator data processing';
      default:
        return 'Upload Excel files';
    }
  };

  const getFeaturesList = () => {
    switch (mode) {
      case 'excel-viewer':
        return [
          { icon: FileSpreadsheet, title: 'Full Excel Editing', desc: 'Complete spreadsheet functionality' },
          { icon: Calculator, title: 'Formula Support', desc: 'Advanced formula evaluation' },
          { icon: Layers, title: 'Multi-Sheet', desc: 'Work with multiple worksheets' },
          { icon: Database, title: 'Data Processing', desc: 'Import and export capabilities' }
        ];
      case 'formula-library':
        return [
          { icon: Calculator, title: 'Formula Extraction', desc: 'Automatically extracts all formulas' },
          { icon: Layers, title: 'Pattern Recognition', desc: 'Identifies repeating patterns' },
          { icon: Database, title: 'Library Building', desc: 'Creates reusable templates' },
          { icon: BookOpen, title: 'Categorization', desc: 'Organizes by complexity & type' }
        ];
      case 'configurator':
        return [
          { icon: Database, title: 'Pattern Matching', desc: 'Matches receptacle patterns' },
          { icon: Calculator, title: 'Expression Generation', desc: 'Auto-generates expressions' },
          { icon: Layers, title: 'Data Integration', desc: 'Integrates with dataset' },
          { icon: FileSpreadsheet, title: 'Row Processing', desc: 'Processes configurator data' }
        ];
      default:
        return [];
    }
  };

  const handleFile = async (file: File) => {
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
      const response = await fetch(getUploadEndpoint(), {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        if (mode === 'formula-library') {
          toast({
            title: "Formula Analysis Complete",
            description: data.message || "Successfully analyzed Excel formulas",
          });
          onAnalysisComplete?.(data.analysis);
        } else {
          toast({
            title: "File Uploaded Successfully",
            description: `${file.name} is ready for use`,
          });
          onFileUploaded?.(data.fileId || data.analysisId, file.name, data.analysis);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload the Excel file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const features = getFeaturesList();

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div 
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
            isDragOver 
              ? "border-blue-400 bg-blue-50 dark:bg-blue-950" 
              : "border-technical-300 dark:border-technical-600 hover:border-technical-400 dark:hover:border-technical-500",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <div className="p-8 text-center">
            <div className="mb-4">
              {isUploading ? (
                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
              ) : (
                <div className="relative">
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-technical-400 mb-2" />
                  <Upload className="w-6 h-6 absolute -bottom-1 -right-1 text-blue-600 bg-white dark:bg-technical-900 rounded-full p-1 border-2 border-white dark:border-technical-900" />
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-technical-900 dark:text-technical-100 mb-2">
              {isUploading ? 'Processing...' : 'Upload Excel File'}
            </h3>
            
            <p className="text-technical-600 dark:text-technical-400 mb-4 max-w-md mx-auto">
              {isUploading ? 'Analyzing your file...' : getUploadDescription()}
            </p>

            {!isUploading && (
              <>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="relative"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <span className="text-sm text-technical-500 dark:text-technical-400">
                    or drag and drop
                  </span>
                </div>

                <div className="text-xs text-technical-500 dark:text-technical-400 mb-6">
                  Supports .xlsx and .xls files up to 200MB
                </div>

                {features.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-technical-50 dark:bg-technical-800">
                        <feature.icon className="w-4 h-4 mt-0.5 text-technical-600 dark:text-technical-400 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-technical-900 dark:text-technical-100">
                            {feature.title}
                          </div>
                          <div className="text-xs text-technical-600 dark:text-technical-400">
                            {feature.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}