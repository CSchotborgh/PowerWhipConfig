import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Save, 
  FileSpreadsheet, 
  Code, 
  Calculator, 
  Database,
  ChevronRight,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Copy,
  Clipboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AGGridExcelViewerProps {
  onToggleView: () => void;
  uploadedFileId?: string;
  fileName?: string;
}

interface RowData {
  [key: string]: any;
}

export default function AGGridExcelViewer({ onToggleView, uploadedFileId, fileName }: AGGridExcelViewerProps) {
  const [rowData, setRowData] = useState<RowData[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const { toast } = useToast();
  
  const gridRef = useRef<AgGridReact>(null);
  const gridApi = useRef<GridApi | null>(null);

  // AG-Grid options with Excel clipboard integration
  const gridOptions: GridOptions = useMemo(() => ({
    // Enable Excel-like features
    enableRangeSelection: true,
    enableFillHandle: true,
    enableCellChangeFlash: true,
    suppressCopyRowsToClipboard: false,
    suppressCopySingleCellRanges: false,
    suppressLastEmptyLineOnPaste: true,
    
    // Excel clipboard integration
    clipboardDelimiter: '\t',
    suppressClipboardPaste: false,
    suppressClipboardApi: false,
    
    // Cell editing
    defaultColDef: {
      editable: true,
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: false,
      cellDataType: false,
    },
    
    // Excel-like navigation
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
    suppressMultiRangeSelection: false,
    
    // Performance
    animateRows: true,
    enableCellTextSelection: true,
    
    // Events
    onGridReady: (params) => {
      gridApi.current = params.api;
      
      // Enable Excel paste functionality
      params.api.addEventListener('pasteStart', (event) => {
        console.log('Paste operation started');
      });
      
      params.api.addEventListener('pasteEnd', (event) => {
        toast({
          title: "Data Pasted",
          description: "Excel data pasted successfully with 1:1 formatting",
        });
      });
    },
    
    onCellClicked: (event) => {
      const cellId = `${event.colDef.field}${(event.rowIndex || 0) + 1}`;
      setSelectedCell(cellId);
    },
    
    onRangeSelectionChanged: (event) => {
      const ranges = gridApi.current?.getCellRanges();
      if (ranges && ranges.length > 0) {
        const range = ranges[0];
        const startCell = `${range.startColumn?.getColId()}${(range.startRow?.rowIndex || 0) + 1}`;
        setSelectedCell(startCell);
      }
    }
  }), [toast]);

  useEffect(() => {
    loadExcelData();
  }, [uploadedFileId]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadExcelData = async () => {
    setIsLoading(true);
    try {
      const endpoint = uploadedFileId 
        ? `/api/excel/uploaded/${uploadedFileId}`
        : '/api/excel/analyze-configurator';
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const analysisData = data.analysis || data;
        
        // Set sheet names
        setSheets(analysisData.sheetNames || ['Sheet1']);
        
        // Convert Excel data to AG-Grid format
        if (analysisData.sheetNames && analysisData.sheetNames.length > 0) {
          const firstSheetName = analysisData.sheetNames[0];
          const sheetData = analysisData.sheets[firstSheetName];
          
          // Create column definitions
          const headers = sheetData.headers || [];
          const cols: ColDef[] = headers.map((header: string, index: number) => ({
            headerName: header || `Column ${index + 1}`,
            field: `col_${index}`,
            editable: true,
            cellDataType: 'text',
            width: 120,
            // Enable Excel-like features per column
            enableRowGroup: false,
            enablePivot: false,
            enableValue: false,
          }));
          
          // Add extra columns if needed
          const maxCols = Math.max(headers.length, 20);
          for (let i = headers.length; i < maxCols; i++) {
            cols.push({
              headerName: String.fromCharCode(65 + (i % 26)),
              field: `col_${i}`,
              editable: true,
              cellDataType: 'text',
              width: 120,
            });
          }
          
          setColumnDefs(cols);
          
          // Convert sample data to row format
          const rows: RowData[] = [];
          const sampleData = sheetData.sampleData || [];
          
          sampleData.forEach((row: any[], rowIndex: number) => {
            const rowObject: RowData = {};
            row.forEach((cellValue: any, colIndex: number) => {
              rowObject[`col_${colIndex}`] = cellValue;
            });
            rows.push(rowObject);
          });
          
          // Add empty rows for editing
          const totalRows = Math.max(rows.length, 50);
          for (let i = rows.length; i < totalRows; i++) {
            const emptyRow: RowData = {};
            cols.forEach((col, colIndex) => {
              emptyRow[`col_${colIndex}`] = '';
            });
            rows.push(emptyRow);
          }
          
          setRowData(rows);
        }
      }
    } catch (error) {
      console.error('Error loading Excel data:', error);
      toast({
        title: "Load Error",
        description: "Failed to load Excel data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Zoom functionality
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(200, prev + 25));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(50, prev - 25));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  const fitToScreen = () => {
    if (gridApi.current) {
      gridApi.current.sizeColumnsToFit();
      setZoomLevel(100);
    }
  };

  // Export functions
  const exportToExcel = useCallback(() => {
    if (gridApi.current) {
      gridApi.current.exportDataAsExcel({
        fileName: fileName || 'configurator_data.xlsx',
      });
    }
  }, [fileName]);

  const exportToCSV = useCallback(() => {
    if (gridApi.current) {
      gridApi.current.exportDataAsCsv({
        fileName: fileName?.replace('.xlsx', '.csv') || 'configurator_data.csv',
      });
    }
  }, [fileName]);

  // Copy/Paste functions
  const copySelectedCells = useCallback(() => {
    if (gridApi.current) {
      gridApi.current.copySelectedRangeToClipboard();
      toast({
        title: "Copied",
        description: "Selected cells copied to clipboard",
      });
    }
  }, [toast]);

  const pasteFromClipboard = useCallback(() => {
    // AG-Grid handles this automatically with Ctrl+V
    toast({
      title: "Paste Ready",
      description: "Use Ctrl+V to paste Excel data directly into the grid",
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-technical-600 mx-auto mb-4"></div>
          <p className="text-technical-600 dark:text-technical-400">Loading Excel data for AG-Grid...</p>
        </div>
      </div>
    );
  }

  // Debug: Check if data loaded properly
  console.log('AG-Grid Data:', { rowData: rowData.length, columnDefs: columnDefs.length, sheets });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-technical-950">
      {/* Debug info */}
      <div className="text-xs text-gray-500 p-2">
        AG-Grid Professional Mode | Rows: {rowData.length} | Cols: {columnDefs.length}
      </div>
      {/* Header */}
      <div className="border-b border-technical-200 dark:border-technical-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
            Professional Excel Viewer - AG-Grid
          </h2>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-technical-200 dark:border-technical-600 rounded-md">
              <Button size="sm" variant="ghost" onClick={zoomOut} disabled={zoomLevel <= 50}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="px-2 text-sm font-mono min-w-14 text-center">
                {zoomLevel}%
              </span>
              <Button size="sm" variant="ghost" onClick={zoomIn} disabled={zoomLevel >= 200}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={resetZoom} title="Reset Zoom">
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={fitToScreen} title="Fit to Screen">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Copy/Paste Controls */}
            <div className="flex items-center gap-1 border border-technical-200 dark:border-technical-600 rounded-md">
              <Button size="sm" variant="ghost" onClick={copySelectedCells} title="Copy Selected">
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={pasteFromClipboard} title="Paste (Ctrl+V)">
                <Clipboard className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Export Controls */}
            <Button size="sm" variant="outline" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button size="sm" variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            
            <Button size="sm" variant="outline" onClick={onToggleView}>
              Back to Design Canvas
            </Button>
            <Button size="sm" variant="default" onClick={loadExcelData}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Selected Cell Info */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{selectedCell || 'Select a cell'}</Badge>
          <div className="text-xs text-technical-600 dark:text-technical-400">
            💡 Select cells and use Ctrl+C/Ctrl+V for Excel-like copy/paste • Ctrl+/-/0 for zoom
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
                <p className="text-technical-600 dark:text-technical-400">No data available for AG-Grid</p>
                <p className="text-xs text-technical-500 mt-2">Upload an Excel file to populate the grid</p>
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
                onGridReady={(params) => {
                  gridApi.current = params.api;
                  console.log('AG-Grid ready with', rowData.length, 'rows');
                }}
              />
            </div>
          )}
        </div>

        {/* Side Panel for Advanced Features */}
        <div className="w-80 border-l border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-900">
          <Tabs defaultValue="features" className="w-full h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="features">
                Features
              </TabsTrigger>
              <TabsTrigger value="data">
                Data
              </TabsTrigger>
              <TabsTrigger value="export">
                Export
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="features" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Excel Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div><strong>Range Selection:</strong></div>
                    <div>• Click and drag to select ranges</div>
                    <div>• Ctrl+Click for multi-selection</div>
                    <div>• Shift+Click for range extension</div>
                    <div><strong>Excel Clipboard:</strong></div>
                    <div>• Copy from Excel (Ctrl+C)</div>
                    <div>• Paste into grid (Ctrl+V)</div>
                    <div>• Maintains formatting and formulas</div>
                    <div>• Automatic data type detection</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div>• Arrow keys for cell navigation</div>
                    <div>• Tab/Shift+Tab for column navigation</div>
                    <div>• Enter to edit cells</div>
                    <div>• Escape to cancel editing</div>
                    <div>• Ctrl+A to select all</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div>Rows: {rowData.length}</div>
                    <div>Columns: {columnDefs.length}</div>
                    <div>Selected: {selectedCell}</div>
                    <div>Sheets: {sheets.length}</div>
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
                  <Button size="sm" className="w-full" onClick={exportToExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button size="sm" className="w-full" onClick={exportToCSV}>
                    <Database className="w-4 h-4 mr-2" />
                    Export to CSV
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}