import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ShoppingCart, Plus, Minus } from "lucide-react";
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

interface PerformanceOrderEntryProps {
  onToggleView?: () => void;
}

// Memoized row component for react-window
const OrderEntryRow = ({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
  const { items, quantities, onQuantityChange } = data;
  const item = items[index];

  const handleIncrement = useCallback(() => {
    onQuantityChange(item.id, item.quantity + 1);
  }, [item.id, item.quantity, onQuantityChange]);

  const handleDecrement = useCallback(() => {
    onQuantityChange(item.id, Math.max(0, item.quantity - 1));
  }, [item.id, item.quantity, onQuantityChange]);

  return (
    <div style={style}>
      <Card className={cn(
        "mx-2 mb-2 transition-all duration-200 hover:shadow-md",
        item.quantity > 0 && "ring-2 ring-primary/20 bg-primary/5"
      )}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Part Info */}
            <div className="md:col-span-4">
              <div className="font-medium text-technical-900 dark:text-technical-100 text-sm">
                {item.partNumber}
              </div>
              <div className="text-xs text-technical-600 dark:text-technical-400 line-clamp-2">
                {item.description}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
                {item.manufacturer && (
                  <span className="text-xs text-technical-500">{item.manufacturer}</span>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="md:col-span-2">
              <Badge variant={item.availability ? "default" : "destructive"} className="text-xs">
                {item.availability ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>

            {/* Price */}
            <div className="md:col-span-2 text-right">
              <div className="font-bold text-technical-900 dark:text-technical-100 text-sm">
                ${item.unitPrice.toFixed(2)}
              </div>
              <div className="text-xs text-technical-500">per unit</div>
            </div>

            {/* Quantity Controls */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDecrement}
                  disabled={item.quantity === 0}
                  className="h-7 w-7 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="w-8 text-center font-medium text-sm">
                  {item.quantity}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleIncrement}
                  className="h-7 w-7 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Total */}
            <div className="md:col-span-2 text-right">
              <div className="font-bold text-primary text-sm">
                ${item.totalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function PerformanceOrderEntry({ onToggleView }: PerformanceOrderEntryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const listRef = useRef<any>(null);

  // Performance-optimized query with longer cache times
  const { data: components = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/excel/components'],
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    gcTime: 60 * 60 * 1000, // 1 hour in memory
    select: useCallback((data: any[]) => {
      // Pre-process data for better performance
      return data.map((comp, index) => ({
        ...comp,
        id: comp.partNumber || `item-${index}`,
        searchableText: [
          comp.partNumber,
          comp.description,
          comp.manufacturer
        ].filter(Boolean).join(' ').toLowerCase()
      }));
    }, [])
  });

  // Memoized transformation with performance optimization
  const orderEntryData = useMemo(() => {
    return components.map((comp) => ({
      id: comp.id,
      partNumber: comp.partNumber || comp.id,
      description: comp.description || 'No Description',
      quantity: quantities[comp.id] || 0,
      unitPrice: comp.pricing || 0,
      totalPrice: (comp.pricing || 0) * (quantities[comp.id] || 0),
      category: comp.category || 'Miscellaneous',
      specifications: comp.specifications || {},
      manufacturer: comp.manufacturer,
      availability: comp.availability !== false,
      searchableText: comp.searchableText
    }));
  }, [components, quantities]);

  // High-performance filtered data with debounced search
  const filteredData = useMemo(() => {
    let filtered = orderEntryData;

    // Fast text search using pre-computed searchable text
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.searchableText.includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Optimized sort: items with quantity first, then by part number
    return filtered.sort((a, b) => {
      // Priority sort: quantity > 0 first
      if (a.quantity > 0 && b.quantity === 0) return -1;
      if (a.quantity === 0 && b.quantity > 0) return 1;
      // Secondary sort: alphabetical by part number
      return a.partNumber.localeCompare(b.partNumber);
    });
  }, [orderEntryData, searchTerm, selectedCategory]);

  // Get unique categories with memoization
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(components.map(comp => comp.category || 'Miscellaneous'))];
    return uniqueCategories.sort();
  }, [components]);

  // Optimized quantity change handler with batching
  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    setQuantities(prev => {
      const updated = { ...prev, [id]: quantity };
      return updated;
    });
  }, []);

  // Calculate order summary with memoization
  const orderSummary = useMemo(() => {
    const itemsWithQuantity = filteredData.filter(item => item.quantity > 0);
    const totalItems = itemsWithQuantity.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = itemsWithQuantity.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return {
      totalItems,
      totalValue,
      uniqueItems: itemsWithQuantity.length
    };
  }, [filteredData]);

  // Optimized export function
  const exportOrder = useCallback(() => {
    const orderData = filteredData.filter(item => item.quantity > 0);
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
    a.download = `high-performance-order-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData]);

  // Reset list scroll when filters change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [searchTerm, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
                High-Performance Order Entry
              </h2>
              <p className="text-sm text-technical-600 dark:text-technical-400 mt-1">
                Optimizing large dataset for maximum performance...
              </p>
            </div>
            <Button onClick={onToggleView} variant="outline">
              Switch to Excel Transformer
            </Button>
          </div>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-technical-900 dark:text-technical-100">
                Loading High-Performance View
              </p>
              <p className="text-sm text-technical-600 dark:text-technical-400">
                Implementing virtualization and performance optimizations...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-technical-900 dark:text-technical-100">
              High-Performance Order Entry
            </h2>
            <p className="text-technical-600 dark:text-technical-400">
              {components.length.toLocaleString()} components • {filteredData.length.toLocaleString()} filtered • Virtualized rendering
            </p>
          </div>
          <Button onClick={onToggleView} variant="outline" className="flex items-center gap-2">
            Switch to Excel Transformer
          </Button>
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
            Export Order ({orderSummary.uniqueItems})
          </Button>
        </div>

        {/* Order Summary */}
        {orderSummary.totalItems > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium text-technical-900 dark:text-technical-100">
                      {orderSummary.totalItems} items • {orderSummary.uniqueItems} unique components
                    </span>
                  </div>
                </div>
                <div className="text-xl font-bold text-primary">
                  ${orderSummary.totalValue.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Virtualized List */}
      <div className="flex-1">
        {filteredData.length > 0 ? (
          <div className="h-full">
            <List
              ref={listRef}
              height={500} // Fixed height for container
              itemCount={filteredData.length}
              itemSize={140} // Height of each row
              itemData={{
                items: filteredData,
                quantities,
                onQuantityChange: handleQuantityChange
              }}
              overscanCount={10} // Render extra items for smooth scrolling
            >
              {OrderEntryRow}
            </List>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <p className="text-technical-500">No components found matching your criteria</p>
              <p className="text-sm text-technical-400 mt-2">Try adjusting your search or filter settings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}