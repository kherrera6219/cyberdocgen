import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Search,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { EmptyStateCard } from "@/components/ui/loading-error-states";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  name: string;
  serviceDescription?: string | null;
  dataClassification: "public" | "standard" | "confidential" | "restricted";
  securityStatus: "pending" | "approved" | "requires_review" | "rejected";
  soc2Status: "reviewed" | "not_provided" | "na";
  iso27001Status: "reviewed" | "not_provided" | "na";
  lastAssessmentDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VendorFormData {
  name: string;
  serviceDescription: string;
  dataClassification: Vendor["dataClassification"];
  securityStatus: Vendor["securityStatus"];
  soc2Status: Vendor["soc2Status"];
  iso27001Status: Vendor["iso27001Status"];
}

// ─── Risk-level derived from securityStatus ───────────────────────────────────

function deriveRiskLevel(vendor: Vendor): "low" | "medium" | "high" | "critical" {
  if (vendor.securityStatus === "rejected") return "critical";
  if (vendor.securityStatus === "requires_review") return "high";
  if (vendor.dataClassification === "restricted") return "high";
  if (vendor.dataClassification === "confidential") return "medium";
  if (vendor.securityStatus === "pending") return "medium";
  return "low";
}

function RiskBadge({ vendor }: { vendor: Vendor }) {
  const level = deriveRiskLevel(vendor);
  const cfg = {
    low: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: ShieldCheck, label: "Low" },
    medium: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Shield, label: "Medium" },
    high: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertTriangle, label: "High" },
    critical: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert, label: "Critical" },
  }[level];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label} Risk
    </span>
  );
}

function SecurityStatusBadge({ status }: { status: Vendor["securityStatus"] }) {
  const cfg = {
    approved: { color: "text-emerald-400", icon: CheckCircle2, label: "Approved" },
    pending: { color: "text-amber-400", icon: Clock, label: "Pending Review" },
    requires_review: { color: "text-orange-400", icon: AlertTriangle, label: "Requires Review" },
    rejected: { color: "text-red-400", icon: XCircle, label: "Rejected" },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

// ─── Vendor Form Dialog ───────────────────────────────────────────────────────

function VendorDialog({
  open,
  onOpenChange,
  vendor,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendor?: Vendor | null;
  onSave: (data: VendorFormData) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<VendorFormData>({
    name: vendor?.name || "",
    serviceDescription: vendor?.serviceDescription || "",
    dataClassification: vendor?.dataClassification || "standard",
    securityStatus: vendor?.securityStatus || "pending",
    soc2Status: vendor?.soc2Status || "not_provided",
    iso27001Status: vendor?.iso27001Status || "not_provided",
  });

  const update = (k: keyof VendorFormData, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {vendor ? "Edit Vendor" : "Add New Vendor"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Vendor Name *</label>
            <Input
              id="vendor-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Acme Corp"
              className="bg-slate-800 border-slate-600 text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Service Description</label>
            <Textarea
              id="vendor-service-description"
              value={form.serviceDescription}
              onChange={(e) => update("serviceDescription", e.target.value)}
              placeholder="What service does this vendor provide?"
              className="bg-slate-800 border-slate-600 text-slate-100 resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Data Classification</label>
              <Select value={form.dataClassification} onValueChange={(v) => update("dataClassification", v)}>
                <SelectTrigger id="vendor-data-class" className="bg-slate-800 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Security Status</label>
              <Select value={form.securityStatus} onValueChange={(v) => update("securityStatus", v)}>
                <SelectTrigger id="vendor-security-status" className="bg-slate-800 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="requires_review">Requires Review</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">SOC 2 Status</label>
              <Select value={form.soc2Status} onValueChange={(v) => update("soc2Status", v)}>
                <SelectTrigger id="vendor-soc2" className="bg-slate-800 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="not_provided">Not Provided</SelectItem>
                  <SelectItem value="reviewed">Reviewed ✓</SelectItem>
                  <SelectItem value="na">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">ISO 27001 Status</label>
              <Select value={form.iso27001Status} onValueChange={(v) => update("iso27001Status", v)}>
                <SelectTrigger id="vendor-iso27001" className="bg-slate-800 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="not_provided">Not Provided</SelectItem>
                  <SelectItem value="reviewed">Reviewed ✓</SelectItem>
                  <SelectItem value="na">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} className="text-slate-300">
            Cancel
          </Button>
          <Button
            id="vendor-save-btn"
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
          >
            {saving ? "Saving..." : vendor ? "Update Vendor" : "Create Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorGrcPage() {
  const { profile } = useOrganization();
  const organizationId = profile?.organizationId;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const { data: vendors = [], isLoading, refetch } = useQuery<Vendor[]>({
    queryKey: ["vendors", organizationId],
    queryFn: () => apiRequest("/api/vendors").then((r) => r.data ?? r),
    enabled: !!organizationId,
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/vendors", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDialogOpen(false);
      toast({ title: "Vendor created", description: "Third-party vendor added to inventory." });
    },
    onError: () => toast({ title: "Error", description: "Failed to create vendor.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/vendors/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDialogOpen(false);
      setEditVendor(null);
      toast({ title: "Vendor updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update vendor.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/vendors/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDeleteId(null);
      toast({ title: "Vendor removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete vendor.", variant: "destructive" }),
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = (form: VendorFormData) => {
    if (editVendor) {
      updateMutation.mutate({ id: editVendor.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  // ─── Filtered Vendors ───────────────────────────────────────────────────────
  const filtered = vendors.filter((v) => {
    const matchesSearch =
      !search || v.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.securityStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── Summary Counts ─────────────────────────────────────────────────────────
  const summary = {
    total: vendors.length,
    rejected: vendors.filter((v) => v.securityStatus === "rejected").length,
    requiresReview: vendors.filter((v) => v.securityStatus === "requires_review").length,
    approved: vendors.filter((v) => v.securityStatus === "approved").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            Vendor GRC
          </h1>
          <p className="text-slate-400 mt-1">
            Third-party sub-processor inventory, security assessments &amp; compliance tracking
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            id="vendor-refresh-btn"
            variant="ghost"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            id="add-vendor-btn"
            onClick={() => { setEditVendor(null); setDialogOpen(true); }}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Vendors", value: summary.total, icon: Building2, color: "from-indigo-600 to-indigo-400" },
          { label: "Rejected", value: summary.rejected, icon: ShieldAlert, color: "from-red-600 to-rose-400" },
          { label: "Needs Review", value: summary.requiresReview, icon: AlertTriangle, color: "from-orange-600 to-amber-400" },
          { label: "Approved", value: summary.approved, icon: ShieldCheck, color: "from-emerald-600 to-green-400" },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm"
          >
            <div className={`absolute top-3 right-3 w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center opacity-80`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-3xl font-black text-white">{card.value}</div>
            <div className="text-xs font-semibold text-slate-400 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="vendor-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="w-full pl-9 pr-4 h-10 text-sm bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="vendor-status-filter" className="w-44 bg-white/5 border-white/10 text-slate-200">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="requires_review">Requires Review</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Vendor Table ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          Loading vendors...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyStateCard
          className="border-0 shadow-none bg-transparent"
          icon={<Building2 className="w-8 h-8 text-slate-500" />}
          title="No vendors found"
          message={search || statusFilter !== "all" ? "Try adjusting your filters." : "Add your first third-party vendor to get started."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((vendor) => (
            <div
              key={vendor.id}
              className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-indigo-500/30 transition-all duration-200 group"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {vendor.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-base">{vendor.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      vendor.dataClassification === "restricted" ? "bg-red-500/20 text-red-400" :
                      vendor.dataClassification === "confidential" ? "bg-orange-500/20 text-orange-400" :
                      vendor.dataClassification === "standard" ? "bg-blue-500/20 text-blue-400" :
                      "bg-slate-500/20 text-slate-400"
                    }`}>
                      {vendor.dataClassification}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {vendor.serviceDescription && (
                      <span className="truncate max-w-xs">{vendor.serviceDescription}</span>
                    )}
                    {vendor.soc2Status === "reviewed" && (
                      <span className="text-emerald-400 font-semibold">SOC 2 ✓</span>
                    )}
                    {vendor.iso27001Status === "reviewed" && (
                      <span className="text-emerald-400 font-semibold">ISO 27001 ✓</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5 ml-4">
                <SecurityStatusBadge status={vendor.securityStatus} />
                <RiskBadge vendor={vendor} />

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    id={`edit-vendor-${vendor.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditVendor(vendor); setDialogOpen(true); }}
                    className="text-slate-400 hover:text-white h-8 w-8 p-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    id={`delete-vendor-${vendor.id}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(vendor.id)}
                    className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <VendorDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditVendor(null); }}
        vendor={editVendor}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Vendor?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove the vendor and all associated questionnaire records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-delete-vendor"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
