import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Upload, Download, ExternalLink, Eye,
  RefreshCw, CheckCircle2, XCircle, Loader2, CloudUpload,
  AlertTriangle, Ban, Trash2
} from "lucide-react";
import { useDrawings, Drawing } from "@/hooks/useDrawings";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Mirrors server-side sanitisation so we can pre-check for duplicates
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_(). ]/g, "_");
}

// Expected: PWxx-{PART}-xxSALx{variant}.pdf  or  PW4K-{PART}-{variant}.pdf
const PW_PATTERN = /^PW[A-Za-z0-9]+-[A-Za-z0-9]+-/i;

function classifyFile(file: File, existing: Drawing[]): "duplicate" | "invalid-name" | "valid" {
  const safe = sanitizeFilename(file.name.replace(/\\/g, "/").split("/").pop() || file.name);
  const safeLC = safe.toLowerCase();
  // Duplicate: any existing drawing whose display name matches (case-insensitive)
  const isDup = existing.some(d => d.displayName.toLowerCase() === safeLC);
  if (isDup) return "duplicate";
  // Name validation: must match PWxx pattern
  if (!PW_PATTERN.test(safe)) return "invalid-name";
  return "valid";
}

async function uploadSingleFile(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error(`"${file.name}" is not a PDF`);
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/drawings/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  return data.displayName || file.name;
}

interface FileStatus {
  name: string;
  state: "pending" | "uploading" | "done" | "error" | "duplicate" | "invalid-name";
  message?: string;
}

interface UploadZoneProps {
  onUploadComplete: () => void;
  existingDrawings: Drawing[];
}

function UploadZone({ onUploadComplete, existingDrawings }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  function updateStatus(index: number, patch: Partial<FileStatus>) {
    setStatuses(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
  }

  async function processFiles(files: File[]) {
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) {
      setStatuses([{ name: "No PDFs found", state: "error", message: "Only .pdf files are accepted" }]);
      setTimeout(() => setStatuses([]), 4000);
      return;
    }

    // Pre-classify every file before any upload starts
    const initial: FileStatus[] = pdfs.map(f => {
      const cls = classifyFile(f, existingDrawings);
      if (cls === "duplicate") {
        return { name: f.name, state: "duplicate", message: "Already in library — skipped" };
      }
      if (cls === "invalid-name") {
        return { name: f.name, state: "invalid-name", message: "Name doesn't match PWxx-PART-xxSALx pattern — uploading anyway" };
      }
      return { name: f.name, state: "pending" };
    });
    setStatuses(initial);

    let anyDone = false;
    for (let i = 0; i < pdfs.length; i++) {
      if (initial[i].state === "duplicate") continue; // skip duplicates entirely
      updateStatus(i, { state: "uploading" });
      try {
        await uploadSingleFile(pdfs[i]);
        updateStatus(i, { state: "done" });
        anyDone = true;
      } catch (err: any) {
        updateStatus(i, { state: "error", message: err.message });
      }
    }

    if (anyDone) onUploadComplete();

    // Keep results visible for a while then clear
    setTimeout(() => setStatuses([]), 6000);
    if (inputRef.current) inputRef.current.value = "";
  }

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const anyUploading = statuses.some(s => s.state === "uploading" || s.state === "pending");

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer select-none",
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]"
            : "border-technical-300 dark:border-technical-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-technical-700/40"
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => !anyUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.PDF"
          multiple
          className="hidden"
          onChange={e => processFiles(Array.from(e.target.files || []))}
        />
        <CloudUpload className={cn(
          "w-7 h-7 mx-auto mb-1.5 transition-colors",
          dragging ? "text-blue-500" : "text-technical-400"
        )} />
        <p className="text-xs font-medium text-technical-700 dark:text-technical-300">
          {dragging ? "Drop PDFs here" : "Drag & drop PDFs here"}
        </p>
        <p className="text-[10px] text-technical-400 mt-0.5">
          or click to browse — multiple files supported
        </p>
      </div>

      {statuses.length > 0 && (
        <div className="space-y-1 rounded-md border border-technical-200 dark:border-technical-700 p-2 bg-technical-50 dark:bg-technical-800/50">
          {statuses.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {/* Icon */}
              {s.state === "pending"      && <Loader2      className="w-3 h-3 mt-0.5 text-technical-400 animate-spin flex-shrink-0" />}
              {s.state === "uploading"    && <Loader2      className="w-3 h-3 mt-0.5 text-blue-500 animate-spin flex-shrink-0" />}
              {s.state === "done"         && <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />}
              {s.state === "error"        && <XCircle      className="w-3 h-3 mt-0.5 text-red-500 flex-shrink-0" />}
              {s.state === "duplicate"    && <Ban          className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />}
              {s.state === "invalid-name" && <AlertTriangle className="w-3 h-3 mt-0.5 text-yellow-500 flex-shrink-0" />}

              <div className="flex-1 min-w-0">
                <span
                  title={s.name}
                  className={cn(
                  "block truncate font-mono text-[11px]",
                  s.state === "done"         && "text-green-700 dark:text-green-400",
                  s.state === "error"        && "text-red-600 dark:text-red-400",
                  s.state === "uploading"    && "text-blue-600 dark:text-blue-400",
                  s.state === "pending"      && "text-technical-500",
                  s.state === "duplicate"    && "text-amber-700 dark:text-amber-400 line-through",
                  s.state === "invalid-name" && "text-yellow-700 dark:text-yellow-400"
                )}>
                  {s.name}
                </span>
                {s.message && (
                  <span className={cn(
                    "block text-[10px] leading-tight",
                    s.state === "error"        && "text-red-500",
                    s.state === "duplicate"    && "text-amber-500",
                    s.state === "invalid-name" && "text-yellow-600 dark:text-yellow-500"
                  )}>
                    {s.message}
                  </span>
                )}
              </div>

              {/* Right badge */}
              {s.state === "uploading"    && <span className="flex-shrink-0 text-technical-400 text-[10px] mt-0.5">Uploading…</span>}
              {s.state === "done"         && <span className="flex-shrink-0 text-green-600 text-[10px] mt-0.5 font-medium">Added ✓</span>}
              {s.state === "duplicate"    && <span className="flex-shrink-0 text-amber-500 text-[10px] mt-0.5 font-medium">Skipped</span>}
              {s.state === "invalid-name" && <span className="flex-shrink-0 text-yellow-600 text-[10px] mt-0.5 font-medium">Warning</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ViewerDialogProps {
  drawing: Drawing | null;
  onClose: () => void;
  onUploadDone: () => void;
}

function ViewerDialog({ drawing, onClose, onUploadDone }: ViewerDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pdfUrl = drawing
    ? `/api/drawings/file/${encodeURIComponent(drawing.filename)}`
    : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      await uploadSingleFile(file);
      setUploadMsg({ type: "ok", text: `"${file.name}" uploaded successfully` });
      onUploadDone();
    } catch (err: any) {
      setUploadMsg({ type: "error", text: err.message || "Upload failed" });
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
                {uploading
                  ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  : <Upload className="w-3 h-3 mr-1" />}
                {uploading ? "Uploading…" : "Upload PDF"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs ml-1" onClick={onClose}>
                ✕ Close
              </Button>
            </div>
          </div>
          {uploadMsg && (
            <p className={cn("text-xs mt-1", uploadMsg.type === "ok" ? "text-green-600" : "text-red-500")}>
              {uploadMsg.type === "ok" ? <CheckCircle2 className="inline w-3 h-3 mr-1" /> : <XCircle className="inline w-3 h-3 mr-1" />}
              {uploadMsg.text}
            </p>
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
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleUploadComplete() {
    invalidate();
  }

  async function handleDelete(filename: string) {
    setDeleting(filename);
    setConfirmingDelete(null);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/drawings/file/${encodeURIComponent(filename)}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Delete failed" }));
        throw new Error(err.error || "Delete failed");
      }
      invalidate();
    } catch (err: any) {
      setDeleteError(err.message || "Delete failed");
      setTimeout(() => setDeleteError(null), 4000);
    } finally {
      setDeleting(null);
    }
  }

  const content = (
    <>
      <UploadZone onUploadComplete={handleUploadComplete} existingDrawings={drawings} />

      <div className="mt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-technical-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs">Loading drawings…</span>
          </div>
        ) : drawings.length === 0 ? (
          <div className="text-xs text-technical-400 py-4 text-center border border-dashed border-technical-200 dark:border-technical-700 rounded-lg">
            No drawings yet — upload PDFs above
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-technical-400">
                Library ({drawings.length})
              </span>
              <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px]"
                onClick={() => invalidate()}>
                <RefreshCw className="w-2.5 h-2.5 mr-1" />
                Refresh
              </Button>
            </div>
            {deleteError && (
              <p className="text-xs text-red-500 mb-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{deleteError}
              </p>
            )}
            <div className="space-y-0.5">
              {drawings.map((drawing) => {
                const isDeleting    = deleting === drawing.filename;
                const isConfirming  = confirmingDelete === drawing.filename;
                return (
                  <div
                    key={drawing.filename}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded group transition-colors",
                      isDeleting
                        ? "bg-red-50 dark:bg-red-950/30 opacity-60"
                        : isConfirming
                        ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                        : recentlyAdded.has(drawing.filename)
                        ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                        : "hover:bg-blue-50 dark:hover:bg-technical-700 cursor-pointer"
                    )}
                    onClick={() => !isConfirming && !isDeleting && setSelectedDrawing(drawing)}
                  >
                    {/* File icon */}
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 flex-shrink-0 text-red-400 animate-spin" />
                    ) : (
                      <FileText className={cn(
                        "w-3.5 h-3.5 flex-shrink-0",
                        isConfirming ? "text-red-400"
                          : recentlyAdded.has(drawing.filename) ? "text-green-500"
                          : "text-blue-500"
                      )} />
                    )}

                    {/* Filename — single line with tooltip for full name */}
                    <span
                      title={drawing.displayName}
                      className={cn(
                        "flex-1 min-w-0 truncate text-xs font-mono",
                        isConfirming ? "text-red-600 dark:text-red-400 line-through" : "text-technical-800 dark:text-technical-200"
                      )}
                    >
                      {drawing.displayName}
                    </span>

                    {/* Right side — normal: size + View + Delete; confirming: Yes / Cancel */}
                    {isConfirming ? (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-red-500 font-medium">Delete?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-5 px-2 text-[10px]"
                          onClick={() => handleDelete(drawing.filename)}
                        >
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px]"
                          onClick={() => setConfirmingDelete(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-technical-400">
                          {formatBytes(drawing.size)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); setSelectedDrawing(drawing); }}
                          disabled={isDeleting}
                        >
                          <Eye className="w-2.5 h-2.5 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={(e) => { e.stopPropagation(); setConfirmingDelete(drawing.filename); }}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ViewerDialog
        drawing={selectedDrawing}
        onClose={() => setSelectedDrawing(null)}
        onUploadDone={() => { invalidate(); setSelectedDrawing(null); }}
      />
    </>
  );

  if (compact) {
    return <div className="space-y-2">{content}</div>;
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
