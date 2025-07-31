import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ShoppingCart, Plus, Minus, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AGGridOrderEntryProps {
  onToggleView?: () => void;
}

export default function AGGridOrderEntry({ onToggleView }: AGGridOrderEntryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderEntryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  // Get unique categories for filtering
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
      const currentQty = prev[partNumber] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [partNumber]: newQty };
    });
  };

  const addToOrder = (item: OrderEntryItem) => {
    if (item.quantity > 0) {
      setOrderItems(prev => {
        const existing = prev.find(orderItem => orderItem.partNumber === item.partNumber);
        if (existing) {
          return prev.map(orderItem => 
            orderItem.partNumber === item.partNumber 
              ? { ...orderItem, quantity: item.quantity, totalPrice: item.totalPrice }
              : orderItem
          );
        }
        return [...prev, item];
      });
    }
  };

  const exportOrder = () => {
    const orderData = orderEntryData.filter(item => item.quantity > 0);
    const csvContent = [
      ['Part Number', 'Description', 'Quantity', 'Unit Price', 'Total Price', 'Category', 'Manufacturer'],
      ...orderData.map(item => [
        item.partNumber,
        item.description,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.totalPrice.toFixed(2),
        item.category,
        item.manufacturer || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-entry-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-technical-200 dark:bg-technical-700 rounded w-1/3"></div>
          <div className="h-12 bg-technical-200 dark:bg-technical-700 rounded"></div>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-technical-100 dark:bg-technical-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header with controls */}
      <div className="p-6 border-b border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-technical-900 dark:text-technical-100">
              Order Entry System
            </h2>
            <p className="text-technical-600 dark:text-technical-400">
              Select components and manage quantities for your power whip configuration
            </p>
          </div>
          {onToggleView && (
            <Button onClick={onToggleView} variant="outline" className="flex items-center gap-2">
              Switch to Design Board
            </Button>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-technical-400" />
            <Input
              placeholder="Search components, part numbers, manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportOrder} variant="default" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Order
          </Button>
        </div>

        {/* Order summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-technical-600 dark:text-technical-400">Selected Items</p>
                  <p className="text-lg font-semibold text-technical-900 dark:text-technical-100">
                    {orderSummary.selectedItems}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-technical-600 dark:text-technical-400">Total Quantity</p>
                  <p className="text-lg font-semibold text-technical-900 dark:text-technical-100">
                    {orderSummary.totalItems}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-primary">$</span>
                <div>
                  <p className="text-sm text-technical-600 dark:text-technical-400">Total Value</p>
                  <p className="text-lg font-semibold text-primary">
                    ${orderSummary.totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AG-Grid style table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full bg-white dark:bg-technical-900">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800 font-semibold text-sm text-technical-900 dark:text-technical-100">
            <div className="col-span-2">Part Number</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-1">Manufacturer</div>
            <div className="col-span-1">Unit Price</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Table body */}
          <div className="divide-y divide-technical-200 dark:divide-technical-600">
            {filteredData.map((item, index) => (
              <div 
                key={`order-item-${item.partNumber}-${index}`}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors",
                  index % 2 === 0 ? "bg-white dark:bg-technical-900" : "bg-technical-25 dark:bg-technical-850"
                )}
              >
                <div className="col-span-2 font-mono text-sm text-technical-700 dark:text-technical-300">
                  {item.partNumber}
                </div>
                <div className="col-span-3 text-sm text-technical-900 dark:text-technical-100">
                  {item.description}
                </div>
                <div className="col-span-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
                <div className="col-span-1 text-xs text-technical-600 dark:text-technical-400">
                  {item.manufacturer || 'N/A'}
                </div>
                <div className="col-span-1 text-sm font-semibold text-technical-900 dark:text-technical-100">
                  ${item.unitPrice.toFixed(2)}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.partNumber, -1)}
                    disabled={item.quantity === 0}
                    className="w-8 h-8 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 0;
                      setQuantities(prev => ({ ...prev, [item.partNumber]: qty }));
                    }}
                    className="w-16 text-center"
                    min="0"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.partNumber, 1)}
                    className="w-8 h-8 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="col-span-1 text-sm font-semibold text-primary">
                  ${item.totalPrice.toFixed(2)}
                </div>
                <div className="col-span-1">
                  <Badge 
                    variant={item.availability ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {item.availability ? "Available" : "Out of Stock"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-technical-500 dark:text-technical-400">
              {searchTerm || selectedCategory !== "all" 
                ? "No components match your search criteria" 
                : "No components available"
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}