import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Layers, 
  Package, 
  Settings, 
  FileText, 
  Shield, 
  Zap,
  Database,
  Eye,
  EyeOff,
  FileSpreadsheet
} from 'lucide-react';
import { usePanelManager } from './PanelManager';
import { FloatingComponentLibrary } from './FloatingComponentLibrary';
import { FloatingExcelTransformer } from './FloatingExcelTransformer';
import ConfigurationDetailsPanel from './ConfigurationDetailsPanel';

export function PanelControls() {
  const { panels, openPanel, closePanel } = usePanelManager();

  const availablePanels = [
    {
      id: 'component-library',
      title: 'Component Library',
      icon: <Package className="h-4 w-4" />,
      component: <FloatingComponentLibrary />,
      position: { x: 50, y: 100 },
      size: { width: 450, height: 600 },
      minSize: { width: 300, height: 400 },
      maxSize: { width: 800, height: 900 },
      scalable: true
    },
    {
      id: 'configuration-details',
      title: 'Configuration Details',
      icon: <Settings className="h-4 w-4" />,
      component: <ConfigurationDetailsPanel />,
      position: { x: 500, y: 100 },
      size: { width: 500, height: 650 },
      minSize: { width: 350, height: 450 },
      maxSize: { width: 900, height: 1000 },
      scalable: true
    },
    {
      id: 'excel-transformer',
      title: 'Excel Transformer',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      component: <FloatingExcelTransformer />,
      position: { x: 550, y: 150 },
      size: { width: 400, height: 550 },
      minSize: { width: 350, height: 450 },
      maxSize: { width: 600, height: 800 },
      scalable: true
    },
    {
      id: 'validation-panel',
      title: 'Validation & Compliance',
      icon: <Shield className="h-4 w-4" />,
      component: (
        <div className="space-y-4">
          <div className="text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">NEC Compliance Check</h3>
            <p className="text-sm text-muted-foreground">
              Real-time validation against National Electrical Code standards
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-sm">Wire Gauge Compatibility</span>
              <Badge className="bg-green-100 text-green-800">✓ Valid</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-sm">Voltage Rating</span>
              <Badge className="bg-green-100 text-green-800">✓ Valid</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded">
              <span className="text-sm">Current Load</span>
              <Badge className="bg-yellow-100 text-yellow-800">⚠ Warning</Badge>
            </div>
          </div>
        </div>
      ),
      position: { x: 950, y: 100 },
      size: { width: 380, height: 450 },
      minSize: { width: 280, height: 350 },
      maxSize: { width: 600, height: 700 },
      scalable: true
    },
    {
      id: 'export-panel',
      title: 'Export & Documentation',
      icon: <FileText className="h-4 w-4" />,
      component: (
        <div className="space-y-4">
          <div className="text-center">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Export Options</h3>
            <p className="text-sm text-muted-foreground">
              Generate documentation and export configurations
            </p>
          </div>
          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button className="w-full" variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Export BOM
            </Button>
            <Button className="w-full" variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Generate Schematic
            </Button>
          </div>
        </div>
      ),
      position: { x: 750, y: 300 },
      size: { width: 350, height: 400 },
      minSize: { width: 250, height: 300 },
      maxSize: { width: 500, height: 600 },
      scalable: true
    }
  ];

  const handleOpenPanel = (panel: typeof availablePanels[0]) => {
    // Check if panel is already open
    const isOpen = panels.some(p => p.title === panel.title);
    if (!isOpen) {
      openPanel({
        title: panel.title,
        component: panel.component,
        position: panel.position,
        size: panel.size,
        minSize: panel.minSize,
        maxSize: panel.maxSize,
        scalable: panel.scalable
      });
    }
  };

  const handleClosePanel = (panelTitle: string) => {
    const panel = panels.find(p => p.title === panelTitle);
    if (panel) {
      closePanel(panel.id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Panel Count Badge */}
      {panels.length > 0 && (
        <Badge variant="secondary" className="mr-2">
          {panels.length} panel{panels.length !== 1 ? 's' : ''} open
        </Badge>
      )}

      {/* Open Panels Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            Panels
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold">Open Panels</div>
          
          {availablePanels.map(panel => {
            const isOpen = panels.some(p => p.title === panel.title);
            
            return (
              <DropdownMenuItem
                key={panel.id}
                onClick={() => isOpen ? handleClosePanel(panel.title) : handleOpenPanel(panel)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {panel.icon}
                  <span>{panel.title}</span>
                </div>
                {isOpen ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            );
          })}
          
          {panels.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => panels.forEach(panel => closePanel(panel.id))}
                className="text-red-600"
              >
                Close All Panels
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Access Buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleOpenPanel(availablePanels[0])}
        title="Open Component Library"
      >
        <Package className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleOpenPanel(availablePanels[1])}
        title="Open Configuration Details"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}