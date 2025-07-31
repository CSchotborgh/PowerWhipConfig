import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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

interface VirtualizedOrderEntryProps {
  onToggleView?: () => void;
}

// Virtualized row component for performance
const VirtualizedRow = ({ item, index, onQuantityChange }: {
  item: OrderEntryItem;
  index: number;
  onQuantityChange: (id: string, quantity: number) => void;
}) => {
  const handleIncrement = useCallback(() => {
    onQuantityChange(item.id, item.quantity + 1);
  }, [item.id, item.quantity, onQuantityChange]);

  const handleDecrement = useCallback(() => {
    onQuantityChange(item.id, Math.max(0, item.quantity - 1));
  }, [item.id, item.quantity, onQuantityChange]);

  return (
    <Card className={cn(
      "mb-2 transition-all duration-200 hover:shadow-md",
      item.quantity > 0 && "ring-2 ring-primary/20 bg-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Part Info */}
          <div className="md:col-span-4">
            <div className="font-medium text-technical-900 dark:text-technical-100">
              {item.partNumber}
            </div>
            <div className="text-sm text-technical-600 dark:text-technical-400 line-clamp-2">
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
            <Badge variant={item.availability ? "default" : "destructive"}>
              {item.availability ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          {/* Price */}
          <div className="md:col-span-2 text-right">
            <div className="font-bold text-technical-900 dark:text-technical-100">
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
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="w-12 text-center font-medium">
                {item.quantity}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleIncrement}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="md:col-span-2 text-right">
            <div className="font-bold text-primary">
              ${item.totalPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function VirtualizedOrderEntry({ onToggleView }: VirtualizedOrderEntryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [visibleItems, setVisibleItems] = useState(50); // Start with 50 items
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: components = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/excel/components'],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (v5 syntax)
  });

  // Memoized transformation with performance optimization
  const orderEntryData = useMemo(() => {
    const transformedData = components.map((comp, index) => ({
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

    return transformedData;
  }, [components, quantities]);

  // Filtered and sorted data with debounced search
  const filteredData = useMemo(() => {
    let filtered = orderEntryData;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.partNumber.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.manufacturer?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Sort by relevance (items with quantity first, then alphabetically)
    return filtered.sort((a, b) => {
      if (a.quantity > 0 && b.quantity === 0) return -1;
      if (a.quantity === 0 && b.quantity > 0) return 1;
      return a.partNumber.localeCompare(b.partNumber);
    });
  }, [orderEntryData, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(orderEntryData.map(item => item.category))];
    return uniqueCategories.sort();
  }, [orderEntryData]);

  // Load more items with debouncing
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || visibleItems >= filteredData.length) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleItems(prev => Math.min(prev + 50, filteredData.length));
      setIsLoadingMore(false);
    }, 100);
  }, [filteredData.length, isLoadingMore, visibleItems]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000) {
        loadMoreItems();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreItems]);

  // Optimized quantity change handler
  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: quantity
    }));
  }, []);

  // Calculate order summary
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
    a.download = `order-entry-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b border-technical-200 dark:border-technical-600 bg-technical-50 dark:bg-technical-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-technical-900 dark:text-technical-100">
                Order Entry System
              </h2>
              <p className="text-sm text-technical-600 dark:text-technical-400 mt-1">
                Loading component data...
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
                Loading Order Entry Data
              </p>
              <p className="text-sm text-technical-600 dark:text-technical-400">
                Optimizing large dataset for better performance...
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
      <div className="p-6 border-b border-technical-200 dark:border-technical-600 bg-white dark:bg-technical-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-technical-900 dark:text-technical-100">
              High-Performance Order Entry
            </h2>
            <p className="text-technical-600 dark:text-technical-400">
              {components.length.toLocaleString()} components loaded • Showing {Math.min(visibleItems, filteredData.length)} of {filteredData.length.toLocaleString()} filtered items
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
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-2">
          {filteredData.slice(0, visibleItems).map((item, index) => (
            <VirtualizedRow
              key={item.id}
              item={item}
              index={index}
              onQuantityChange={handleQuantityChange}
            />
          ))}
          
          {/* Load More Indicator */}
          {visibleItems < filteredData.length && (
            <div className="text-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more items...</span>
                </div>
              ) : (
                <Button onClick={loadMoreItems} variant="outline">
                  Load More ({filteredData.length - visibleItems} remaining)
                </Button>
              )}
            </div>
          )}
          
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-technical-500">No components found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}