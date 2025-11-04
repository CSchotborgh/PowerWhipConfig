import { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';
import ConfigurationTab from './ConfigurationTab';
import VisualDesignTab from './VisualDesignTab';
import DocumentationTab from './DocumentationTab';

interface ContentPanelProps {
  activeTab: string;
  defaultPosition?: { x: number; y: number };
}

export function ContentPanel({ activeTab, defaultPosition = { x: 50, y: 250 } }: ContentPanelProps) {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('contentPanelPosition');
    return saved ? JSON.parse(saved) : defaultPosition;
  });

  useEffect(() => {
    localStorage.setItem('contentPanelPosition', JSON.stringify(position));
  }, [position]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "configuration":
        return <ConfigurationTab />;
      case "visual":
        return <VisualDesignTab />;
      case "documentation":
        return <DocumentationTab />;
      default:
        return <ConfigurationTab />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "configuration":
        return "Configuration";
      case "visual":
        return "Visual Design";
      case "documentation":
        return "Documentation";
      default:
        return "Configuration";
    }
  };

  return (
    <DraggablePanel
      title={getTabTitle()}
      defaultPosition={position}
      defaultSize={{ width: 450, height: 600 }}
      minSize={{ width: 320, height: 400 }}
      maxSize={{ width: 800, height: 900 }}
      className="bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm"
      scalable={true}
    >
      <div className="h-full overflow-auto">
        {renderTabContent()}
      </div>
    </DraggablePanel>
  );
}
