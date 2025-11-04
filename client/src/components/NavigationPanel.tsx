import { useState, useEffect } from 'react';
import { FileText, Palette, Layers } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';
import { cn } from '@/lib/utils';

interface NavigationPanelProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  defaultPosition?: { x: number; y: number };
}

export function NavigationPanel({ activeTab, onTabChange, defaultPosition = { x: 20, y: 100 } }: NavigationPanelProps) {
  const [tabs] = useState([
    { id: 'documentation', label: 'Documentation', icon: FileText },
    { id: 'visual-design', label: 'Visual Design', icon: Palette },
    { id: 'configuration', label: 'Configuration', icon: Layers }
  ]);

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('navigationPanelPosition');
    return saved ? JSON.parse(saved) : defaultPosition;
  });

  useEffect(() => {
    localStorage.setItem('navigationPanelPosition', JSON.stringify(position));
  }, [position]);

  return (
    <DraggablePanel
      title="Navigation"
      defaultPosition={position}
      defaultSize={{ width: 400, height: 80 }}
      minSize={{ width: 300, height: 60 }}
      maxSize={{ width: 600, height: 120 }}
      className="bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm"
      scalable={false}
    >
      <div className="flex items-center gap-1 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium border-b-3 transition-all duration-200 relative group flex items-center justify-center rounded-t-lg",
                isActive
                  ? "border-primary text-primary bg-primary/10 shadow-inner"
                  : "border-transparent text-technical-600 dark:text-technical-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30"
              )}
              title={tab.label}
              data-testid={`nav-tab-${tab.id}`}
            >
              <Icon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
              <span className="font-semibold tracking-wide">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </DraggablePanel>
  );
}
