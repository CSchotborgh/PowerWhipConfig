import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  FileSpreadsheet, 
  Globe, 
  Settings, 
  RefreshCw, 
  Plus,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  Upload
} from 'lucide-react';
import type { ComponentDataSource, InsertComponentDataSource } from '@shared/schema';

interface DataSourceConfig {
  excel?: {
    filePath?: string;
    url?: string;
    sheetName?: string;
    columnMapping: {
      name: string;
      type: string;
      category: string;
      maxVoltage?: string;
      maxCurrent?: string;
      price?: string;
      specifications?: string;
    };
  };
  url?: {
    endpoint: string;
    headers?: Record<string, string>;
    apiKey?: string;
    format: 'json' | 'csv' | 'xml';
    dataPath?: string;
  };
  odoo?: {
    baseUrl: string;
    database: string;
    username: string;
    password: string;
    model: string;
    domain?: any[];
    fields: string[];
    fieldMapping: Record<string, string>;
  };
}

export default function DataSourceManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newSource, setNewSource] = useState<Partial<InsertComponentDataSource>>({
    name: '',
    type: 'excel',
    config: {},
    isActive: true
  });
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Fetch all data sources
  const { data: dataSources = [], isLoading } = useQuery({
    queryKey: ['/api/data-sources'],
    refetchOnWindowFocus: false
  });

  // Create data source mutation
  const createSourceMutation = useMutation({
    mutationFn: (source: InsertComponentDataSource) => 
      apiRequest('/api/data-sources', { method: 'POST', body: source }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      setIsCreating(false);
      setNewSource({ name: '', type: 'excel', config: {}, isActive: true });
      toast({ title: 'Data source created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create data source', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Sync data source mutation
  const syncMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/data-sources/${id}/sync`, { method: 'POST' }),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      toast({ 
        title: 'Data source synced', 
        description: `${data.componentCount} components synced` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Sync failed', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Delete data source mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/data-sources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      toast({ title: 'Data source deleted' });
    }
  });

  // Test data source mutation
  const testMutation = useMutation({
    mutationFn: (source: InsertComponentDataSource) => 
      apiRequest('/api/data-sources/test', { method: 'POST', body: source }),
    onSuccess: (data) => {
      toast({ 
        title: 'Test successful', 
        description: `Found ${data.componentCount} components` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Test failed', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'url': return <Globe className="h-4 w-4" />;
      case 'odoo': return <Database className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'syncing':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const handleCreateSource = () => {
    if (!newSource.name || !newSource.type) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    createSourceMutation.mutate(newSource as InsertComponentDataSource);
  };

  const handleTestSource = () => {
    if (!newSource.name || !newSource.type) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    testMutation.mutate(newSource as InsertComponentDataSource);
  };

  const updateSourceConfig = (field: string, value: any) => {
    setNewSource(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [prev.type!]: {
          ...((prev.config as DataSourceConfig)?.[prev.type as keyof DataSourceConfig] || {}),
          [field]: value
        }
      }
    }));
  };

  const renderConfigForm = () => {
    const config = newSource.config as DataSourceConfig;
    
    switch (newSource.type) {
      case 'excel':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-url">Excel File URL (optional)</Label>
              <Input
                id="excel-url"
                placeholder="https://example.com/components.xlsx"
                value={config.excel?.url || ''}
                onChange={(e) => updateSourceConfig('url', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="sheet-name">Sheet Name (optional)</Label>
              <Input
                id="sheet-name"
                placeholder="Leave empty for first sheet"
                value={config.excel?.sheetName || ''}
                onChange={(e) => updateSourceConfig('sheetName', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name Column</Label>
                <Input
                  placeholder="Component Name"
                  value={config.excel?.columnMapping?.name || ''}
                  onChange={(e) => updateSourceConfig('columnMapping', {
                    ...config.excel?.columnMapping,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Type Column</Label>
                <Input
                  placeholder="Type"
                  value={config.excel?.columnMapping?.type || ''}
                  onChange={(e) => updateSourceConfig('columnMapping', {
                    ...config.excel?.columnMapping,
                    type: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 'url':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input
                id="api-endpoint"
                placeholder="https://api.example.com/components"
                value={config.url?.endpoint || ''}
                onChange={(e) => updateSourceConfig('endpoint', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="api-key">API Key (optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Your API key"
                value={config.url?.apiKey || ''}
                onChange={(e) => updateSourceConfig('apiKey', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="format">Response Format</Label>
              <Select 
                value={config.url?.format || 'json'} 
                onValueChange={(value) => updateSourceConfig('format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data-path">Data Path (for JSON)</Label>
              <Input
                id="data-path"
                placeholder="data.components"
                value={config.url?.dataPath || ''}
                onChange={(e) => updateSourceConfig('dataPath', e.target.value)}
              />
            </div>
          </div>
        );

      case 'odoo':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="odoo-url">Odoo Base URL</Label>
                <Input
                  id="odoo-url"
                  placeholder="https://your-odoo.example.com"
                  value={config.odoo?.baseUrl || ''}
                  onChange={(e) => updateSourceConfig('baseUrl', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="odoo-db">Database</Label>
                <Input
                  id="odoo-db"
                  placeholder="your_database"
                  value={config.odoo?.database || ''}
                  onChange={(e) => updateSourceConfig('database', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="odoo-user">Username</Label>
                <Input
                  id="odoo-user"
                  placeholder="api_user"
                  value={config.odoo?.username || ''}
                  onChange={(e) => updateSourceConfig('username', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="odoo-pass">Password</Label>
                <Input
                  id="odoo-pass"
                  type="password"
                  placeholder="api_password"
                  value={config.odoo?.password || ''}
                  onChange={(e) => updateSourceConfig('password', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="odoo-model">Model</Label>
              <Input
                id="odoo-model"
                placeholder="product.product"
                value={config.odoo?.model || ''}
                onChange={(e) => updateSourceConfig('model', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading data sources...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Data Sources</h2>
          <p className="text-muted-foreground">
            Manage component data sources from Excel, APIs, and external systems
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Data Source</DialogTitle>
              <DialogDescription>
                Configure a new source for electrical component data
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source-name">Source Name</Label>
                  <Input
                    id="source-name"
                    placeholder="My Component Database"
                    value={newSource.name || ''}
                    onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="source-type">Source Type</Label>
                  <Select 
                    value={newSource.type || 'excel'} 
                    onValueChange={(value) => setNewSource(prev => ({ 
                      ...prev, 
                      type: value,
                      config: {} 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="url">Web API/URL</SelectItem>
                      <SelectItem value="odoo">Odoo ERP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {renderConfigForm()}

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleTestSource}
                  disabled={testMutation.isPending}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
                
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateSource}
                    disabled={createSourceMutation.isPending}
                  >
                    {createSourceMutation.isPending ? 'Creating...' : 'Create Source'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {dataSources.map((source: ComponentDataSource) => (
          <Card key={source.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSourceIcon(source.type)}
                  <div>
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {source.type} data source
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(source.syncStatus)}
                  <Badge variant="outline">
                    {source.componentCount} components
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {source.lastSync ? (
                    <>Last synced: {new Date(source.lastSync).toLocaleString()}</>
                  ) : (
                    'Never synced'
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncMutation.mutate(source.id)}
                    disabled={syncMutation.isPending || source.syncStatus === 'syncing'}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${
                      syncMutation.isPending || source.syncStatus === 'syncing' ? 'animate-spin' : ''
                    }`} />
                    Sync
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(source.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              
              {source.syncLog?.errors && source.syncLog.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-sm font-medium text-red-800 mb-1">Sync Errors:</div>
                  <ul className="text-xs text-red-700 space-y-1">
                    {source.syncLog.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {dataSources.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-lg font-medium">No data sources configured</div>
              <p className="text-muted-foreground text-center mb-6">
                Add your first data source to start importing electrical components from Excel, APIs, or Odoo
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Data Source
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}