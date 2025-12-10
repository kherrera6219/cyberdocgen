import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  FileText,
  MessageSquare,
  Filter,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentApproval } from "@shared/schema";

interface EnrichedApproval extends DocumentApproval {
  documentTitle: string;
  documentFramework: string;
}

export default function ControlApprovals() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<EnrichedApproval | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading, error } = useQuery<EnrichedApproval[]>({
    queryKey: ["/api/approvals", selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === "all" 
        ? "/api/approvals" 
        : `/api/approvals?status=${selectedStatus}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch approvals");
      return response.json();
    },
  });

  const pendingCount = approvals.filter(a => a.status === "pending").length;

  const approveMutation = useMutation({
    mutationFn: async ({ id, action, comment }: { id: string; action: "approve" | "reject"; comment: string }) => {
      return apiRequest(`/api/approvals/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: variables.action === "approve" ? "Approved" : "Rejected",
        description: `The control has been ${variables.action === "approve" ? "approved" : "rejected"}.`,
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
      setReviewComment("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process the approval request.",
        variant: "destructive",
      });
    },
  });

  const handleReview = (item: EnrichedApproval) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleApproval = (action: "approve" | "reject") => {
    if (selectedItem) {
      approveMutation.mutate({
        id: selectedItem.id,
        action,
        comment: reviewComment,
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "urgent":
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load approvals</h3>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Control Approvals</h1>
          <p className="text-muted-foreground">Review and approve compliance control changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {isLoading ? "..." : pendingCount} Pending
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : approvals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No approvals found</h3>
              <p className="text-muted-foreground">
                {selectedStatus === "pending" 
                  ? "All pending approvals have been processed."
                  : "No approvals match the selected filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          approvals.map((item) => (
            <Card key={item.id} data-testid={`approval-card-${item.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-lg">{item.documentTitle}</h3>
                      {getStatusBadge(item.status)}
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Approval request for {item.approverRole?.replace("_", " ")} review
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{item.documentFramework}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{item.requestedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.documentId && (
                      <Button variant="outline" size="sm" data-testid={`button-view-doc-${item.id}`}>
                        <FileText className="w-4 h-4 mr-1" />
                        View Document
                      </Button>
                    )}
                    {item.status === "pending" && (
                      <Button 
                        onClick={() => handleReview(item)}
                        data-testid={`button-review-${item.id}`}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Approval Request</DialogTitle>
            <DialogDescription>
              Review the control change and provide your decision.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">{selectedItem.documentTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  Approval request for {selectedItem.approverRole?.replace("_", " ")} review
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">{selectedItem.documentFramework}</Badge>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Review Comment
                </label>
                <Textarea
                  placeholder="Add a comment for your decision..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-review-comment"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleApproval("reject")}
              disabled={approveMutation.isPending}
              data-testid="button-reject"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => handleApproval("approve")}
              disabled={approveMutation.isPending}
              data-testid="button-approve"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
