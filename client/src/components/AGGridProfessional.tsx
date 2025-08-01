import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridOptions, RangeSelectionChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Clipboard, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Grid3X3,
  MousePointer,
  Settings,
  Upload,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AGGridProfessionalProps {
  onToggleView: () => void;
  uploadedFileId: string;
  fileName: string;
}

export default function AGGridProfessional({ onToggleView, uploadedFileId, fileName }: AGGridProfessionalProps) {
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string>(uploadedFileId);
  const [currentFileName, setCurrentFileName] = useState<string>(fileName);
  const { toast } = useToast();
  
  const gridRef = useRef<AgGridReact>(null);
  const gridApi = useRef<GridApi | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
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
        setCurrentFileId(data.fileId);
        setCurrentFileName(data.originalName);
        
        toast({
          title: "File Uploaded Successfully",
          description: `${data.originalName} is ready for AG-Grid professional editing`,
        });
        
        // Load the new file data
        await loadExcelData(data.fileId);
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

  // Load Excel data
  const loadExcelData = useCallback(async (fileId?: string) => {
    const targetFileId = fileId || currentFileId;
    if (!targetFileId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/excel/uploaded/${targetFileId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('AG-Grid Professional: Loading data', data);
        
        if (data.analysis?.sheets && data.analysis.sheets.length > 0) {
          const currentSheet = data.analysis.sheets[activeSheet] || data.analysis.sheets[0];
          setSheets(data.analysis.sheets.map((sheet: any) => sheet.name));
          
          if (currentSheet.data && currentSheet.data.length > 0) {
            // Generate column definitions
            const headers = Object.keys(currentSheet.data[0]);
            const cols: ColDef[] = headers.map((header, index) => ({
              field: header,
              headerName: header || `Column ${index + 1}`,
              resizable: true,
              sortable: true,
              filter: true,
              editable: true,
              enableRangeSelection: true,
              enableFillHandle: true,
              suppressKeyboardEvent: (params) => {
                // Allow Excel-like navigation
                if (params.event?.key === 'Tab' || params.event?.key === 'Enter') {
                  return false;
                }
                return false;
              }
            }));
            
            setColumnDefs(cols);
            setRowData(currentSheet.data);
            
            toast({
              title: "AG-Grid Professional Loaded",
              description: `${currentSheet.data.length} rows loaded with enterprise features enabled`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load Excel data:', error);
      toast({
        title: "Loading Failed",
        description: "Could not load Excel data for AG-Grid",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentFileId, activeSheet, toast]);

  useEffect(() => {
    loadExcelData();
  }, [loadExcelData]);

  // AG-Grid Enterprise options
  const gridOptions: GridOptions = useMemo(() => ({
    // Enterprise Features
    enableRangeSelection: true,
    enableFillHandle: true,
    
    // Excel Features
    enableClipboard: true,
    clipboardDelimiter: '\t',
    suppressExcelExport: false,
    
    // Row and Column Features
    rowSelection: 'multiple',
    columnHoverHighlight: true,
    
    // Navigation
    suppressClickEdit: false,
    editType: 'fullRow',
    
    // Performance
    animateRows: true,
    enableCellTextSelection: true,
    
    // Events
    onGridReady: (params) => {
      gridApi.current = params.api;
      
      // Set up enterprise license
      console.log('AG-Grid Enterprise ready');
      
      // Auto-size columns
      params.api.sizeColumnsToFit();
      
      // Show enterprise features toast
      toast({
        title: "AG-Grid Enterprise Active",
        description: "Professional Excel features enabled: Range selection, fill handle, advanced clipboard",
        duration: 3000,
      });
    },
    
    onCellClicked: (event) => {
      const cellId = `${event.colDef.field}${(event.rowIndex || 0) + 1}`;
      setSelectedCell(cellId);
    },
    
    onRangeSelectionChanged: (event: RangeSelectionChangedEvent) => {
      const ranges = gridApi.current?.getCellRanges();
      if (ranges && ranges.length > 0) {
        const range = ranges[0];
        const startCol = range.startColumn?.getColId() || '';
        const endCol = range.columns?.[range.columns.length - 1]?.getColId() || startCol;
        const startRow = (range.startRow?.rowIndex || 0) + 1;
        const endRow = (range.endRow?.rowIndex || 0) + 1;
        
        setSelectedRange(`${startCol}${startRow}:${endCol}${endRow}`);
        setSelectedCell(`${startCol}${startRow}`);
      }
    },
    
    onCellValueChanged: (event) => {
      console.log('Cell value changed:', event);
    },
    
    // Excel paste processing
    processCellFromClipboard: (params) => {
      return params.value;
    },
    
    processDataFromClipboard: (params) => {
      // Handle multi-row Excel paste
      return params.data;
    }
  }), [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case 'c':
            // Copy functionality is handled by AG-Grid
            break;
          case 'v':
            // Paste functionality is handled by AG-Grid
            break;
          case '=':
          case '+':
            event.preventDefault();
            setZoomLevel(prev => Math.min(200, prev + 10));
            break;
          case '-':
            event.preventDefault();
            setZoomLevel(prev => Math.max(50, prev - 10));
            break;
          case '0':
            event.preventDefault();
            setZoomLevel(100);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Export functions
  const exportToExcel = useCallback(() => {
    if (gridApi.current) {
      gridApi.current.exportDataAsExcel({
        fileName: `${currentFileName.replace('.xlsx', '')}_edited.xlsx`,
        sheetName: sheets[activeSheet] || 'Sheet1'
      });
    }
  }, [currentFileName, sheets, activeSheet]);

  const exportToCSV = useCallback(() => {
    if (gridApi.current) {
      gridApi.current.exportDataAsCsv({
        fileName: `${currentFileName.replace('.xlsx', '')}_edited.csv`
      });
    }
  }, [currentFileName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-technical-600 mx-auto mb-4"></div>
          <p className="text-technical-600 dark:text-technical-400">Loading AG-Grid Enterprise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-technical-950">
      
      {/* Header */}
      <div className="border-b border-technical-200 dark:border-technical-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="default" className="bg-green-600 text-white">
              <Grid3X3 className="w-3 h-3 mr-1" />
              AG-Grid Enterprise
            </Badge>
            <h3 className="text-lg font-semibold text-technical-900 dark:text-technical-100">
              {currentFileName || 'No file loaded'}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Excel'}
            </Button>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-md">
              <Button size="sm" variant="ghost" onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="px-2 text-xs">{zoomLevel}%</span>
              <Button size="sm" variant="ghost" onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Copy/Paste Buttons */}
            <Button size="sm" variant="outline" onClick={() => {
              toast({
                title: "Copy/Paste Active",
                description: "Use Ctrl+C/Ctrl+V directly in the grid for Excel-like copy/paste",
              });
            }}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            
            <Button size="sm" variant="outline" onClick={() => {
              toast({
                title: "Paste Ready",
                description: "Click a cell and use Ctrl+V to paste Excel data",
              });
            }}>
              <Clipboard className="w-4 h-4 mr-2" />
              Paste
            </Button>
            
            <Button size="sm" variant="outline" onClick={onToggleView}>
              Back to Design Canvas
            </Button>
            <Button size="sm" variant="default" onClick={() => loadExcelData()}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Selection Info */}
        <div className="flex items-center gap-4 mb-2">
          <Badge variant="outline">
            <MousePointer className="w-3 h-3 mr-1" />
            Cell: {selectedCell || 'Select a cell'}
          </Badge>
          {selectedRange && (
            <Badge variant="outline">
              Range: {selectedRange}
            </Badge>
          )}
          <div className="text-xs text-technical-600 dark:text-technical-400">
            ✨ Enterprise Features: Range selection • Fill handle • Advanced clipboard • Excel export
          </div>
        </div>

        {/* Sheet Tabs */}
        {sheets.length > 0 && (
          <div className="flex gap-1 mt-2">
            {sheets.map((sheetName, index) => (
              <Button
                key={sheetName}
                size="sm"
                variant={index === activeSheet ? "default" : "outline"}
                onClick={() => setActiveSheet(index)}
                className="text-xs"
              >
                {sheetName}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* AG-Grid Container */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          {rowData.length === 0 && columnDefs.length === 0 ? (
            <div className="flex items-center justify-center h-64 border border-dashed border-technical-300 dark:border-technical-600 rounded-lg">
              <div className="text-center">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-technical-400" />
                <p className="text-technical-600 dark:text-technical-400">No data available for AG-Grid Enterprise</p>
                <p className="text-xs text-technical-500 mt-2">Upload an Excel file to populate the professional grid</p>
                <Button 
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Excel File'}
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="ag-theme-alpine h-full"
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
                width: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : '100%',
                height: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : '100%',
                minHeight: '400px'
              }}
            >
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                gridOptions={gridOptions}
              />
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-900">
          <Tabs defaultValue="enterprise" className="w-full h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="enterprise">
                Enterprise
              </TabsTrigger>
              <TabsTrigger value="export">
                Export
              </TabsTrigger>
              <TabsTrigger value="settings">
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="enterprise" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Enterprise Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs space-y-2">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <div className="font-medium text-green-800 dark:text-green-200">✓ Range Selection</div>
                      <div className="text-green-600 dark:text-green-300">Click and drag to select cell ranges</div>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="font-medium text-blue-800 dark:text-blue-200">✓ Fill Handle</div>
                      <div className="text-blue-600 dark:text-blue-300">Drag corner of selection to auto-fill</div>
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                      <div className="font-medium text-purple-800 dark:text-purple-200">✓ Excel Clipboard</div>
                      <div className="text-purple-600 dark:text-purple-300">True 1:1 copy/paste from Excel</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="export" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={exportToExcel}
                    disabled={rowData.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={exportToCSV}
                    disabled={rowData.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Grid Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div><strong>Rows:</strong> {rowData.length}</div>
                    <div><strong>Columns:</strong> {columnDefs.length}</div>
                    <div><strong>Zoom:</strong> {zoomLevel}%</div>
                    <div><strong>Selected:</strong> {selectedCell || 'None'}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}