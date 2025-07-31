import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Package, FileText, ChevronDown, Plus, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ExcelComponent {
  partNumber?: string;
  description?: string;
  category?: string;
  specifications?: Record<string, any>;
  pricing?: number;
  availability?: boolean;
  manufacturer?: string;
}

interface BOMEntry {
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  category?: string;
}

interface OrderItem {
  component: ExcelComponent;
  quantity: number;
  notes?: string;
}

export default function OrderEntryTab() {
  const [openSections, setOpenSections] = useState<string[]>(["component-selection", "order-summary"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Fetch Excel components
  const { data: excelComponents, isLoading: componentsLoading } = useQuery<ExcelComponent[]>({
    queryKey: ["/api/excel/components"],
  });

  // Generate BOM mutation
  const bomMutation = useMutation({
    mutationFn: async (data: { componentIds: string[], quantities: Record<string, number> }) => {
      const response = await fetch('/api/excel/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate BOM');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/excel/bom"] });
      toast({ title: "BOM generated successfully" });
    }
  });

  // Filter components based on search and category
  const filteredComponents = excelComponents?.filter(comp => {
    const matchesSearch = !searchTerm || 
      comp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.partNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || comp.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = Array.from(new Set(excelComponents?.map(comp => comp.category).filter((cat): cat is string => Boolean(cat)))) || [];

  const addToOrder = (component: ExcelComponent) => {
    const existingItem = orderItems.find(item => item.component.partNumber === component.partNumber);
    
    if (existingItem) {
      setOrderItems(prev => prev.map(item => 
        item.component.partNumber === component.partNumber 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, { component, quantity: 1 }]);
    }
    
    toast({ title: `Added ${component.description || component.partNumber} to order` });
  };

  const updateQuantity = (partNumber: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(partNumber);
      return;
    }
    
    setOrderItems(prev => prev.map(item => 
      item.component.partNumber === partNumber 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromOrder = (partNumber: string) => {
    setOrderItems(prev => prev.filter(item => item.component.partNumber !== partNumber));
    toast({ title: "Item removed from order" });
  };

  const generateBOM = () => {
    const componentIds = orderItems.map(item => item.component.partNumber!);
    const quantities = orderItems.reduce((acc, item) => {
      acc[item.component.partNumber!] = item.quantity;
      return acc;
    }, {} as Record<string, number>);

    bomMutation.mutate({ componentIds, quantities });
  };

  const totalOrderValue = orderItems.reduce((sum, item) => 
    sum + (item.component.pricing || 0) * item.quantity, 0
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Component Selection */}
      <Collapsible
        open={openSections.includes("component-selection")}
        onOpenChange={() => toggleSection("component-selection")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2 text-primary" />
                  Component Selection ({filteredComponents.length} available)
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("component-selection") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search" className="text-technical-700 dark:text-technical-300">
                    Search Components
                  </Label>
                  <Input
                    id="search"
                    placeholder="Search by part number or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white dark:bg-technical-800"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-technical-700 dark:text-technical-300">
                    Category Filter
                  </Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-white dark:bg-technical-800">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Components Table */}
              <div className="border rounded-lg bg-white dark:bg-technical-800">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {componentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Loading components...
                          </TableCell>
                        </TableRow>
                      ) : filteredComponents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No components found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredComponents.map((component, index) => (
                          <TableRow key={component.partNumber || index}>
                            <TableCell className="font-mono text-sm">
                              {component.partNumber || 'N/A'}
                            </TableCell>
                            <TableCell>{component.description || 'No description'}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-technical-100 dark:bg-technical-700 rounded text-xs">
                                {component.category || 'Uncategorized'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {component.pricing ? `$${component.pricing.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                component.availability 
                                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                              )}>
                                {component.availability ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => addToOrder(component)}
                                disabled={!component.availability}
                                className="flex items-center"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Order Summary */}
      <Collapsible
        open={openSections.includes("order-summary")}
        onOpenChange={() => toggleSection("order-summary")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <ShoppingCart className="w-4 h-4 mr-2 text-primary" />
                  Order Summary ({orderItems.length} items)
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("order-summary") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-technical-600 dark:text-technical-400">
                  No items in order. Add components from the selection above.
                </div>
              ) : (
                <>
                  <div className="border rounded-lg bg-white dark:bg-technical-800">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.component.partNumber}>
                            <TableCell className="font-mono text-sm">
                              {item.component.partNumber}
                            </TableCell>
                            <TableCell>{item.component.description}</TableCell>
                            <TableCell>
                              ${item.component.pricing?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.component.partNumber!, item.quantity - 1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.component.partNumber!, item.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              ${((item.component.pricing || 0) * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeFromOrder(item.component.partNumber!)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-technical-50 dark:bg-technical-800 rounded-lg">
                    <span className="text-lg font-semibold text-technical-900 dark:text-technical-100">
                      Total Order Value:
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ${totalOrderValue.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={generateBOM}
                      disabled={bomMutation.isPending}
                      className="flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {bomMutation.isPending ? 'Generating...' : 'Generate BOM'}
                    </Button>
                    <Button variant="outline" onClick={() => setOrderItems([])}>
                      Clear Order
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* BOM Export */}
      <Collapsible
        open={openSections.includes("bom-export")}
        onOpenChange={() => toggleSection("bom-export")}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-technical-50 dark:hover:bg-technical-800 transition-colors">
              <CardTitle className="flex items-center justify-between text-technical-900 dark:text-technical-100">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  BOM & Documentation Export
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  openSections.includes("bom-export") ? "rotate-180" : ""
                )} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center justify-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Export to PDF
                </Button>
                <Button variant="outline" className="flex items-center justify-center">
                  <Package className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
              <div className="text-sm text-technical-600 dark:text-technical-400">
                Export your order as a Bill of Materials (BOM) with detailed specifications,
                quantities, and pricing information.
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}