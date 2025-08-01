import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Formula Cell Component for async formula evaluation
function FormulaCell({ formula, cellRef }: { formula: string; cellRef: string }) {
  const [result, setResult] = useState(formula);
  
  useEffect(() => {
    const evaluateFormula = async () => {
      try {
        const response = await fetch('/api/excel/evaluate-formula', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formula, cellRef, sheetData: {} })
        });
        
        if (response.ok) {
          const data = await response.json();
          setResult(data.result);
        }
      } catch (error) {
        setResult('#ERROR!');
      }
    };
    
    if (formula.startsWith('=')) {
      evaluateFormula();
    }
  }, [formula, cellRef]);
  
  return <span>{result}</span>;
}

interface ExcelLikeInterfaceProps {
  onToggleView?: () => void;
  uploadedFileId?: string | null;
  fileName?: string;
}

interface CellData {
  value: string;
  formula?: string;
  type: 'text' | 'number' | 'formula' | 'dropdown';
  validation?: string[];
  style?: {
    backgroundColor?: string;
    fontWeight?: string;
    color?: string;
  };
}

interface WorksheetData {
  name: string;
  rows: number;
  cols: number;
  cells: { [key: string]: CellData };
  headers: string[];
}

export default function ExcelLikeInterface({ onToggleView, uploadedFileId, fileName }: ExcelLikeInterfaceProps) {
  const [sheets, setSheets] = useState<WorksheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formulaBar, setFormulaBar] = useState('');
  const [vbScript, setVbScript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [scriptResults, setScriptResults] = useState<any[]>([]);
  const [apiEndpoint, setApiEndpoint] = useState('/api/excel/analyze-configurator');
  const [expressionMode, setExpressionMode] = useState<'formula' | 'vb' | 'api'>('formula');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const { toast } = useToast();
  
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfiguratorData();
  }, []);

  // Keyboard shortcuts for zoom and paste
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
          case 'v':
            // Paste will be handled by the global paste handler
            break;
        }
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if we're not in an input field
      if (!(e.target as HTMLElement)?.tagName.match(/^(INPUT|TEXTAREA)$/)) {
        e.preventDefault();
        const pastedData = e.clipboardData?.getData('text') || '';
        
        if (pastedData.includes('\t') || pastedData.includes('\n')) {
          handleMultiCellPaste(selectedCell, pastedData);
        } else {
          // Single cell paste
          updateCell(selectedCell, pastedData);
          toast({
            title: "Value Pasted",
            description: `Updated cell ${selectedCell}`,
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
    };
  }, [selectedCell]);

  const loadConfiguratorData = async () => {
    setIsLoading(true);
    try {
      const endpoint = uploadedFileId 
        ? `/api/excel/uploaded/${uploadedFileId}`
        : '/api/excel/analyze-configurator';
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const analysisData = data.analysis || data;
        
        // Convert analysis data to Excel-like sheet structure
        const convertedSheets: WorksheetData[] = analysisData.sheetNames.map((sheetName: string, idx: number) => {
          const sheetData = analysisData.sheets[sheetName];
          const worksheet: WorksheetData = {
            name: sheetName,
            rows: Math.max(sheetData.rowCount, 50),
            cols: Math.max(sheetData.columnCount, 20),
            headers: sheetData.headers || [],
            cells: {}
          };
          
          // Populate cells with actual data
          sheetData.sampleData?.forEach((row: any[], rowIdx: number) => {
            row.forEach((cellValue: any, colIdx: number) => {
              if (cellValue !== null && cellValue !== undefined) {
                const cellRef = getCellReference(rowIdx, colIdx);
                worksheet.cells[cellRef] = {
                  value: cellValue.toString(),
                  type: typeof cellValue === 'number' ? 'number' : 'text',
                  style: rowIdx === 0 ? { fontWeight: 'bold', backgroundColor: '#f3f4f6' } : {}
                };
              }
            });
          });
          
          // Add enum/dropdown information
          Object.entries(sheetData.enumColumns || {}).forEach(([header, enumData]: [string, any]) => {
            const colIdx = sheetData.headers.indexOf(header);
            if (colIdx !== -1) {
              for (let rowIdx = 1; rowIdx < 20; rowIdx++) {
                const cellRef = getCellReference(rowIdx, colIdx);
                if (!worksheet.cells[cellRef]) {
                  worksheet.cells[cellRef] = {
                    value: '',
                    type: 'dropdown',
                    validation: enumData.values
                  };
                }
              }
            }
          });
          
          return worksheet;
        });
        
        setSheets(convertedSheets);
      }
    } catch (error) {
      console.error('Error loading configurator data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCellReference = (row: number, col: number): string => {
    const columnName = String.fromCharCode(65 + (col % 26));
    return `${columnName}${row + 1}`;
  };

  const parseCellReference = (cellRef: string): { row: number; col: number } => {
    const match = cellRef.match(/([A-Z]+)(\d+)/);
    if (match) {
      const col = match[1].charCodeAt(0) - 65;
      const row = parseInt(match[2]) - 1;
      return { row, col };
    }
    return { row: 0, col: 0 };
  };

  const updateCell = (cellRef: string, value: string, formula?: string) => {
    if (!sheets[activeSheet]) return;
    
    const updatedSheets = [...sheets];
    const sheet = updatedSheets[activeSheet];
    
    sheet.cells[cellRef] = {
      value,
      formula,
      type: formula ? 'formula' : (isNaN(Number(value)) ? 'text' : 'number'),
      style: sheet.cells[cellRef]?.style
    };
    
    setSheets(updatedSheets);
  };

  // Handle multi-cell paste from Excel/other spreadsheets
  const handleMultiCellPaste = (startCell: string, pastedData: string) => {
    const rows = pastedData.split('\n').filter(row => row.trim());
    const startPos = parseCellReference(startCell);
    
    const updatedSheets = [...sheets];
    const sheet = updatedSheets[activeSheet];
    
    if (sheet) {
      // Calculate required dimensions
      const maxCols = Math.max(...rows.map(row => row.split('\t').length));
      const requiredRows = startPos.row + rows.length;
      const requiredCols = startPos.col + maxCols;
      
      // Auto-expand sheet if necessary
      if (requiredRows > sheet.rows || requiredCols > sheet.cols) {
        sheet.rows = Math.max(sheet.rows, requiredRows);
        sheet.cols = Math.max(sheet.cols, requiredCols);
      }
      
      rows.forEach((row, rowOffset) => {
        const cells = row.split('\t');
        cells.forEach((cellValue, colOffset) => {
          const newRow = startPos.row + rowOffset;
          const newCol = startPos.col + colOffset;
          const cellAddress = getCellReference(newRow, newCol);
          
          // Detect cell type based on content
          let cellType: 'text' | 'number' | 'formula' = 'text';
          let processedValue = cellValue.trim();
          
          if (processedValue.startsWith('=')) {
            cellType = 'formula';
          } else if (!isNaN(Number(processedValue)) && processedValue !== '') {
            cellType = 'number';
          }
          
          sheet.cells[cellAddress] = {
            value: processedValue,
            formula: cellType === 'formula' ? processedValue : undefined,
            type: cellType,
            style: sheet.cells[cellAddress]?.style
          };
        });
      });
      
      setSheets(updatedSheets);
      
      // Show success message
      toast({
        title: "Row Data Pasted Successfully",
        description: `Pasted ${rows.length} row(s) with ${maxCols} column(s) starting at ${startCell}`,
      });
    }
  };

  const executeFormula = async (formula: string, cellRef: string): Promise<string> => {
    try {
      if (formula.startsWith('=')) {
        const response = await fetch('/api/excel/evaluate-formula', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            formula, 
            cellRef, 
            sheetData: sheets[activeSheet]?.cells 
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.result;
        }
      }
      return formula;
    } catch (error) {
      return '#ERROR!';
    }
  };

  const executeVBScript = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/excel/execute-vb-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: vbScript, 
          sheetData: sheets[activeSheet]?.cells,
          selectedCell 
        })
      });
      
      if (response.ok) {
        const results = await response.json();
        setScriptResults(results.results);
        
        // Update sheet with VB script results
        const updatedSheets = [...sheets];
        
        results.results.forEach((result: any, idx: number) => {
          if (result.type === 'receptacle_pattern' && result.result?.autoFillData) {
            const startRow = idx + 2;
            const autoFill = result.result.autoFillData;
            
            updateCell(`A${startRow}`, autoFill.receptacle);
            updateCell(`B${startRow}`, autoFill.cableType || '');
            updateCell(`C${startRow}`, autoFill.whipLength || '');
            updateCell(`D${startRow}`, autoFill.voltage || '');
            updateCell(`E${startRow}`, autoFill.conduitSize || '');
            updateCell(`F${startRow}`, autoFill.conductorAWG || '');
          }
        });
        
        setSheets(updatedSheets);
      }
    } catch (error) {
      console.error('Error executing VB script:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAPICall = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        setScriptResults([data]);
        
        // Display API results in the sheet
        const updatedSheets = [...sheets];
        updateCell('A1', 'API_RESULT');
        updateCell('B1', JSON.stringify(data).substring(0, 100));
        setSheets(updatedSheets);
      }
    } catch (error) {
      console.error('Error executing API call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleCellDoubleClick = (cellRef: string) => {
    const cell = sheets[activeSheet]?.cells[cellRef];
    if (cell?.type !== 'dropdown') {
      setEditingCell(cellRef);
      setEditValue(cell?.value || '');
    }
  };

  const handleSaveEdit = () => {
    if (editingCell) {
      updateCell(editingCell, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleEditPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Check if it's multi-cell data (from Excel)
    if (pastedData.includes('\t') || pastedData.includes('\n')) {
      handleMultiCellPaste(editingCell!, pastedData);
      setEditingCell(null);
    } else {
      setEditValue(pastedData);
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
    if (gridRef.current) {
      const container = gridRef.current.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const gridWidth = gridRef.current.scrollWidth;
        const gridHeight = gridRef.current.scrollHeight;
        
        const widthRatio = (containerWidth * 0.9) / gridWidth;
        const heightRatio = (containerHeight * 0.9) / gridHeight;
        const optimalZoom = Math.min(widthRatio, heightRatio) * 100;
        
        setZoomLevel(Math.max(50, Math.min(200, optimalZoom)));
      }
    }
  };

  const renderCell = (row: number, col: number) => {
    const cellRef = getCellReference(row, col);
    const cell = sheets[activeSheet]?.cells[cellRef];
    const isSelected = selectedCell === cellRef;
    const isHeader = row === 0;
    const isEditing = editingCell === cellRef;
    
    return (
      <div
        key={`${activeSheet}-${cellRef}`}
        className={cn(
          "border-r border-b border-technical-200 dark:border-technical-600 p-1 w-24 h-8 text-xs cursor-pointer relative",
          "hover:bg-technical-50 dark:hover:bg-technical-800",
          isSelected && "bg-blue-100 dark:bg-blue-900/30 border-blue-500",
          isHeader && "bg-technical-100 dark:bg-technical-700 font-medium",
          cell?.style?.backgroundColor && `bg-[${cell.style.backgroundColor}]`,
          cell?.style?.fontWeight && `font-${cell.style.fontWeight}`
        )}
        style={{
          backgroundColor: cell?.style?.backgroundColor,
          fontWeight: cell?.style?.fontWeight,
          color: cell?.style?.color
        }}
        onClick={() => {
          setSelectedCell(cellRef);
          setFormulaBar(cell?.formula || cell?.value || '');
        }}
        onDoubleClick={() => handleCellDoubleClick(cellRef)}
      >
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleEditKeyDown}
            onPaste={handleEditPaste}
            className="w-full h-full px-1 text-xs border-none outline-none bg-white dark:bg-technical-800 text-technical-900 dark:text-technical-100"
            autoFocus
          />
        ) : cell?.type === 'dropdown' ? (
          <Select
            value={cell.value}
            onValueChange={(value) => updateCell(cellRef, value)}
          >
            <SelectTrigger className="w-full h-full border-none p-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cell.validation?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="truncate block w-full">
            {cell?.formula ? (
              <FormulaCell formula={cell.formula} cellRef={cellRef} />
            ) : (
              cell?.value || ''
            )}
          </span>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    if (!sheets[activeSheet]) return null;
    
    const sheet = sheets[activeSheet];
    const rows = Array.from({ length: sheet.rows }, (_, i) => i);
    const cols = Array.from({ length: sheet.cols }, (_, i) => i);
    
    return (
      <div className="border border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-900 rounded-lg overflow-hidden">
        {/* Column Headers */}
        <div className="flex bg-technical-50 dark:bg-technical-800 border-b border-technical-200 dark:border-technical-600" style={{ minWidth: 'max-content' }}>
          <div className="w-12 h-8 border-r border-technical-200 dark:border-technical-600 bg-technical-100 dark:bg-technical-700 flex-shrink-0"></div>
          {cols.map(i => (
            <div
              key={i}
              className="w-24 h-8 border-r border-technical-200 dark:border-technical-600 flex items-center justify-center text-xs font-medium bg-technical-50 dark:bg-technical-800 text-technical-700 dark:text-technical-300 flex-shrink-0"
            >
              {String.fromCharCode(65 + (i % 26))}
            </div>
          ))}
        </div>
        
        {/* Grid Rows */}
        <div style={{ minWidth: 'max-content' }}>
          {rows.map(row => (
            <div key={row} className="flex">
              {/* Row Header */}
              <div className="w-12 h-8 border-r border-b border-technical-200 dark:border-technical-600 bg-technical-100 dark:bg-technical-700 flex items-center justify-center text-xs font-medium text-technical-700 dark:text-technical-300 flex-shrink-0">
                {row + 1}
              </div>
              {/* Row Cells */}
              {cols.map(col => (
                <div key={`${row}-${col}`} className="flex-shrink-0">
                  {renderCell(row, col)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-technical-400" />
          <p>Loading Excel-like interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-technical-900">
      {/* Header */}
      <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
            Excel-like ConfiguratorDataset Interface
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
            
            <Button size="sm" variant="outline" onClick={onToggleView}>
              Back to Design Canvas
            </Button>
            <Button size="sm" variant="default" onClick={loadConfiguratorData}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
        
        {/* Formula Bar */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{selectedCell}</Badge>
          <Input
            value={formulaBar}
            onChange={(e) => setFormulaBar(e.target.value)}
            onKeyPress={async (e) => {
              if (e.key === 'Enter') {
                const isFormula = formulaBar.startsWith('=');
                if (isFormula) {
                  const result = await executeFormula(formulaBar, selectedCell);
                  updateCell(selectedCell, result, formulaBar);
                } else {
                  updateCell(selectedCell, formulaBar);
                }
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pastedData = e.clipboardData.getData('text');
              
              // Check if it's multi-cell data (from Excel)
              if (pastedData.includes('\t') || pastedData.includes('\n')) {
                handleMultiCellPaste(selectedCell, pastedData);
              } else {
                setFormulaBar(pastedData);
              }
            }}
            placeholder="Enter formula, value, or paste from Excel..."
            className="flex-1"
          />
          <div className="text-xs text-technical-600 dark:text-technical-400">
            💡 Double-click to edit • Ctrl+V to paste rows from Excel (1:1) • Ctrl+/-/0 for zoom
          </div>
        </div>
        
        {/* Sheet Tabs */}
        <div className="flex items-center gap-1 mb-2">
          {sheets.map((sheet, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={activeSheet === idx ? "default" : "outline"}
              onClick={() => setActiveSheet(idx)}
            >
              {sheet.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Grid */}
        <div className="flex-1 p-4 overflow-auto" style={{ scrollBehavior: 'smooth' }}>
          <div 
            ref={gridRef}
            style={{ 
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              minWidth: zoomLevel < 100 ? `${100 / (zoomLevel / 100)}%` : 'max-content',
              minHeight: zoomLevel < 100 ? `${100 / (zoomLevel / 100)}%` : 'auto',
              width: 'max-content'
            }}
          >
            {renderGrid()}
          </div>
        </div>
        
        {/* Side Panel - Script/API Interface */}
        <div className="w-80 border-l border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
          <Tabs value={expressionMode} onValueChange={(v) => setExpressionMode(v as any)} className="h-full">
            <TabsList className="w-full">
              <TabsTrigger value="formula" className="flex-1">
                <Calculator className="w-4 h-4 mr-2" />
                Formulas
              </TabsTrigger>
              <TabsTrigger value="vb" className="flex-1">
                <Code className="w-4 h-4 mr-2" />
                VB Script
              </TabsTrigger>
              <TabsTrigger value="api" className="flex-1">
                <Database className="w-4 h-4 mr-2" />
                API
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="formula" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Formula Builder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div><strong>Functions:</strong></div>
                    <div>• =A1+B1 (Addition)</div>
                    <div>• =SUM(A1:A10)</div>
                    <div>• =IF(A1&gt;0,"Yes","No")</div>
                    <div>• =VLOOKUP(A1,Table,2,0)</div>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => {
                    const formula = `=A${parseCellReference(selectedCell).row + 1}*1.2`;
                    setFormulaBar(formula);
                  }}>
                    Insert Sample Formula
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Copy & Paste Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div><strong>Direct Editing:</strong></div>
                    <div>• Double-click any cell to edit</div>
                    <div>• Type directly into cells</div>
                    <div>• Enter to save, Escape to cancel</div>
                    <div><strong>1:1 Row Pasting:</strong></div>
                    <div>• Copy entire rows from Excel/Google Sheets</div>
                    <div>• Paste with Ctrl+V for exact replication</div>
                    <div>• Automatic grid expansion when needed</div>
                    <div>• Preserves formulas, numbers, and text types</div>
                    <div>• Multi-row paste support</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="vb" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">VB Script Executor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    value={vbScript}
                    onChange={(e) => setVbScript(e.target.value)}
                    placeholder="Enter VB Script or receptacle patterns:&#10;Sub ProcessReceptacles()&#10;  Range(&#34;A1&#34;).Value = &#34;460C9W&#34;&#10;  Range(&#34;A2&#34;).Value = &#34;460C6W&#34;&#10;End Sub&#10;&#10;Or just patterns:&#10;460C9W&#10;460C6W"
                    className="h-32 text-xs font-mono"
                  />
                  <Button size="sm" className="w-full" onClick={executeVBScript}>
                    <Play className="w-4 h-4 mr-2" />
                    Execute VB Script
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Select value={apiEndpoint} onValueChange={setApiEndpoint}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/api/excel/analyze-configurator">Analyze Dataset</SelectItem>
                      <SelectItem value="/api/excel/components">Get Components</SelectItem>
                      <SelectItem value="/api/components">Get Base Components</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="w-full" onClick={executeAPICall}>
                    <Play className="w-4 h-4 mr-2" />
                    Execute API Call
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Results Panel */}
          {scriptResults.length > 0 && (
            <div className="p-4 border-t border-technical-200 dark:border-technical-600">
              <h4 className="font-medium mb-2 text-sm">Execution Results</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {scriptResults.map((result, idx) => (
                  <div key={idx} className="text-xs p-2 bg-technical-100 dark:bg-technical-700 rounded">
                    <div className="font-mono">{JSON.stringify(result).substring(0, 100) + '...'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}