import { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { PanelControls } from './PanelControls';

interface PanelControlsFloatingProps {
  defaultPosition?: { x: number; y: number };
}

export function PanelControlsFloating({ defaultPosition = { x: window.innerWidth - 320, y: 100 } }: PanelControlsFloatingProps) {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('panelControlsFloatingPosition');
    return saved ? JSON.parse(saved) : defaultPosition;
  });

  useEffect(() => {
    localStorage.setItem('panelControlsFloatingPosition', JSON.stringify(position));
  }, [position]);

  return (
    <DraggablePanel
      title="Quick Access"
      defaultPosition={position}
      defaultSize={{ width: 300, height: 80 }}
      minSize={{ width: 200, height: 60 }}
      maxSize={{ width: 400, height: 120 }}
      className="bg-white/95 dark:bg-technical-800/95 backdrop-blur-sm"
      scalable={false}
    >
      <div className="flex items-center justify-center p-2">
        <PanelControls />
      </div>
    </DraggablePanel>
  );
}
