import { useState, useEffect } from 'react';
import { FileText, Palette, Layers } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';
import { PanelControls } from './PanelControls';
import { cn } from '@/lib/utils';

interface PanelControlsFloatingProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  defaultPosition?: { x: number; y: number };
}

export function PanelControlsFloating({ activeTab, onTabChange, defaultPosition = { x: 20, y: 100 } }: PanelControlsFloatingProps) {
  const [tabs] = useState([
    { id: 'configuration', label: 'Configuration', icon: Layers },
    { id: 'visual', label: 'Visual Design', icon: Palette },
    { id: 'documentation', label: 'Documentation', icon: FileText }
  ]);

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('panelControlsFloatingPosition');
    return saved ? JSON.parse(saved) : defaultPosition;
  });

  useEffect(() => {
    localStorage.setItem('panelControlsFloatingPosition', JSON.stringify(position));
  }, [position]);

  return (
    <DraggablePanel
      title="Navigation & Quick Access"
      defaultPosition={position}
      defaultSize={{ width: 600, height: 150 }}
      minSize={{ width: 450, height: 120 }}
      maxSize={{ width: 900, height: 200 }}
      className="bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm"
      scalable={false}
    >
      <div className="flex flex-col gap-3 p-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium border-b-2 transition-all duration-200 relative group flex items-center justify-center rounded-t-lg",
                  isActive
                    ? "border-primary text-primary bg-primary/10 shadow-inner"
                    : "border-transparent text-technical-600 dark:text-technical-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30"
                )}
                title={tab.label}
                data-testid={`nav-tab-${tab.id}`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:scale-110" />
                <span className="font-semibold tracking-wide">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-technical-200 dark:bg-technical-600" />

        {/* Quick Access Icons */}
        <div className="flex items-center justify-center">
          <PanelControls />
        </div>
      </div>
    </DraggablePanel>
  );
}
