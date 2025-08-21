import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Minimize2, 
  Maximize2, 
  FileSpreadsheet,
  Brain,
  Zap,
  Settings
} from 'lucide-react';
import { ExcelFileViewerEditor } from './excel/ExcelFileViewerEditor';

interface FloatingExcelViewerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
  position: { x: number; y: number };
  onDrag: (position: { x: number; y: number }) => void;
}

export function FloatingExcelViewerPanel({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  position,
  onDrag
}: FloatingExcelViewerPanelProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [analysisCount, setAnalysisCount] = React.useState(0);
  const [lastAnalysis, setLastAnalysis] = React.useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging) {
      onDrag({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart, onDrag]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleFileAnalyzed = (analysis: any) => {
    setAnalysisCount(prev => prev + 1);
    setLastAnalysis(analysis.fileName);
  };

  const handleTransformComplete = (outputFile: string) => {
    console.log('Transform completed:', outputFile);
    // Could trigger download or show success message
  };

  if (!isOpen) return null;

  const panelClasses = isMaximized
    ? "fixed inset-4 z-50"
    : "fixed z-50 w-[900px] h-[700px]";

  const contentClasses = isMaximized
    ? "h-full"
    : "h-[700px]";

  return (
    <div
      className={panelClasses}
      style={isMaximized ? {} : { 
        left: position.x, 
        top: position.y,
        transform: 'none'
      }}
    >
      <Card className="w-full h-full shadow-2xl border-2 border-blue-200 bg-white">
        <CardHeader 
          className="pb-2 cursor-move bg-gradient-to-r from-blue-50 to-indigo-50 border-b"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Excel File Viewer & Editor
                  <Badge variant="outline" className="text-xs">
                    Advanced Analysis
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Pattern Recognition
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Formula Processing
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    PreSal Transform
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {analysisCount > 0 && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {analysisCount} file{analysisCount > 1 ? 's' : ''} analyzed
                </div>
              )}
              
              {lastAnalysis && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded max-w-32 truncate">
                  Last: {lastAnalysis}
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={`p-0 ${contentClasses} overflow-hidden`}>
          <div className="h-full overflow-auto">
            <ExcelFileViewerEditor
              onFileAnalyzed={handleFileAnalyzed}
              onTransformComplete={handleTransformComplete}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}