import React from 'react';
import { Loader2, Zap, Grid3X3, FileSpreadsheet } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  progress?: number;
}

export default function LoadingScreen({ 
  message = "Loading Power Whip Configurator", 
  submessage = "Initializing components and interface...",
  progress 
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-technical-50 to-technical-100 dark:from-technical-950 dark:to-technical-900 flex items-center justify-center z-50">
      <div className="text-center space-y-8 max-w-md px-6">
        
        {/* Logo and Icons */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="relative">
            <Zap className="w-12 h-12 text-technical-600 dark:text-technical-400" />
            <div className="absolute -top-1 -right-1">
              <Grid3X3 className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-bold text-technical-900 dark:text-technical-100">
            Power Whip
          </div>
          <FileSpreadsheet className="w-8 h-8 text-green-600 animate-bounce" />
        </div>

        {/* Main Loading Spinner */}
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-technical-600 dark:text-technical-400" />
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-technical-900 dark:text-technical-100">
            {message}
          </h2>
          <p className="text-sm text-technical-600 dark:text-technical-400">
            {submessage}
          </p>
        </div>

        {/* Progress Bar (if provided) */}
        {typeof progress === 'number' && (
          <div className="w-full bg-technical-200 dark:bg-technical-700 rounded-full h-2">
            <div 
              className="bg-technical-600 dark:bg-technical-400 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {/* Feature Indicators */}
        <div className="grid grid-cols-3 gap-4 text-xs text-technical-500 dark:text-technical-400">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span>AG-Grid Enterprise</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Excel Integration</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span>Design Canvas</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-technical-600 dark:bg-technical-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-technical-600 dark:bg-technical-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-technical-600 dark:bg-technical-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}