import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Minimize2, 
  Maximize2, 
  X, 
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  Layers
} from 'lucide-react';

interface ParticleStylePanelProps {
  title: string;
  children?: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
  isVisible?: boolean;
}

export function ParticleStylePanel({
  title,
  children,
  defaultPosition = { x: 20, y: 100 },
  onClose,
  isVisible = true
}: ParticleStylePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState([85]);
  const [scale, setScale] = useState([100]);
  const [isLocked, setIsLocked] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isLocked) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setPosition({
      x: Math.max(0, Math.min(newX, window.innerWidth - 320)),
      y: Math.max(0, Math.min(newY, window.innerHeight - 200))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

  return (
    <Card
      className={`fixed z-50 w-80 backdrop-blur-md bg-gray-900/90 border border-gray-700/50 shadow-2xl transition-all duration-300 ${
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
      } ${isMinimized ? 'h-auto' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        opacity: opacity[0] / 100,
        transform: `scale(${scale[0] / 100})`,
        transformOrigin: 'top left'
      }}
    >
      {/* Header with glow effect */}
      <CardHeader 
        className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <h3 className="font-semibold text-sm text-white">{title}</h3>
            <div className="flex items-center gap-1">
              {isDragging && (
                <div className="text-xs text-blue-400 animate-pulse">
                  {Math.round(position.x)}, {Math.round(position.y)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Lock/Unlock */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              title={isLocked ? "Unlock panel" : "Lock panel"}
            >
              {isLocked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            
            {/* Minimize/Maximize */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            
            {/* Close */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-4 space-y-4 bg-gray-900/50">
          {/* Panel Controls */}
          <div className="space-y-3">
            {/* Opacity Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-300">Opacity</label>
                <span className="text-xs text-blue-400">{opacity[0]}%</span>
              </div>
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                max={100}
                min={10}
                step={5}
                className="[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400"
              />
            </div>

            {/* Scale Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-300">Scale</label>
                <span className="text-xs text-purple-400">{scale[0]}%</span>
              </div>
              <Slider
                value={scale}
                onValueChange={setScale}
                max={200}
                min={50}
                step={5}
                className="[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-400"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpacity([85]);
                  setScale([100]);
                }}
                className="flex-1 text-xs text-gray-400 hover:text-white"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              
              <div className="w-px h-4 bg-gray-700" />
              
              <Switch
                checked={isLocked}
                onCheckedChange={setIsLocked}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className="text-xs text-gray-400">Lock</span>
            </div>
          </div>

          {/* Custom Content */}
          {children && (
            <div className="border-t border-gray-700/50 pt-4">
              {children}
            </div>
          )}
        </CardContent>
      )}
      
      {/* Glow effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg blur-xl" />
    </Card>
  );
}

// Component Library Panel with particle-style controls
export function ParticleComponentLibrary({ onClose }: { onClose?: () => void }) {
  const [intensity, setIntensity] = useState([75]);
  const [spread, setSpread] = useState([50]);
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <ParticleStylePanel 
      title="Component Library" 
      defaultPosition={{ x: 20, y: 100 }}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">Component Filter</label>
          <div className="grid grid-cols-2 gap-1">
            {['all', 'connectors', 'cables', 'protection'].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={`text-xs capitalize ${
                  activeFilter === filter 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Intensity Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Search Intensity</label>
            <span className="text-xs text-green-400">{intensity[0]}%</span>
          </div>
          <Slider
            value={intensity}
            onValueChange={setIntensity}
            max={100}
            min={0}
            step={1}
            className="[&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-400"
          />
        </div>

        {/* Spread Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Result Spread</label>
            <span className="text-xs text-orange-400">{spread[0]}%</span>
          </div>
          <Slider
            value={spread}
            onValueChange={setSpread}
            max={100}
            min={10}
            step={5}
            className="[&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Zap className="h-3 w-3 mr-1" />
            Apply
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Layers className="h-3 w-3 mr-1" />
            Layer
          </Button>
        </div>
      </div>
    </ParticleStylePanel>
  );
}

// Configuration Panel with particle-style controls
export function ParticleConfigurationPanel({ onClose }: { onClose?: () => void }) {
  const [voltage, setVoltage] = useState([120]);
  const [current, setCurrent] = useState([15]);
  const [frequency, setFrequency] = useState([60]);
  const [phases, setPhases] = useState([1]);

  return (
    <ParticleStylePanel 
      title="Configuration Controls" 
      defaultPosition={{ x: 20, y: 380 }}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Voltage Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Voltage (V)</label>
            <span className="text-xs text-yellow-400">{voltage[0]}V</span>
          </div>
          <Slider
            value={voltage}
            onValueChange={setVoltage}
            max={480}
            min={12}
            step={12}
            className="[&_[role=slider]]:bg-yellow-500 [&_[role=slider]]:border-yellow-400"
          />
        </div>

        {/* Current Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Current (A)</label>
            <span className="text-xs text-red-400">{current[0]}A</span>
          </div>
          <Slider
            value={current}
            onValueChange={setCurrent}
            max={100}
            min={5}
            step={5}
            className="[&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-400"
          />
        </div>

        {/* Frequency Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Frequency (Hz)</label>
            <span className="text-xs text-cyan-400">{frequency[0]}Hz</span>
          </div>
          <Slider
            value={frequency}
            onValueChange={setFrequency}
            max={400}
            min={50}
            step={10}
            className="[&_[role=slider]]:bg-cyan-500 [&_[role=slider]]:border-cyan-400"
          />
        </div>

        {/* Phases Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Phases</label>
            <span className="text-xs text-pink-400">{phases[0]}</span>
          </div>
          <Slider
            value={phases}
            onValueChange={setPhases}
            max={3}
            min={1}
            step={1}
            className="[&_[role=slider]]:bg-pink-500 [&_[role=slider]]:border-pink-400"
          />
        </div>

        {/* Status Indicators */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Active</span>
          </div>
          <div className="text-xs text-gray-500">
            {voltage[0] * current[0]}W
          </div>
        </div>
      </div>
    </ParticleStylePanel>
  );
}