import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, ExternalLink, Eye, RefreshCw } from "lucide-react";
import { useDrawings, Drawing } from "@/hooks/useDrawings";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ViewerDialogProps {
  drawing: Drawing | null;
  onClose: () => void;
  onUploadDone: () => void;
}

function ViewerDialog({ drawing, onClose, onUploadDone }: ViewerDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pdfUrl = drawing
    ? `/api/drawings/file/${encodeURIComponent(drawing.filename)}`
    : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const res = await fetch("/api/drawings/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      onUploadDone();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={!!drawing} onOpenChange={() => onClose()}>
      <DialogContent className="!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !max-h-screen !rounded-none flex flex-col p-0 gap-0 z-[99999]">
        <DialogHeader className="px-4 py-2 border-b border-technical-200 dark:border-technical-600 flex-shrink-0 bg-white dark:bg-technical-800">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <DialogTitle className="flex-1 text-sm font-medium truncate">
              {drawing?.displayName}
            </DialogTitle>
            {drawing && (
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {formatBytes(drawing.size)}
              </Badge>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              {pdfUrl && (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => window.open(pdfUrl, "_blank")}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    New Tab
                  </Button>
                  <a href={pdfUrl} download={drawing?.displayName}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </a>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.PDF"
                className="hidden" onChange={handleFileChange} />
              <Button size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="w-3 h-3 mr-1" />
                {uploading ? "Uploading…" : "Upload PDF"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs ml-1" onClick={onClose}>
                ✕ Close
              </Button>
            </div>
          </div>
          {uploadError && (
            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-technical-900">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={drawing?.displayName}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-technical-400">
              No drawing selected
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DrawingsBrowserPanelProps {
  compact?: boolean;
}

export default function DrawingsBrowserPanel({ compact = false }: DrawingsBrowserPanelProps) {
  const { drawings, isLoading, invalidate } = useDrawings();
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const res = await fetch("/api/drawings/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      invalidate();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  const content = (
    <>
      {isLoading ? (
        <div className="text-xs text-technical-400 py-4 text-center">Loading drawings…</div>
      ) : drawings.length === 0 ? (
        <div className="text-xs text-technical-400 py-4 text-center">
          No drawings uploaded yet.
          <br />Use the button below to add PDFs.
        </div>
      ) : (
        <div className="space-y-1">
          {drawings.map((drawing) => (
            <div
              key={drawing.filename}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-technical-700 cursor-pointer group transition-colors"
              onClick={() => setSelectedDrawing(drawing)}
            >
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="flex-1 text-xs text-technical-800 dark:text-technical-200 truncate font-mono leading-tight">
                {drawing.displayName}
              </span>
              <span className="text-[10px] text-technical-400 flex-shrink-0 hidden group-hover:inline">
                {formatBytes(drawing.size)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); setSelectedDrawing(drawing); }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-technical-100 dark:border-technical-700 mt-2">
        <input
          ref={uploadRef}
          type="file"
          accept=".pdf,.PDF"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => uploadRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-3 h-3 mr-1" />
          {uploading ? "Uploading…" : "Upload PDF"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7"
          onClick={() => invalidate()}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
        {!isLoading && (
          <span className="ml-auto text-[10px] text-technical-400">
            {drawings.length} drawing{drawings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {uploadError && (
        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
      )}

      <ViewerDialog
        drawing={selectedDrawing}
        onClose={() => setSelectedDrawing(null)}
        onUploadDone={() => { invalidate(); setSelectedDrawing(null); }}
      />
    </>
  );

  if (compact) {
    return <div className="space-y-1">{content}</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-technical-900 dark:text-technical-100">
          <FileText className="w-4 h-4 text-blue-500" />
          Technical Drawings Library
          {!isLoading && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {drawings.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
}
