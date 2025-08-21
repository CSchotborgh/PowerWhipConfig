import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Download, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Calculator,
  Package,
  FileText,
  Trash2,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AGGridOrderEntry from "./AGGridOrderEntry";
import PerformanceOrderEntry from "./PerformanceOrderEntry";

interface OrderEntryItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  specifications: Record<string, any>;
  manufacturer?: string;
  availability: boolean;
}

interface FloatingOrderEntryPanelProps {
  designCanvasItems?: any[]; // Items from Design Canvas
  onExportOrder?: (orderData: any) => void;
}

export function FloatingOrderEntryPanel({ 
  designCanvasItems = [], 
  onExportOrder 
}: FloatingOrderEntryPanelProps) {
  const [activeInterface, setActiveInterface] = useState<"standard" | "performance" | "grid">("standard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderEntryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const { data: components = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/excel/components'],
    staleTime: 5 * 60 * 1000,
  });

  // Transform components to order entry format
  const orderEntryData = useMemo(() => {
    return components.map((comp, index) => ({
      id: comp.partNumber || `item-${index}`,
      partNumber: comp.partNumber || `PN-${index}`,
      description: comp.description || 'No Description',
      quantity: quantities[comp.partNumber] || 0,
      unitPrice: comp.pricing || 0,
      totalPrice: (comp.pricing || 0) * (quantities[comp.partNumber] || 0),
      category: comp.category || 'Miscellaneous',
      specifications: comp.specifications || {},
      manufacturer: comp.manufacturer,
      availability: comp.availability !== false
    }));
  }, [components, quantities]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(orderEntryData.map(item => item.category)));
    return cats.filter(Boolean);
  }, [orderEntryData]);

  // Filter data based on search and category
  const filteredData = useMemo(() => {
    return orderEntryData.filter(item => {
      const matchesSearch = !searchTerm || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [orderEntryData, searchTerm, selectedCategory]);

  // Calculate order summary
  const orderSummary = useMemo(() => {
    const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    const totalValue = orderEntryData.reduce((sum, item) => sum + item.totalPrice, 0);
    const selectedItems = orderEntryData.filter(item => item.quantity > 0).length;
    
    return { totalItems, totalValue, selectedItems };
  }, [orderEntryData, quantities]);

  const updateQuantity = (partNumber: string, change: number) => {
    setQuantities(prev => {
      const current = prev[partNumber] || 0;
      const newValue = Math.max(0, current + change);
      return { ...prev, [partNumber]: newValue };
    });
  };

  const addFromDesignCanvas = () => {
    // Add items from Design Canvas to order
    designCanvasItems.forEach(item => {
      if (item.component) {
        updateQuantity(item.component.partNumber || item.component.name, 1);
      }
    });
    toast({ 
      title: "Design Canvas Items Added", 
      description: `Added ${designCanvasItems.length} items from Design Canvas to order` 
    });
  };

  const exportOrder = () => {
    const orderData = {
      items: orderEntryData.filter(item => item.quantity > 0),
      summary: orderSummary,
      timestamp: new Date().toISOString(),
      source: "floating-order-panel"
    };
    
    if (onExportOrder) {
      onExportOrder(orderData);
    } else {
      // Default export behavior
      const dataStr = JSON.stringify(orderData, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-entry-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    toast({ title: "Order Exported", description: "Order data has been exported successfully" });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-technical-900 rounded-lg border border-technical-200 dark:border-technical-700">
      {/* Header */}
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span>High-Performance Order Entry</span>
            <Badge variant="outline" className="text-xs">
              {orderSummary.selectedItems} items • ${orderSummary.totalValue.toFixed(2)}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {designCanvasItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={addFromDesignCanvas}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Add from Canvas ({designCanvasItems.length})
              </Button>
            )}
            <Button size="sm" onClick={exportOrder} disabled={orderSummary.selectedItems === 0}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {/* Interface Selection */}
      <div className="px-6 pb-4">
        <Tabs value={activeInterface} onValueChange={(value: any) => setActiveInterface(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standard" className="flex items-center space-x-1">
              <Package className="w-4 h-4" />
              <span>Standard</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-1">
              <Calculator className="w-4 h-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>AG-Grid</span>
            </TabsTrigger>
          </TabsList>

          {/* Standard Interface */}
          <TabsContent value="standard" className="mt-4">
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search components..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Components Table */}
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Loading components...
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No components found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow key={item.id} className={cn(
                          item.quantity > 0 && "bg-blue-50 dark:bg-blue-900/20"
                        )}>
                          <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                          <TableCell className="max-w-48 truncate">{item.description}</TableCell>
                          <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.partNumber, -1)}
                                disabled={item.quantity === 0}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.partNumber, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>${item.totalPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            {item.quantity > 0 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setQuantities(prev => ({ ...prev, [item.partNumber]: 0 }))}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Performance Interface */}
          <TabsContent value="performance" className="mt-4">
            <PerformanceOrderEntry />
          </TabsContent>

          {/* AG-Grid Interface */}
          <TabsContent value="grid" className="mt-4">
            <AGGridOrderEntry />
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Summary */}
      {orderSummary.selectedItems > 0 && (
        <div className="mt-auto p-4 bg-technical-50 dark:bg-technical-800 rounded-b-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{orderSummary.selectedItems}</div>
              <div className="text-xs text-muted-foreground">Items Selected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{orderSummary.totalItems}</div>
              <div className="text-xs text-muted-foreground">Total Quantity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">${orderSummary.totalValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total Value</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}