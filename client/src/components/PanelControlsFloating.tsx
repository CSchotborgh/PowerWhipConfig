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
      defaultSize={{ width: 700, height: 160 }}
      minSize={{ width: 500, height: 120 }}
      maxSize={{ width: 1400, height: 250 }}
      className="bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm"
      scalable={true}
    >
      <div className="flex items-center gap-6 p-3 w-full">
        {/* Navigation Tabs - Icon Only */}
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "p-3 rounded-xl transition-all duration-200 relative group border-2 flex items-center justify-center",
                  isActive
                    ? "bg-primary text-white shadow-xl border-primary"
                    : "bg-white dark:bg-technical-800 text-technical-600 dark:text-technical-400 border-technical-200 dark:border-technical-600 hover:bg-primary/10 hover:text-primary hover:border-primary/50 hover:scale-105 hover:shadow-lg"
                )}
                title={tab.label}
                data-testid={`nav-tab-${tab.id}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-md" />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-technical-200 dark:bg-technical-600" />

        {/* Quick Access Icons */}
        <div className="flex-1 flex items-center justify-center">
          <PanelControls />
        </div>
      </div>
    </DraggablePanel>
  );
}
