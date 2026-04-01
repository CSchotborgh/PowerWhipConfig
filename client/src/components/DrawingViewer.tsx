import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, ExternalLink, AlertCircle } from "lucide-react";
import { useDrawings } from "@/hooks/useDrawings";

interface DrawingViewerProps {
  partNumber: string;
  open: boolean;
  onClose: () => void;
}

export function DrawingViewer({ partNumber, open, onClose }: DrawingViewerProps) {
  const { findDrawingForPartNumber, invalidate } = useDrawings();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawing = findDrawingForPartNumber(partNumber);
  const pdfUrl = drawing
    ? `/api/drawings/file/${encodeURIComponent(drawing.filename)}`
    : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/drawings/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      invalidate();
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              Technical Drawing
              {partNumber && (
                <Badge variant="outline" className="font-mono text-xs">
                  {partNumber}
                </Badge>
              )}
            </DialogTitle>

            <div className="flex items-center gap-2 flex-shrink-0">
              {drawing && (
                <>
                  <a
                    href={`/api/drawings/file/${encodeURIComponent(drawing.filename)}`}
                    download={drawing.displayName}
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </a>
                  <a
                    href={`/api/drawings/file/${encodeURIComponent(drawing.filename)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      New Tab
                    </Button>
                  </a>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant={drawing ? "outline" : "default"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-3 h-3 mr-1" />
                {uploading ? "Uploading…" : drawing ? "Replace" : "Upload PDF"}
              </Button>
            </div>
          </div>

          {drawing && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
              {drawing.displayName}
            </p>
          )}
          {uploadError && (
            <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              {uploadError}
            </div>
          )}
          {uploadSuccess && !uploadError && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Drawing uploaded successfully.
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted/30">
          {pdfUrl ? (
            <iframe
              key={pdfUrl}
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Technical drawing for ${partNumber}`}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-8">
              <FileText className="w-16 h-16 opacity-20" />
              <div className="text-center max-w-sm">
                <p className="text-lg font-medium">No drawing found</p>
                <p className="text-sm mt-1">
                  Upload a PDF whose filename contains{" "}
                  <span className="font-mono text-primary">{partNumber}</span>
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Example:{" "}
                  <span className="font-mono">
                    PWxx-{partNumber}-xxSALx(000).pdf
                  </span>
                </p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Drawing
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
