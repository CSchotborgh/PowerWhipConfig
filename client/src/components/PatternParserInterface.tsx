import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Zap, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Lightbulb 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PatternParserInterface: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const { toast } = useToast();

  // Pattern parsing mutation
  const parsePatternsMutation = useMutation({
    mutationFn: async (input: string) => {
      const response = await fetch('/api/excel/parse-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Parsing failed');
      }
      
      // Handle file download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `ParsedPreSal_${Date.now()}.xlsx`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { filename, size: blob.size, patternCount: input.split('\n').filter(line => line.trim()).length };
    },
    onSuccess: (data) => {
      toast({
        title: "Patterns Parsed Successfully",
        description: `Downloaded ${data.filename} with ${data.patternCount} patterns (${Math.round(data.size / 1024)} KB)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Parsing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleParse = () => {
    if (!inputText.trim()) {
      toast({
        title: "No Input Provided",
        description: "Please enter receptacle patterns to parse",
        variant: "destructive",
      });
      return;
    }
    parsePatternsMutation.mutate(inputText);
  };

  const insertExample = () => {
    const exampleText = `460R9W, Metal Conduit, 50ft, Pigtail 10
L5-20R, FMC, 300 feet, Tail whip 10
CS8269A, LFMC, 60 ft., Tail Length 10
5-15R, EMT, 25ft, Pigtail 6
L6-30R, Liquid tight flexible metal conduit, 100ft, Tail 8`;
    setInputText(exampleText);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Natural Language Pattern Parser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Enter receptacle patterns in natural language format. Each line should contain: 
              <strong> Receptacle Type, Conduit Type, Length, Tail Length</strong>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="pattern-input" className="font-medium">
                Receptacle Patterns
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={insertExample}
                className="text-sm"
              >
                <FileText className="h-3 w-3 mr-1" />
                Insert Examples
              </Button>
            </div>
            
            <Textarea
              id="pattern-input"
              placeholder="Enter patterns, one per line:
460R9W, Metal Conduit, 50ft, Pigtail 10
L5-20R, FMC, 300 feet, Tail whip 10
CS8269A, LFMC, 60 ft., Tail Length 10"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {inputText.split('\n').filter(line => line.trim()).length} patterns ready
            </div>
            
            <Button 
              onClick={handleParse}
              disabled={parsePatternsMutation.isPending || !inputText.trim()}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {parsePatternsMutation.isPending ? 'Parsing...' : 'Parse & Download PreSal'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported Pattern Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Receptacle Types</h4>
              <div className="space-y-1 text-sm">
                <Badge variant="outline">460R9W</Badge>
                <Badge variant="outline">5-15R, 5-20R</Badge>
                <Badge variant="outline">L5-15R, L5-20R, L6-30R</Badge>
                <Badge variant="outline">CS8269A, CS8365A</Badge>
                <Badge variant="outline">IEC60309</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Conduit Types</h4>
              <div className="space-y-1 text-sm">
                <Badge variant="outline">Metal Conduit → EMT</Badge>
                <Badge variant="outline">FMC, Flexible Metal</Badge>
                <Badge variant="outline">LFMC, Liquid Tight</Badge>
                <Badge variant="outline">MC, Armored Cable</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Length Formats</h4>
              <div className="space-y-1 text-sm">
                <Badge variant="outline">50ft, 50 feet, 50 foot</Badge>
                <Badge variant="outline">300 feet, 25ft</Badge>
                <Badge variant="outline">60 ft., 100ft</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Tail Length</h4>
              <div className="space-y-1 text-sm">
                <Badge variant="outline">Pigtail 10</Badge>
                <Badge variant="outline">Tail whip 10</Badge>
                <Badge variant="outline">Tail Length 10</Badge>
                <Badge variant="outline">Tail 8</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <strong>Example Output:</strong> Each pattern generates a standardized PreSal row with receptacle specifications, 
                voltage/current ratings, wire gauge requirements, and NEC compliance information.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatternParserInterface;