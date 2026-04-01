import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useDrawings } from "@/hooks/useDrawings";
import { DrawingViewer } from "./DrawingViewer";
import { cn } from "@/lib/utils";

interface DrawingButtonProps {
  partNumber: string;
  className?: string;
  size?: "xs" | "sm";
}

export function DrawingButton({ partNumber, className, size = "sm" }: DrawingButtonProps) {
  const { findDrawingForPartNumber } = useDrawings();
  const [open, setOpen] = useState(false);

  if (!partNumber) return null;

  const drawing = findDrawingForPartNumber(partNumber);
  const hasDrawing = !!drawing;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        title={hasDrawing ? `View drawing for ${partNumber}` : `Upload drawing for ${partNumber}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          size === "xs" ? "h-5 w-5 p-0" : "h-6 w-6 p-0",
          hasDrawing
            ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
            : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted",
          className
        )}
      >
        <FileText className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </Button>

      <DrawingViewer
        partNumber={partNumber}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
