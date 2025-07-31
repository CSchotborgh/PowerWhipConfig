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
      let inputPatterns: string[] = [];

      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        const response = await fetch('/api/excel/transform', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          // Extract patterns from uploaded data
          inputPatterns = result.data.map((item: any) => item.content).filter((content: string) => content.trim());
        }
      } else if (textInput.trim()) {
        // Parse text input for receptacle patterns (like "460R9W")
        inputPatterns = textInput.trim().split('\n').map(line => line.trim()).filter(line => line);
      }

      // Now lookup each pattern in the MasterBubbleUpLookup data
      const lookupResponse = await fetch('/api/excel/components');
      const lookupData = await lookupResponse.json();
      
      const receptacleMatches: { [key: string]: any[] } = {};
      let totalFoundRows = 0;

      inputPatterns.forEach(pattern => {
        // Find matching rows in lookup data where "Choose receptacle" column matches pattern
        const matches = lookupData.filter((row: any) => {
          const receptacleField = row.specifications?.['Choose receptacle'] || row.receptacle || '';
          return receptacleField.toString().toUpperCase() === pattern.toUpperCase();
        });

        if (matches.length > 0) {
          const firstMatch = matches[0];
          const quantity = parseInt(firstMatch.specifications?.['Order QTY'] || '1', 10) || 1;
          
          // Create multiple rows based on quantity
          const expandedMatches = Array.from({ length: quantity }, (_, index) => ({
            ...firstMatch,
            lineNumber: totalFoundRows + index + 1,
            originalPattern: pattern,
            quantity: 1, // Each row represents 1 unit
            sourceRow: firstMatch
          }));

          receptacleMatches[pattern] = expandedMatches;
          totalFoundRows += quantity;
        } else {
          // No match found, but still include it in results
          receptacleMatches[pattern] = [{
            originalPattern: pattern,
            lineNumber: totalFoundRows + 1,
            quantity: 1,
            error: 'No matching row found in MasterBubbleUpLookup data',
            sourceRow: null
          }];
          totalFoundRows += 1;
        }
      });

      const receptacles = Object.entries(receptacleMatches).map(([type, matches]) => ({
        type,
        count: matches.length,
        matches,
        foundInLookup: matches.some((m: any) => !m.error)
      }));

      setParsedData({
        receptacles,
        totalMatches: totalFoundRows,
        rawData: inputPatterns
      });
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, textInput]);

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
              <CardTitle>Receptacle Pattern Lookup</CardTitle>
              <p className="text-sm text-technical-600 dark:text-technical-400">
                Enter receptacle patterns to lookup in MasterBubbleUpLookup data (one per line)
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter receptacle patterns to lookup:&#10;460R9W&#10;460C9W&#10;L5-20R&#10;etc..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-sm text-technical-600 dark:text-technical-400 mt-2">
                Example: Enter "460R9W" to find matching row in Order Entry tab and create output rows based on quantity
              </p>
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