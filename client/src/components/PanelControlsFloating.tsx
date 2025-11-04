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
      defaultSize={{ width: 650, height: 180 }}
      minSize={{ width: 400, height: 140 }}
      maxSize={{ width: 1200, height: 300 }}
      className="bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm"
      scalable={true}
    >
      <div className="flex flex-col gap-3 p-2">
        {/* Navigation Tabs - Icon Only */}
        <div className="flex items-center gap-3 justify-center px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "p-3 rounded-xl transition-all duration-200 relative group border-2",
                  isActive
                    ? "bg-primary text-white shadow-xl scale-110 border-primary"
                    : "bg-white dark:bg-technical-800 text-technical-600 dark:text-technical-400 border-technical-200 dark:border-technical-600 hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:scale-105 hover:shadow-lg"
                )}
                title={tab.label}
                data-testid={`nav-tab-${tab.id}`}
              >
                <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-md" />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-technical-200 dark:bg-technical-600" />

        {/* Quick Access Icons */}
        <div className="flex items-center justify-center px-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-technical-50 dark:bg-technical-700/50">
            <PanelControls />
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}
