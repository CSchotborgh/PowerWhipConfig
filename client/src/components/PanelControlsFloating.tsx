import { useState, useEffect } from 'react';
import { FileText, Palette, Layers } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';
import { PanelControls } from './PanelControls';
import { cn } from '@/lib/utils';
import { useDesignCanvas } from '@/contexts/DesignCanvasContext';

interface PanelControlsFloatingProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  defaultPosition?: { x: number; y: number };
}

// Extract the content to a separate component so it can be rendered in docked mode
export function PanelControlsContent({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) {
  const { dockedPanels } = useDesignCanvas();
  
  const [tabs] = useState([
    { id: 'configuration', label: 'Configuration', icon: Layers },
    { id: 'visual', label: 'Visual Design', icon: Palette },
    { id: 'documentation', label: 'Documentation', icon: FileText }
  ]);

  // Check if this panel is docked and get its position
  const dockedPanel = dockedPanels.find(p => p.id === 'all-features-panel');
  const dockedPosition = dockedPanel?.position;
  const isVertical = dockedPosition === 'left' || dockedPosition === 'right';

  return (
    <div className={cn(
      "flex gap-3 p-3",
      isVertical ? "flex-col items-center w-full" : "flex-row items-center"
    )}>
      {/* Navigation Tabs - Icon Only */}
      <div className={cn(
        "flex gap-2",
        isVertical ? "flex-col items-center" : "flex-row items-center"
      )}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 relative group border-2 flex items-center justify-center flex-shrink-0",
                isVertical ? "w-12 h-12" : "w-auto h-auto",
                isActive
                  ? "bg-primary text-white shadow-xl border-primary"
                  : "bg-white dark:bg-technical-800 text-technical-600 dark:text-technical-400 border-technical-200 dark:border-technical-600 hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:scale-105 hover:shadow-lg"
              )}
              title={tab.label}
              data-testid={`nav-tab-${tab.id}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isActive && !isVertical && (
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-md" />
              )}
              {isActive && isVertical && (
                <div className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md" />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className={cn(
        "bg-technical-200 dark:bg-technical-600",
        isVertical ? "h-px w-10" : "h-10 w-px"
      )} />

      {/* Quick Access Icons */}
      <div className={cn(
        "flex",
        isVertical ? "flex-col items-center" : "flex-row items-center"
      )}>
        <PanelControls />
      </div>
    </div>
  );
}

export function PanelControlsFloating({ activeTab, onTabChange, defaultPosition = { x: 20, y: 100 } }: PanelControlsFloatingProps) {
  const { dockedPanels } = useDesignCanvas();
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('panelControlsFloatingPosition');
    return saved ? JSON.parse(saved) : defaultPosition;
  });

  useEffect(() => {
    localStorage.setItem('panelControlsFloatingPosition', JSON.stringify(position));
  }, [position]);

  // Check if this panel is docked and get its position
  const dockedPanel = dockedPanels.find(p => p.id === 'all-features-panel');
  const dockedPosition = dockedPanel?.position;
  const isVertical = dockedPosition === 'left' || dockedPosition === 'right';

  return (
    <DraggablePanel
      id="all-features-panel"
      title="All Features"
      defaultPosition={position}
      defaultSize={isVertical ? { width: 80, height: 600 } : { width: 700, height: 160 }}
      minSize={isVertical ? { width: 80, height: 400 } : { width: 500, height: 120 }}
      maxSize={isVertical ? { width: 80, height: 900 } : { width: 1400, height: 250 }}
      className="bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm"
      scalable={true}
      enableCollision={false}
      zIndex={10000}
    >
      <PanelControlsContent activeTab={activeTab} onTabChange={onTabChange} />
    </DraggablePanel>
  );
}
