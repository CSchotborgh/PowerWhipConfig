import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  FileSpreadsheet, 
  Globe, 
  Settings2,
  Layers,
  Zap,
  Shield
} from "lucide-react";
import DataSourceManager from "./DataSourceManager";
import { useQuery } from "@tanstack/react-query";

export default function ConfigurationDetailsPanel() {
  const [activeTab, setActiveTab] = useState("data-sources");

  // Fetch data sources for overview
  const { data: dataSources = [] } = useQuery({
    queryKey: ['/api/data-sources'],
    refetchOnWindowFocus: false
  });

  // Fetch components for overview
  const { data: components = [] } = useQuery({
    queryKey: ['/api/components'],
    refetchOnWindowFocus: false
  });

  const getDataSourceStats = () => {
    const dataSourcesArray = Array.isArray(dataSources) ? dataSources : [];
    const activeCount = dataSourcesArray.filter((ds: any) => ds?.isActive).length;
    const totalComponents = dataSourcesArray.reduce((sum: number, ds: any) => sum + (ds?.componentCount || 0), 0);
    const successfulSyncs = dataSourcesArray.filter((ds: any) => ds?.syncStatus === 'success').length;
    
    return { activeCount, totalComponents, successfulSyncs };
  };

  const stats = getDataSourceStats();
  const componentsArray = Array.isArray(components) ? components : [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-blue-600" />
          Configuration Details
        </CardTitle>
        <CardDescription>
          Manage data sources, validation, and system integration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-6 pb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data-sources" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Validation
              </TabsTrigger>
              <TabsTrigger value="integration" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Integration
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6">
            <TabsContent value="data-sources" className="mt-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                {/* Quick Stats Overview */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.activeCount}</div>
                      <div className="text-xs text-muted-foreground">Active Sources</div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{componentsArray.length}</div>
                      <div className="text-xs text-muted-foreground">Components</div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.successfulSyncs}</div>
                      <div className="text-xs text-muted-foreground">Synced</div>
                    </div>
                  </Card>
                </div>

                <Separator />

                {/* Multi-Source Integration Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-600" />
                      Multi-Source Data Integration
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Unified electrical component data from multiple sources
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      API
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Database className="h-3 w-3 mr-1" />
                      Odoo
                    </Badge>
                  </div>
                </div>

                {/* Data Source Manager */}
                <div className="border rounded-lg">
                  <DataSourceManager />
                </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="validation" className="mt-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Component Validation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Real-time electrical code compliance and compatibility checking
                  </p>
                  
                  <div className="grid gap-3 max-w-md mx-auto">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm">NEMA Standards</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm">Voltage Compatibility</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-sm">Wire Gauge</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </div>
                  </div>
                </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="integration" className="mt-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">System Integration</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect with external systems and export capabilities
                    </p>
                    
                    <div className="grid gap-3 max-w-md mx-auto">
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Excel Export</div>
                            <div className="text-sm text-muted-foreground">BOM & Documentation</div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Database className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">ERP Integration</div>
                            <div className="text-sm text-muted-foreground">Odoo, SAP, NetSuite</div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">API Connectivity</div>
                            <div className="text-sm text-muted-foreground">REST, GraphQL, WebHooks</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}