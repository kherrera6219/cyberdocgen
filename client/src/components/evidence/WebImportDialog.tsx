import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface WebImportDialogProps {
  snapshotId: string | null;
  trigger?: React.ReactNode;
}

export function WebImportDialog({ snapshotId, trigger }: WebImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState([1]);
  const [maxPages, setMaxPages] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCrawl = async () => {
    if (!snapshotId) {
        toast({ title: "No Snapshot Selected", description: "Please select a snapshot context first.", variant: "destructive" });
        return;
    }
    if (!url) return;

    try {
        setIsLoading(true);
        await apiRequest("POST", "/api/web-import/crawl", {
            url,
            maxDepth: depth[0],
            maxPages,
            snapshotId
        });
        toast({ title: "Crawl Started", description: "Web pages are being imported in the background." });
        setOpen(false);
        setUrl("");
        queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
    } catch (error: any) {
        toast({ title: "Crawl Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button variant="outline" className="gap-2" disabled={!snapshotId}>
                <Globe className="w-4 h-4" />
                Web Import
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import from Web</DialogTitle>
          <DialogDescription>
            Crawl and import public web pages as evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label>Target URL</Label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="https://example.com/privacy-policy" 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Only pages from the same domain will be followed.
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between">
                    <Label>Crawl Depth: {depth}</Label>
                </div>
                <Slider 
                    value={depth} 
                    onValueChange={setDepth} 
                    max={3} 
                    step={1} 
                />
                <p className="text-xs text-muted-foreground">
                    Depth 1 = URL only. Depth 2 = Links on URL. Depth 3 = Links on Depth 2.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Max Pages Limit</Label>
                <Input 
                    type="number" 
                    value={maxPages} 
                    onChange={(e) => setMaxPages(parseInt(e.target.value))} 
                    max={50} 
                    min={1} 
                />
                <p className="text-xs text-muted-foreground">
                    Hard limit to prevent scraping too much data (Max 50).
                </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <p>Ensure you have permission to crawl this site. All actions are audit logged.</p>
            </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCrawl} disabled={isLoading || !url || !snapshotId}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
