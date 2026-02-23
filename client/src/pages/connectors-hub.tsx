import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, RefreshCw, Share2, Database, FileText, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SnapshotManager } from "@/components/evidence/SnapshotManager";

interface ConnectorConfig {
  id: string;
  name: string;
  connectorType: 'sharepoint' | 'jira' | 'notion';
  lastSyncedAt?: string;
  lastSnapshotId?: string;
}

interface ConnectorListResponse {
  data?: ConnectorConfig[];
}

export default function ConnectorsHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newConnectorName, setNewConnectorName] = useState("");
  const [newConnectorType, setNewConnectorType] = useState<string>("sharepoint");
  const [newIntegrationId, setNewIntegrationId] = useState("");

  // Fetch Connectors
  const { data: connectors = [], isLoading } = useQuery({
    queryKey: ["/api/connectors"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/connectors");
      if (response && typeof response === "object" && "json" in response && typeof (response as Response).json === "function") {
        const payload = await (response as Response).json();
        return (payload as ConnectorListResponse)?.data ?? [];
      }
      return (response as ConnectorListResponse)?.data ?? [];
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSnapshotId) throw new Error("Snapshot required for context.");
      if (!newConnectorName.trim()) throw new Error("Connector name is required.");
      const resolvedIntegrationId =
        newIntegrationId.trim()
        || `${newConnectorType}:${newConnectorName.trim().toLowerCase().replace(/\s+/g, "-")}`;
      await apiRequest("POST", "/api/connectors", {
        name: newConnectorName.trim(),
        connectorType: newConnectorType,
        integrationId: resolvedIntegrationId,
        scopeConfig: {},
      });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
        setIsDialogOpen(false);
        setNewConnectorName("");
        setNewIntegrationId("");
        toast({ title: "Connector Created", description: "New connector ready to import." });
    },
    onError: (err: Error) => {
        toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  });

  // Import Mutation
  const importMutation = useMutation({
    mutationFn: async (id: string) => {
        if (!selectedSnapshotId) throw new Error("Select a snapshot to import into.");
        await apiRequest("POST", `/api/connectors/${id}/import`, { snapshotId: selectedSnapshotId });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/connectors"] });
        toast({ title: "Import Started", description: "Background job running." });
    },
    onError: (err: Error) => {
        toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    }
  });

  const getIcon = (type: string) => {
    switch(type) {
        case 'sharepoint': return <Share2 className="w-5 h-5 text-blue-600" />;
        case 'jira': return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
        case 'notion': return <FileText className="w-5 h-5 text-gray-800" />;
        default: return <Database className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connectors Hub</h1>
        <p className="text-muted-foreground">Manage connections to external data sources (Import Only)</p>
      </div>

      <SnapshotManager 
        selectedSnapshotId={selectedSnapshotId}
        onSnapshotSelect={setSelectedSnapshotId}
      />

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={!selectedSnapshotId}>
                    <Plus className="w-4 h-4 mr-2" /> New Connector
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Connector</DialogTitle>
                    <DialogDescription>Connect to an external source to import evidence.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Connector Type</label>
                        <Select value={newConnectorType} onValueChange={setNewConnectorType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sharepoint">SharePoint / OneDrive</SelectItem>
                                <SelectItem value="jira">Jira</SelectItem>
                                <SelectItem value="notion">Notion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input 
                            value={newConnectorName} 
                            onChange={(e) => setNewConnectorName(e.target.value)} 
                            placeholder="e.g. Engineering Jira Board"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Integration ID</label>
                        <Input
                            value={newIntegrationId}
                            onChange={(e) => setNewIntegrationId(e.target.value)}
                            placeholder="Paste integration ID from connected provider"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending || !newConnectorName.trim()}
                    >
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
            <div className="col-span-3 text-center py-10">Loading...</div>
        ) : connectors.map((connector) => (
            <Card key={connector.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {connector.name}
                    </CardTitle>
                    {getIcon(connector.connectorType)}
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-muted-foreground mt-2">
                        Last synced: {connector.lastSyncedAt ? new Date(connector.lastSyncedAt).toLocaleDateString() : 'Never'}
                    </div>
                    <div className="mt-4">
                        <Badge variant="secondary" className="capitalize">{connector.connectorType}</Badge>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => importMutation.mutate(connector.id)}
                        disabled={importMutation.isPending || !selectedSnapshotId}
                    >
                        {importMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                        <RefreshCw className="w-3 h-3 mr-2" />
                        Run Import
                    </Button>
                </CardFooter>
            </Card>
        ))}

        {!isLoading && connectors.length === 0 && (
            <div className="col-span-3 text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                No connectors configured. Click "New Connector" to start.
            </div>
        )}
      </div>
    </div>
  );
}
