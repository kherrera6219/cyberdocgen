import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Record<string, Shortcut[]> = {
  Global: [
    { keys: ["Ctrl", "K"], description: "Open Global Search" },
    { keys: ["Ctrl", "/"], description: "Show Keyboard Shortcuts" },
    { keys: ["Ctrl", ","], description: "Open Settings" },
  ],
  Documents: [
    { keys: ["Ctrl", "N"], description: "New Document" },
    { keys: ["Ctrl", "S"], description: "Save Document" },
    { keys: ["Esc"], description: "Close Modal / Cancel" },
  ],
  Navigation: [
    { keys: ["Alt", "Left Arrow"], description: "Go Back" },
    { keys: ["Alt", "Right Arrow"], description: "Go Forward" },
  ]
};

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {Object.entries(SHORTCUTS).map(([category, shortcuts]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{category}</h4>
              <div className="space-y-2">
                {shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <kbd
                          key={j}
                          className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[11px] font-medium text-muted-foreground opacity-100 shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
