import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileSpreadsheet, Search, RotateCcw, Type, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceptacleMatch {
  type: string;
  count: number;
  matches: any[];
  foundInLookup: boolean;
  matchedIn: string;
  errorMessage?: string;
}

interface ParsedData {
  receptacles: ReceptacleMatch[];
  totalMatches: number;
  rawData: any[];
}

export function FloatingExcelTransformer() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
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
    setParsedData(null);
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
          if (result && result.data && Array.isArray(result.data)) {
            inputPatterns = result.data.map((item: any) => item.content).filter((content: string) => content.trim());
          } else if (result && result.extractedPatterns && Array.isArray(result.extractedPatterns)) {
            inputPatterns = result.extractedPatterns.map((pattern: any) => pattern.original).filter((content: string) => content.trim());
          } else {
            inputPatterns = [];
          }
        }
      } else if (textInput.trim()) {
        inputPatterns = textInput.trim().split('\n').map(line => line.trim()).filter(line => line);
      }

      // Lookup each pattern in the MasterBubbleUpLookup data
      const lookupResponse = await fetch('/api/excel/components');
      const lookupResult = await lookupResponse.json();
      const lookupData = Array.isArray(lookupResult) ? lookupResult : [];
      
      const receptacleMatches: { [key: string]: any[] } = {};
      let totalFoundRows = 0;

      // Count occurrences of each pattern
      const patternCounts: { [key: string]: number } = {};
      inputPatterns.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });

      Object.entries(patternCounts).forEach(([pattern, count]) => {
        const matches = lookupData.filter((row: any) => {
          if (!row) return false;
          const specs = row.specifications || {};
          const searchFields = [
            specs['Choose receptacle'],
            specs['Receptacle'],
            specs['Part Number'],
            specs['Model'],
            specs['Product Code'],
            row.receptacle,
            row.partNumber,
            row.model
          ];
          
          return searchFields.some(field => {
            if (!field) return false;
            const fieldStr = field.toString().toUpperCase().trim();
            const patternStr = pattern.toUpperCase().trim();
            return fieldStr === patternStr || fieldStr.includes(patternStr);
          });
        });

        if (matches.length > 0) {
          const firstMatch = matches[0];
          const expandedMatches = Array.from({ length: count }, (_, index) => ({
            ...firstMatch,
            lineNumber: totalFoundRows + index + 1,
            originalPattern: pattern,
            quantity: 1,
            sourceRow: firstMatch,
            inputOccurrence: index + 1,
            matchedIn: 'MasterBubbleUpLookup',
            foundInLookup: true,
            rowIndex: lookupData.indexOf(firstMatch)
          }));

          receptacleMatches[pattern] = expandedMatches;
          totalFoundRows += count;
        } else {
          const expandedMatches = Array.from({ length: count }, (_, index) => ({
            originalPattern: `*${pattern}`,
            lineNumber: totalFoundRows + index + 1,
            quantity: 1,
            error: `Pattern "${pattern}" not found in MasterBubbleUpLookup data`,
            sourceRow: null,
            inputOccurrence: index + 1,
            matchedIn: 'Default (Not Found)',
            foundInLookup: false,
            defaultData: {
              'Choose receptacle': `*${pattern}`,
              'Description': `Default entry for ${pattern} - not found in lookup`,
              'Order QTY': 1,
              'Unit Price': 0,
              'Extended Price': 0,
              'Lead Time': 'TBD',
              'Manufacturer': 'Unknown',
              'Category': 'Electrical Component'
            }
          }));
          
          receptacleMatches[pattern] = expandedMatches;
          totalFoundRows += count;
        }
      });

      const receptacles = Object.entries(receptacleMatches).map(([type, matches]) => {
        const firstMatch = matches[0];
        return {
          type,
          count: matches.length,
          matches,
          foundInLookup: firstMatch?.foundInLookup || false,
          matchedIn: firstMatch?.matchedIn || 'Not Found',
          errorMessage: firstMatch?.error || null
        };
      });

      setParsedData({
        receptacles,
        totalMatches: totalFoundRows,
        rawData: inputPatterns
      });
    } catch (error) {
      console.error('Error processing data:', error);
      setParsedData(null);
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
        a.download = 'PreSalOutputFile.xlsx';
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
    setTextInput('');
    setParsedData(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text Input
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3">
          <Card>
            <CardContent className="pt-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  "border-muted hover:border-primary hover:bg-muted/50"
                )}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <Input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-panel"
                />
                <label htmlFor="file-upload-panel" className="cursor-pointer">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {uploadedFile ? uploadedFile.name : "Click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drag & drop XLSX files here
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Receptacle Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter patterns (one per line):&#10;460R9W&#10;460C9W&#10;L5-20R"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[120px] font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: 460R9W, L5-20R, CS8269A
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Controls */}
      <div className="flex gap-2">
        <Button 
          onClick={processData}
          disabled={!uploadedFile && !textInput.trim() || isProcessing}
          size="sm"
          className="flex-1"
        >
          <Search className="w-3 h-3 mr-1" />
          {isProcessing ? "Processing..." : "Parse"}
        </Button>
        <Button 
          onClick={clearData} 
          variant="outline" 
          size="sm"
          disabled={isProcessing}
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
        {parsedData && (
          <Button 
            onClick={exportToMasterBubbleFormat}
            variant="default"
            size="sm"
          >
            <Download className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Results */}
      {parsedData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Results ({parsedData.totalMatches} matches)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px]">
              <div className="space-y-2 pr-2">
                {parsedData.receptacles.map((receptacle) => (
                  <div 
                    key={receptacle.type}
                    className="p-2 bg-muted/30 rounded border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-medium">
                        {receptacle.foundInLookup ? receptacle.type : `*${receptacle.type}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge variant={receptacle.foundInLookup ? "default" : "secondary"} className="text-xs">
                          {receptacle.count}
                        </Badge>
                        {receptacle.foundInLookup ? (
                          <div className="w-2 h-2 rounded-full bg-green-500" title="Found in lookup"></div>
                        ) : (
                          <AlertCircle className="w-3 h-3 text-orange-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <div>
                        Status: {receptacle.foundInLookup ? 'Found in MasterBubbleUpLookup' : 'Using defaults'}
                      </div>
                      {receptacle.errorMessage && (
                        <div className="text-orange-600 text-xs mt-1">
                          {receptacle.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}