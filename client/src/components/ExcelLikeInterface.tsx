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
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ExcelLikeInterface({ onToggleView }: ExcelLikeInterfaceProps) {
  const [sheets, setSheets] = useState<WorksheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formulaBar, setFormulaBar] = useState('');
  const [vbScript, setVbScript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [scriptResults, setScriptResults] = useState<any[]>([]);
  const [apiEndpoint, setApiEndpoint] = useState('/api/excel/analyze-configurator');
  const [expressionMode, setExpressionMode] = useState<'formula' | 'vb' | 'api'>('formula');
  
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfiguratorData();
  }, []);

  const loadConfiguratorData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/excel/analyze-configurator');
      if (response.ok) {
        const data = await response.json();
        
        // Convert analysis data to Excel-like sheet structure
        const convertedSheets: WorksheetData[] = data.sheetNames.map((sheetName: string, idx: number) => {
          const sheetData = data.sheets[sheetName];
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

  const renderCell = (row: number, col: number) => {
    const cellRef = getCellReference(row, col);
    const cell = sheets[activeSheet]?.cells[cellRef];
    const isSelected = selectedCell === cellRef;
    const isHeader = row === 0;
    
    return (
      <div
        key={cellRef}
        className={cn(
          "border border-technical-200 dark:border-technical-600 p-1 min-w-24 h-8 text-xs cursor-pointer",
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
        onDoubleClick={() => {
          if (cell?.type === 'dropdown') {
            // Handle dropdown interaction
          }
        }}
      >
        {cell?.type === 'dropdown' ? (
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
      <div className="overflow-auto border border-technical-200 dark:border-technical-600" ref={gridRef}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${sheet.cols}, minmax(96px, 1fr))` }}>
          {rows.map(row => 
            cols.map(col => renderCell(row, col))
          )}
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
            placeholder="Enter formula or value..."
            className="flex-1"
          />
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
        <div className="flex-1 p-4">
          {renderGrid()}
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