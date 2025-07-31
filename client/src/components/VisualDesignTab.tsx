import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ZoomIn, ZoomOut, Move, Hand } from "lucide-react";

export default function VisualDesignTab() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-technical-900 dark:text-technical-100">
            <Eye className="w-4 h-4 mr-2 text-primary" />
            Canvas Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="flex items-center justify-center">
              <Move className="w-4 h-4 mr-2" />
              Select
            </Button>
            <Button variant="outline" size="sm" className="flex items-center justify-center">
              <Hand className="w-4 h-4 mr-2" />
              Pan
            </Button>
            <Button variant="outline" size="sm" className="flex items-center justify-center">
              <ZoomIn className="w-4 h-4 mr-2" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" className="flex items-center justify-center">
              <ZoomOut className="w-4 h-4 mr-2" />
              Zoom Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-technical-900 dark:text-technical-100">
            Layer Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-technical-700 dark:text-technical-300">Components</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-technical-700 dark:text-technical-300">Wires</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-technical-700 dark:text-technical-300">Labels</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-technical-700 dark:text-technical-300">Grid</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-technical-900 dark:text-technical-100">
            View Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-technical-700 dark:text-technical-300 mb-1">
              Scale
            </label>
            <select 
              className="w-full px-3 py-2 border border-technical-300 dark:border-technical-600 rounded-lg bg-white dark:bg-technical-800"
              defaultValue="1:10"
            >
              <option value="1:1">1:1</option>
              <option value="1:5">1:5</option>
              <option value="1:10">1:10</option>
              <option value="1:20">1:20</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-technical-700 dark:text-technical-300 mb-1">
              Units
            </label>
            <select 
              className="w-full px-3 py-2 border border-technical-300 dark:border-technical-600 rounded-lg bg-white dark:bg-technical-800"
              defaultValue="Inches"
            >
              <option value="Inches">Inches</option>
              <option value="Feet">Feet</option>
              <option value="Millimeters">Millimeters</option>
              <option value="Centimeters">Centimeters</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
