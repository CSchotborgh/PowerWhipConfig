import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Sliders, Settings, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ValidationMode = "live" | "static" | "hidden";

interface ValidationOptionsProps {
  mode: ValidationMode;
  onModeChange: (mode: ValidationMode) => void;
  validationResults: Array<{
    status: "success" | "warning" | "error";
    message: string;
  }>;
}

export function ValidationOptions({ mode, onModeChange, validationResults }: ValidationOptionsProps) {
  const staticResults = [
    { status: "success" as const, message: "Voltage compatibility verified" },
    { status: "success" as const, message: "Current rating within limits" },
    { status: "warning" as const, message: "Wire gauge recommendation: 10 AWG" },
  ];

  const displayResults = mode === "static" ? staticResults : validationResults;

  if (mode === "hidden") {
    return null;
  }

  return (
    <Card>
      <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
        <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            Validation Status
            <Badge variant="outline" className="ml-2 text-xs">
              {mode === "live" ? "Real-time" : "Static"}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={mode} onValueChange={onModeChange}>
              <SelectTrigger className="w-24 h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                </SelectItem>
                <SelectItem value="static">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>Static</span>
                  </div>
                </SelectItem>
                <SelectItem value="hidden">
                  <div className="flex items-center space-x-1">
                    <EyeOff className="w-3 h-3" />
                    <span>Hidden</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayResults.map((result, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              {result.status === "success" ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : result.status === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className={cn(
                "text-sm",
                result.status === "success" && "text-green-700 dark:text-green-300",
                result.status === "warning" && "text-yellow-700 dark:text-yellow-300",
                result.status === "error" && "text-red-700 dark:text-red-300"
              )}>
                {result.message}
              </span>
            </div>
          ))}
          {mode === "live" && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
              <div className="flex items-center space-x-1">
                <Settings className="w-3 h-3" />
                <span>Live validation updates with configuration changes</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}