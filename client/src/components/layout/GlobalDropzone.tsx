import { useState, useEffect, useCallback } from "react";
import { UploadCloud } from "lucide-react";
import { useLocation } from "wouter";

export function GlobalDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [, setLocation] = useLocation();

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only close if we are dragging out of the window completely
    if (e.relatedTarget === null || (e.relatedTarget as HTMLElement).nodeName === "HTML") {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      // In a real implementation, we would store these files in global state
      // or pass them via query parameters, but for now we route them to the ingestion page
      setLocation("/evidence-ingestion");
    }
  }, [setLocation]);

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-95">
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-primary rounded-3xl bg-card shadow-2xl animate-bounce">
        <UploadCloud className="w-24 h-24 text-primary mb-6" />
        <h2 className="text-3xl font-bold text-foreground">Drop files to ingest evidence</h2>
        <p className="text-muted-foreground mt-2 text-lg">Documents, PDFs, and spreadsheets are supported</p>
      </div>
    </div>
  );
}
