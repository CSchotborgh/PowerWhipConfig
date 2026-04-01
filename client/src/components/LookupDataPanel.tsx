import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, RotateCcw, CheckCircle, AlertCircle, Database, FileSpreadsheet, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LookupVersion {
  fileName: string;
  uploadDate: string;
}

interface LookupStatus {
  status: 'live' | 'default' | 'no-data';
  activeFileName: string | null;
  activeUploadDate: string | null;
  versions: LookupVersion[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function StatusBadge({ status }: { status: LookupStatus['status'] }) {
  if (status === 'live') {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Live
      </Badge>
    );
  }
  if (status === 'default') {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center gap-1">
        <Database className="w-3 h-3" />
        Default
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      No Data
    </Badge>
  );
}

export default function LookupDataPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: lookupStatus, isLoading } = useQuery<LookupStatus>({
    queryKey: ['/api/lookup/status'],
    refetchInterval: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/lookup/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/lookup/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/excel/components'] });
      const countMsg = typeof data.componentCount === 'number'
        ? ` ${data.componentCount} component${data.componentCount !== 1 ? 's' : ''} loaded.`
        : '';
      toast({
        title: "Lookup file updated",
        description: `${data.fileName} is now active.${countMsg}`,
      });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (fileName: string) => {
      return apiRequest('POST', '/api/lookup/restore', { fileName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lookup/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/excel/components'] });
      toast({
        title: "Version restored",
        description: "The selected lookup file is now active.",
      });
    },
    onError: () => {
      toast({
        title: "Restore failed",
        description: "Could not restore the selected version.",
        variant: "destructive",
      });
    },
  });

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setUploadError('Only .xlsx files are accepted');
      return;
    }
    setUploadError(null);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Lookup Data Source
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="h-12 bg-technical-100 dark:bg-technical-700 rounded animate-pulse" />
          ) : lookupStatus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={lookupStatus.status} />
                <span className="text-sm text-technical-600 dark:text-technical-400">
                  {lookupStatus.status === 'live' && 'User-uploaded file active'}
                  {lookupStatus.status === 'default' && 'Using bundled default file'}
                  {lookupStatus.status === 'no-data' && 'No lookup data available'}
                </span>
              </div>
              {lookupStatus.activeFileName && (
                <div className="flex items-start gap-2 p-2 bg-technical-50 dark:bg-technical-800 rounded text-xs">
                  <FileSpreadsheet className="w-3 h-3 mt-0.5 text-technical-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-mono text-technical-800 dark:text-technical-200 truncate">
                      {lookupStatus.activeFileName}
                    </p>
                    {lookupStatus.activeUploadDate && (
                      <p className="text-technical-500 dark:text-technical-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(lookupStatus.activeUploadDate)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {lookupStatus.status === 'no-data' && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Upload a MasterBubbleUpLookup .xlsx file to enable component matching.
                </p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="w-4 h-4" />
            Upload New Lookup File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-technical-300 dark:border-technical-600 hover:border-primary hover:bg-primary/5",
              uploadMutation.isPending && "pointer-events-none opacity-60"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('lookup-file-input')?.click()}
          >
            <input
              id="lookup-file-input"
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleInputChange}
            />
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-technical-400" />
            {uploadMutation.isPending ? (
              <p className="text-sm font-medium text-technical-600 dark:text-technical-400">
                Uploading and validating...
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-technical-700 dark:text-technical-300">
                  Drop a MasterBubbleUpLookup .xlsx file here
                </p>
                <p className="text-xs text-technical-500 dark:text-technical-400 mt-1">
                  or click to browse
                </p>
              </>
            )}
          </div>

          {uploadError && (
            <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadMutation.isSuccess && uploadMutation.data && (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
              <CheckCircle className="w-3 h-3 shrink-0" />
              <span>
                File uploaded and active.
                {typeof uploadMutation.data.componentCount === 'number' && (
                  <> {uploadMutation.data.componentCount} component{uploadMutation.data.componentCount !== 1 ? 's' : ''} loaded.</>
                )}
              </span>
            </div>
          )}

          {/* Format guide */}
          <div className="text-xs text-technical-500 dark:text-technical-400 space-y-1">
            <p className="font-medium text-technical-700 dark:text-technical-300">Required column:</p>
            <code className="bg-technical-100 dark:bg-technical-800 px-1.5 py-0.5 rounded font-mono">
              Choose receptacle
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      {lookupStatus && lookupStatus.versions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="w-4 h-4" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lookupStatus.versions.map((version, index) => (
              <div
                key={version.fileName}
                className={cn(
                  "flex items-center justify-between p-2 rounded border text-xs",
                  index === 0
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-technical-50 dark:bg-technical-800 border-technical-200 dark:border-technical-600"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-technical-800 dark:text-technical-200 truncate">
                    {version.fileName}
                  </p>
                  <p className="text-technical-500 dark:text-technical-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDate(version.uploadDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {index === 0 ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                      Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-6 px-2"
                      disabled={restoreMutation.isPending}
                      onClick={() => restoreMutation.mutate(version.fileName)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
