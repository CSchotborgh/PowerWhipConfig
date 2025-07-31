import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExcelTransformerProps {
  onToggleView?: () => void;
}

interface ReceptacleMatch {
  type: string;
  count: number;
  matches: any[];
}

interface ParsedData {
  receptacles: ReceptacleMatch[];
  totalMatches: number;
  rawData: any[];
}

export default function ExcelTransformer({ onToggleView }: ExcelTransformerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [receptaclePatterns, setReceptaclePatterns] = useState([
    "460C9W", "460R9W", "560C9W", "L5-20R", "L5-30R", "L6-15R", "L6-20R", "L6-30R",
    "L15-20R", "L15-30R", "L21-20R", "L21-30R", "L22-20R", "L22-30R", "CS8264C",
    "CS8269A", "CS8369A", "9C54U2", "CS8369"
  ].join('\n'));
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.xlsx')) {
      setUploadedFile(file);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      setUploadedFile(file);
    }
  }, []);

  const processData = useCallback(async () => {
    setIsProcessing(true);
    try {
      const patterns = receptaclePatterns.split('\n').filter(p => p.trim());
      
      let dataToProcess = [];
      
      if (uploadedFile) {
        // Process uploaded Excel file
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('patterns', JSON.stringify(patterns));
        
        const response = await fetch('/api/excel/transform', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          dataToProcess = result.data;
        }
      } else if (textInput.trim()) {
        // Process text input
        const lines = textInput.split('\n').filter(line => line.trim());
        dataToProcess = lines.map((line, index) => ({ line: index + 1, content: line }));
      }

      // Match patterns against data
      const receptacleMatches: { [key: string]: any[] } = {};
      
      dataToProcess.forEach((item: any) => {
        patterns.forEach(pattern => {
          const content = JSON.stringify(item).toUpperCase();
          if (content.includes(pattern.toUpperCase())) {
            if (!receptacleMatches[pattern]) {
              receptacleMatches[pattern] = [];
            }
            receptacleMatches[pattern].push(item);
          }
        });
      });

      const receptacles = Object.entries(receptacleMatches).map(([type, matches]) => ({
        type,
        count: matches.length,
        matches
      }));

      setParsedData({
        receptacles,
        totalMatches: receptacles.reduce((sum, r) => sum + r.count, 0),
        rawData: dataToProcess
      });
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, textInput, receptaclePatterns]);

  const exportToMasterBubbleFormat = useCallback(async () => {
    if (!parsedData) return;

    try {
      const response = await fetch('/api/excel/export-master-bubble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receptacles: parsedData.receptacles,
          rawData: parsedData.rawData
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MasterBubbleTransformed.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  }, [parsedData]);

  const clearData = () => {
    setUploadedFile(null);
    setTextInput("");
    setParsedData(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
              Excel Master Bubble Format Transformer
            </h2>
            <p className="text-sm text-technical-600 dark:text-technical-400 mt-1">
              Transform Excel files containing receptacle information into the Master Bubble Order Entry format
            </p>
          </div>
          <Button onClick={onToggleView} variant="outline">
            Switch to Design Canvas
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Excel Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  "border-technical-300 dark:border-technical-600",
                  "hover:border-primary hover:bg-primary/5"
                )}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-technical-400" />
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <p className="font-medium">
                      {uploadedFile ? uploadedFile.name : "No file chosen"}
                    </p>
                    <p className="text-sm text-technical-600 dark:text-technical-400">
                      Drag and drop files here or click to browse
                    </p>
                    <p className="text-xs text-technical-500">
                      Limit 200MB per file • XLSX
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Text Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Text Input Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your data here (one entry per line)..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Receptacle Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Receptacle Patterns</CardTitle>
            <p className="text-sm text-technical-600 dark:text-technical-400">
              Modify the receptacle patterns to search for (one per line):
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={receptaclePatterns}
              onChange={(e) => setReceptaclePatterns(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
              placeholder="460C9W&#10;460R9W&#10;560C9W&#10;..."
            />
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={processData}
            disabled={!uploadedFile && !textInput.trim() || isProcessing}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {isProcessing ? "Processing..." : "Parse Data"}
          </Button>
          <Button onClick={clearData} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Clear
          </Button>
          {parsedData && (
            <Button 
              onClick={exportToMasterBubbleFormat}
              variant="default"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export to Master Bubble Format
            </Button>
          )}
        </div>

        {/* Results */}
        {parsedData && (
          <Card>
            <CardHeader>
              <CardTitle>Summary by Receptacle Type</CardTitle>
              <p className="text-sm text-technical-600 dark:text-technical-400">
                Found {parsedData.totalMatches} total matches across {parsedData.receptacles.length} receptacle types
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {parsedData.receptacles.map((receptacle) => (
                  <div 
                    key={receptacle.type}
                    className="flex items-center justify-between p-3 bg-technical-50 dark:bg-technical-800 rounded-lg"
                  >
                    <span className="font-mono text-sm font-medium">
                      {receptacle.type}
                    </span>
                    <Badge variant="secondary">
                      {receptacle.count} matches
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}