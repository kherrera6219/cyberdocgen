import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  framework: string;
  control: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requestedAt: string;
  documentId?: string;
  priority: "low" | "medium" | "high";
}

export default function ControlApprovals() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mockApprovals: ApprovalItem[] = [
    {
      id: "1",
      title: "Information Security Policy Update",
      description: "Annual review and update of the information security policy to align with ISO 27001:2022 requirements.",
      framework: "ISO 27001",
      control: "A.5.1",
      status: "pending",
      requestedBy: "John Smith",
      requestedAt: "2024-12-08T10:30:00Z",
      documentId: "doc-123",
      priority: "high"
    },
    {
      id: "2",
      title: "Access Control Procedure",
      description: "New procedure for managing user access rights and periodic reviews.",
      framework: "SOC 2",
      control: "CC6.1",
      status: "pending",
      requestedBy: "Jane Doe",
      requestedAt: "2024-12-07T14:15:00Z",
      documentId: "doc-456",
      priority: "medium"
    },
    {
      id: "3",
      title: "Incident Response Plan",
      description: "Updated incident response procedures including new escalation paths.",
      framework: "FedRAMP",
      control: "IR-4",
      status: "approved",
      requestedBy: "Mike Johnson",
      requestedAt: "2024-12-05T09:00:00Z",
      documentId: "doc-789",
      priority: "high"
    },
    {
      id: "4",
      title: "Data Classification Policy",
      description: "New data classification scheme for sensitive information handling.",
      framework: "NIST 800-53",
      control: "RA-2",
      status: "rejected",
      requestedBy: "Sarah Williams",
      requestedAt: "2024-12-04T16:45:00Z",
      priority: "low"
    }
  ];

  const filteredApprovals = selectedStatus === "all" 
    ? mockApprovals 
    : mockApprovals.filter(a => a.status === selectedStatus);

  const pendingCount = mockApprovals.filter(a => a.status === "pending").length;

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
  });

  const handleReview = (item: ApprovalItem) => {
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

  const getStatusBadge = (status: ApprovalItem["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    }
  };

  const getPriorityBadge = (priority: ApprovalItem["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Control Approvals</h1>
          <p className="text-muted-foreground">Review and approve compliance control changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {pendingCount} Pending
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
        {filteredApprovals.map((item) => (
          <Card key={item.id} data-testid={`approval-card-${item.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    {getStatusBadge(item.status)}
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">{item.framework}</Badge>
                      <span>{item.control}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{item.requestedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.requestedAt)}</span>
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
        ))}

        {filteredApprovals.length === 0 && (
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
                <h4 className="font-medium mb-1">{selectedItem.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">{selectedItem.framework}</Badge>
                <span className="text-muted-foreground">{selectedItem.control}</span>
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
