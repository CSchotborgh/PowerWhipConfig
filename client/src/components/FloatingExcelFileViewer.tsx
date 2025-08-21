import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  Edit3
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface FileMetadata {
  fileId: string;
  originalName: string;
  uploadedAt: string;
  analysis: {
    sheetNames: string[];
    sheets: Record<string, {
      rowCount: number;
      columnCount: number;
      headers: string[];
      sampleData: any[][];
    }>;
  };
}

interface ExcelData {
  cols: number;
  rows: number;
  data: any[][];
  columnDefs: any[];
  rowData: any[];
}

export function FloatingExcelFileViewer() {
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/excel/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadedFiles(prev => [...prev, result]);
      
      // Auto-select the newly uploaded file
      setSelectedFile(result);
      if (result.analysis.sheetNames.length > 0) {
        setSelectedSheet(result.analysis.sheetNames[0]);
        await loadSheetData(result.fileId, result.analysis.sheetNames[0]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  }, []);

  const loadSheetData = useCallback(async (fileId: string, sheetName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/excel/sheet-data/${fileId}/${encodeURIComponent(sheetName)}`);
      if (!response.ok) {
        throw new Error(`Failed to load sheet data: ${response.statusText}`);
      }
      
      const data: ExcelData = await response.json();
      setExcelData(data);
    } catch (error) {
      console.error('Failed to load sheet data:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to load sheet data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSheetChange = useCallback(async (sheetName: string) => {
    if (!selectedFile) return;
    setSelectedSheet(sheetName);
    await loadSheetData(selectedFile.fileId, sheetName);
  }, [selectedFile, loadSheetData]);

  const handleFileSelect = useCallback(async (file: FileMetadata) => {
    setSelectedFile(file);
    if (file.analysis.sheetNames.length > 0) {
      const firstSheet = file.analysis.sheetNames[0];
      setSelectedSheet(firstSheet);
      await loadSheetData(file.fileId, firstSheet);
    }
  }, [loadSheetData]);

  const handleDeleteFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/excel/delete/${fileId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      setUploadedFiles(prev => prev.filter(f => f.fileId !== fileId));
      if (selectedFile?.fileId === fileId) {
        setSelectedFile(null);
        setSelectedSheet('');
        setExcelData(null);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }, [selectedFile]);

  const handleExportExcel = useCallback(async () => {
    if (!excelData || !selectedFile || !selectedSheet) return;

    try {
      const response = await fetch('/api/excel/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.originalName,
          sheetName: selectedSheet,
          data: excelData.rowData,
          columns: excelData.columnDefs.map(col => col.field),
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `edited_${selectedFile.originalName}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [excelData, selectedFile, selectedSheet]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-950">
      <Tabs defaultValue="upload" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload & Manage
          </TabsTrigger>
          <TabsTrigger value="viewer" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Spreadsheet Viewer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Excel File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Choose Excel file (.xlsx, .xls)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="mt-1"
                  />
                </div>
                
                {isUploading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading and analyzing file...</span>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <div key={file.fileId} 
                         className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                           selectedFile?.fileId === file.fileId ? 'bg-blue-50 border-blue-200' : ''
                         }`}
                         onClick={() => handleFileSelect(file)}>
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">{file.originalName}</div>
                          <div className="text-sm text-gray-500">
                            {file.analysis.sheetNames.length} sheet{file.analysis.sheetNames.length !== 1 ? 's' : ''}
                            {' • '}
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.analysis.sheetNames.map(sheetName => (
                          <Badge key={sheetName} variant="secondary" className="text-xs">
                            {sheetName}
                          </Badge>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.fileId);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="viewer" className="flex-1 flex flex-col">
          {!selectedFile ? (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No File Selected</h3>
                <p className="text-gray-500">Upload and select an Excel file to view its contents</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Sheet Selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-medium">{selectedFile.originalName}</h3>
                  {selectedFile.analysis.sheetNames.length > 1 && (
                    <div className="flex gap-1">
                      {selectedFile.analysis.sheetNames.map(sheetName => (
                        <Button
                          key={sheetName}
                          variant={selectedSheet === sheetName ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSheetChange(sheetName)}
                        >
                          {sheetName}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {editMode ? 'View' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={!excelData}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Data Grid */}
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading sheet data...</span>
                  </div>
                </div>
              ) : excelData ? (
                <div className="flex-1 ag-theme-alpine">
                  <AgGridReact
                    columnDefs={excelData.columnDefs}
                    rowData={excelData.rowData}
                    defaultColDef={{
                      resizable: true,
                      sortable: true,
                      filter: true,
                      editable: editMode,
                      minWidth: 100,
                    }}
                    suppressMenuHide={true}
                    animateRows={true}
                    enableCellTextSelection={true}
                    ensureDomOrder={true}
                    domLayout="normal"
                  />
                </div>
              ) : (
                <Card className="flex-1 flex items-center justify-center">
                  <CardContent className="text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-gray-500">Failed to load sheet data</p>
                  </CardContent>
                </Card>
              )}

              {/* Sheet Info */}
              {excelData && (
                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                  <span>{excelData.rows} rows × {excelData.cols} columns</span>
                  <div className="flex items-center gap-4">
                    {editMode && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Edit3 className="h-3 w-3" />
                        <span>Edit Mode</span>
                      </div>
                    )}
                    <span>Sheet: {selectedSheet}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}