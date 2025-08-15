import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Plus, Zap, Cable, Shield } from 'lucide-react';
import type { ElectricalComponent } from '@shared/schema';

interface FloatingComponentLibraryProps {
  onAddComponent?: (component: ElectricalComponent) => void;
}

export function FloatingComponentLibrary({ onAddComponent }: FloatingComponentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: components = [], isLoading } = useQuery<ElectricalComponent[]>({
    queryKey: ['/api/components'],
    refetchOnWindowFocus: false
  });

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (component.specifications as any)?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || component.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(components.map(c => c.category)));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'connector': return <Zap className="h-4 w-4" />;
      case 'cable': return <Cable className="h-4 w-4" />;
      case 'protection': return <Shield className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-7"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="h-7 gap-1"
            >
              {getCategoryIcon(category)}
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} found
      </div>

      {/* Component List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          {filteredComponents.map((component) => (
            <Card key={component.name} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryIcon(component.category)}
                      <h4 className="font-medium text-sm truncate">{component.name}</h4>
                    </div>
                    
                    {(component.specifications as any)?.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {(component.specifications as any).description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {component.maxVoltage || 120}V
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {component.maxCurrent || 15}A
                      </Badge>
                      {(component.compatibleGauges as any)?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {(component.compatibleGauges as any)[0]} AWG
                        </Badge>
                      )}
                    </div>
                    
                    {component.price && (
                      <div className="text-xs font-medium text-green-600">
                        ${component.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onAddComponent?.(component)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredComponents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No components match your filters</p>
              <p className="text-xs">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}