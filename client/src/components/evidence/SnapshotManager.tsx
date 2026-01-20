import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Snapshot {
  id: string;
  name: string;
  status: "open" | "locked" | "archived";
  createdAt: string;
}

interface SnapshotManagerProps {
  selectedSnapshotId: string | null;
  onSnapshotSelect: (id: string, name: string) => void;
}

export function SnapshotManager({ selectedSnapshotId, onSnapshotSelect }: SnapshotManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Snapshots
  const { data: routeData, isLoading } = useQuery<{ data: Snapshot[] }>({
    queryKey: ["/api/evidence/snapshots"],
  });
  
  const snapshots = routeData?.data;

  // Create Snapshot Mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/evidence/snapshots", { name });
      return res.json();
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence/snapshots"] });
      setNewSnapshotName("");
      setIsCreating(false);
      // Auto-select the new snapshot
      if (response?.data?.id) {
        onSnapshotSelect(response.data.id, response.data.name);
      }
      toast({ title: "Snapshot created", description: "New audit snapshot ready." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create snapshot.", variant: "destructive" });
    },
  });

  const activeSnapshot = snapshots?.find((s) => s.id === selectedSnapshotId);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
            <span>Audit Context</span>
            {activeSnapshot && (
                 <Badge variant={activeSnapshot.status === 'locked' ? 'secondary' : 'default'}>
                    {activeSnapshot.status.toUpperCase()}
                 </Badge>
            )}
        </CardTitle>
        <CardDescription>Select or create an audit period (Snapshot) to ingest documents into.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
             {/* Selector */}
             <div className="flex gap-2">
                 <Select 
                    value={selectedSnapshotId || ""} 
                    onValueChange={(val) => {
                        const snap = snapshots?.find(s => s.id === val);
                        if(snap) onSnapshotSelect(snap.id, snap.name);
                    }}
                 >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an audit snapshot..." />
                    </SelectTrigger>
                    <SelectContent>
                        {snapshots?.map((snap) => (
                            <SelectItem key={snap.id} value={snap.id}>
                                {snap.name} ({format(new Date(snap.createdAt), "MMM d, yyyy")})
                            </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <Button variant="outline" size="icon" onClick={() => setIsCreating(!isCreating)}>
                    <Plus className="h-4 w-4" />
                 </Button>
             </div>

             {/* Creation Form */}
             {isCreating && (
                 <div className="flex gap-2 items-end border p-3 rounded-md bg-muted/20">
                    <div className="grid gap-1.5 flex-1">
                        <Label htmlFor="snapshot-name">New Snapshot Name</Label>
                        <Input 
                            id="snapshot-name" 
                            placeholder="e.g. Q3 2024 SOC2 Audit" 
                            value={newSnapshotName}
                            onChange={(e) => setNewSnapshotName(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => createMutation.mutate(newSnapshotName)}
                        disabled={!newSnapshotName.trim() || createMutation.isPending}
                    >
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                        Create
                    </Button>
                 </div>
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
