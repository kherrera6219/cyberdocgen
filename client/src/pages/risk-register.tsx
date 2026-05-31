import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShieldAlert, 
  Plus, 
  Settings, 
  RefreshCw, 
  Check, 
  X, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Gauge, 
  TrendingDown, 
  Layers, 
  Activity, 
  Trash2 
} from "lucide-react";
import { EmptyStateCard } from "@/components/ui/loading-error-states";
import type { Risk, Document } from "@shared/schema";

interface ControlTestResult {
  controlId: string;
  name: string;
  frameworks: { soc2: string; iso27001: string };
  status: "passed" | "failed";
  evidence: string;
  checkedAt: string;
}

interface PolicyProposal {
  id: string;
  documentId: string;
  documentTitle: string;
  signalType: string;
  evidence: string;
  originalContent: string;
  proposedContent: string;
  diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function RiskRegister() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"kanban" | "controls" | "self-healing">("kanban");
  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectProposal, setInspectProposal] = useState<PolicyProposal | null>(null);

  // New Risk Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Security");
  const [inherentLikelihood, setInherentLikelihood] = useState(3);
  const [inherentImpact, setInherentImpact] = useState(3);
  const [residualLikelihood, setResidualLikelihood] = useState(2);
  const [residualImpact, setResidualImpact] = useState(2);
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [selectedControl, setSelectedControl] = useState<string[]>([]);

  // 1. Fetch Risks
  const { data: risksResponse, isLoading: risksLoading } = useQuery<Risk[] | { success?: boolean; data?: Risk[] }>({
    queryKey: ["/api/risks"],
  });

  const risks = useMemo(() => {
    if (Array.isArray(risksResponse)) return risksResponse;
    if (risksResponse && Array.isArray(risksResponse.data)) return risksResponse.data;
    return [];
  }, [risksResponse]);

  // 2. Fetch Policies/Documents for mitigating links
  const { data: docsResponse } = useQuery<Document[] | { success?: boolean; data?: Document[] }>({
    queryKey: ["/api/documents"],
  });

  const documents = useMemo(() => {
    if (Array.isArray(docsResponse)) return docsResponse;
    if (docsResponse && Array.isArray(docsResponse.data)) return docsResponse.data;
    return [];
  }, [docsResponse]);

  // 3. Fetch Continuous Control Test results
  const { data: testsResponse, refetch: runControlTests, isFetching: testsRunning } = useQuery<{ success: boolean; data: ControlTestResult[] }>({
    queryKey: ["/api/risks/control-tests"],
    enabled: activeTab === "controls",
  });

  const controlTests = useMemo(() => {
    return testsResponse?.success ? testsResponse.data : [];
  }, [testsResponse]);

  // 4. Fetch Self-Healing proposals
  const { data: proposalsResponse, refetch: refetchProposals } = useQuery<{ success: boolean; data: PolicyProposal[] }>({
    queryKey: ["/api/risks/policy-sync/proposals"],
    enabled: activeTab === "self-healing",
  });

  const proposals = useMemo(() => {
    return proposalsResponse?.success ? proposalsResponse.data : [];
  }, [proposalsResponse]);

  // Mutations
  const createRiskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/risks", {
        method: "POST",
        body: {
          title,
          description,
          category,
          inherentLikelihood,
          inherentImpact,
          residualLikelihood,
          residualImpact,
          mitigatingControls: selectedControl,
          treatmentPlan,
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      toast({ title: "GRC Threat Logged", description: "The GRC Risk has been registered and scoring calculated." });
      setShowAddModal(false);
      resetForm();
    }
  });

  const updateRiskStatusMutation = useMutation({
    mutationFn: async ({ riskId, status }: { riskId: string; status: string }) => {
      await apiRequest(`/api/risks/${riskId}`, {
        method: "PUT",
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      toast({ title: "Risk Status Updated", description: "Risk status change recorded in historical logs." });
    }
  });

  const deleteRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      await apiRequest(`/api/risks/${riskId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      toast({ title: "Risk Deleted", description: "Risk record permanently removed from the ledger." });
    }
  });

  const approveProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await apiRequest(`/api/risks/policy-sync/approve/${proposalId}`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      refetchProposals();
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Proposal Committed", description: "Self-healing policy version successfully deployed." });
      setInspectProposal(null);
    }
  });

  const rejectProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await apiRequest(`/api/risks/policy-sync/reject/${proposalId}`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      refetchProposals();
      toast({ title: "Proposal Discarded", description: "AI policy proposal rejected by administrator." });
      setInspectProposal(null);
    }
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Security");
    setInherentLikelihood(3);
    setInherentImpact(3);
    setResidualLikelihood(2);
    setResidualImpact(2);
    setTreatmentPlan("");
    setSelectedControl([]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 15) return "bg-red-500/10 border-red-500/30 text-red-500";
    if (score >= 8) return "bg-amber-500/10 border-amber-500/30 text-amber-500";
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-500";
  };

  if (risksLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-blue-950 to-slate-900 border border-blue-900/50 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm pointer-events-none">
          <ShieldAlert className="w-64 h-64 text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-300">
              <ShieldAlert className="w-3.5 h-3.5" /> GRC Governance Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">On-Premises GRC Risk & Control Center</h1>
            <p className="text-gray-300 max-w-xl text-sm sm:text-base">
              Catalog enterprise threats, verify local control test telemetry, and audit self-healing AI policy diffs offline.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-4 py-2 shadow-md rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Log GRC Threat
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === "kanban" ? "text-blue-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Layers className="w-4 h-4" /> Threat Kanban Register
          {activeTab === "kanban" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab("controls")}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === "controls" ? "text-blue-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Activity className="w-4 h-4" /> Continuous Control Tests
          {activeTab === "controls" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab("self-healing")}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === "self-healing" ? "text-blue-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sparkles className="w-4 h-4" /> AI Policy Self-Healing
          {activeTab === "self-healing" && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />}
        </button>
      </div>

      {/* Tab: Threat Kanban Register */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(["identified", "mitigated", "accepted", "transferred"] as const).map((colStatus) => {
            const filteredRisks = risks.filter(r => r.status === colStatus);
            return (
              <div key={colStatus} className="space-y-4">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200/50 dark:border-gray-700">
                  <span className="font-bold text-xs uppercase text-gray-600 dark:text-gray-400 tracking-wider">
                    {colStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-[10px] font-bold text-blue-500">
                    {filteredRisks.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[50vh]">
                  {filteredRisks.map((risk) => (
                    <Card key={risk.id} className="border border-gray-200 dark:border-gray-800 dark:bg-slate-900 shadow cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] hover:border-primary/20 transition-all duration-200">
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 rounded bg-blue-500/5 border border-blue-500/10">
                              {risk.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:bg-red-500/10"
                                onClick={() => deleteRiskMutation.mutate(risk.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-2 leading-snug">{risk.title}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{risk.description}</p>
                        </div>

                        {/* Mitigating Controls linked */}
                        {risk.mitigatingControls && risk.mitigatingControls.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-medium text-gray-400">Mitigating Policies:</div>
                            <div className="flex flex-wrap gap-1">
                              {risk.mitigatingControls.map((cId) => {
                                const doc = documents.find(d => d.id === cId);
                                return (
                                  <span key={cId} className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                    <FileText className="w-2.5 h-2.5" /> {doc ? doc.title : "Linked Policy"}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="h-[1px] bg-gray-150 dark:bg-gray-800" />

                        {/* Scores Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 rounded bg-gray-50 dark:bg-gray-950 border border-gray-200/40 dark:border-gray-800">
                            <div className="text-[9px] text-gray-400 font-medium">Inherent Risk</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-bold text-xs">{risk.inherentScore}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded border font-bold ${getScoreColor(risk.inherentScore)}`}>
                                {risk.inherentLikelihood}x{risk.inherentImpact}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 rounded bg-gray-50 dark:bg-gray-950 border border-gray-200/40 dark:border-gray-800">
                            <div className="text-[9px] text-gray-400 font-medium flex items-center gap-0.5">
                              Residual Risk <TrendingDown className="w-3 h-3 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-bold text-xs">{risk.residualScore}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded border font-bold ${getScoreColor(risk.residualScore)}`}>
                                {risk.residualLikelihood}x{risk.residualImpact}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Move Actions list */}
                        <div className="flex justify-end gap-1 mt-2">
                          {(["identified", "mitigated", "accepted", "transferred"] as const)
                            .filter(s => s !== colStatus)
                            .map((targetStat) => (
                              <Button
                                key={targetStat}
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[9px] uppercase px-1.5 hover:bg-blue-500/10 text-blue-500"
                                onClick={() => updateRiskStatusMutation.mutate({ riskId: risk.id, status: targetStat })}
                              >
                                {targetStat.slice(0, 3)}
                              </Button>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredRisks.length === 0 && (
                    <EmptyStateCard
                      className="border-dashed shadow-none bg-transparent"
                      icon={<ShieldAlert className="w-4 h-4 text-gray-400" />}
                      title={
                        colStatus === "identified" ? "No Identified Threats" :
                        colStatus === "mitigated" ? "No Mitigated Threats" :
                        colStatus === "accepted" ? "No Accepted Risks" :
                        "No Transferred Risks"
                      }
                      message={
                        colStatus === "identified" ? "All clear. Log new threats or scan repositories to identify compliance gaps." :
                        colStatus === "mitigated" ? "No threats mitigated yet. Link compliance policies to active risks to mitigate them." :
                        colStatus === "accepted" ? "No risks have been formally accepted by an administrator." :
                        "No risks have been transferred via SLA or insurance."
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Continuous Control Tests */}
      {activeTab === "controls" && (
        <div className="space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800 dark:bg-slate-900 shadow-md">
            <CardHeader className="p-6 border-b border-gray-150 dark:border-gray-800/80 bg-gray-50/50 dark:bg-slate-900 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" /> Host GRC Control Tests Engine
                </CardTitle>
                <CardDescription className="text-xs">
                  Runs localized background auditing tasks verifying encryption configurations, logs rotated size capping, and VM disk telemetries.
                </CardDescription>
              </div>
              <Button
                onClick={() => runControlTests()}
                disabled={testsRunning}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-1.5 shadow font-bold"
              >
                <RefreshCw className={`w-4 h-4 ${testsRunning ? "animate-spin" : ""}`} />
                {testsRunning ? "Running Checks..." : "Run Test Suite"}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {controlTests.map((check) => (
                  <div key={check.controlId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-gray-200/50 dark:border-gray-800 bg-gray-50/30 dark:bg-slate-950 gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500">
                          {check.controlId}
                        </span>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{check.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{check.evidence}</p>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-1.5">
                        <span className="px-2 py-0.2 rounded bg-gray-150 dark:bg-gray-900 border border-gray-250 dark:border-gray-850">
                          SOC 2: {check.frameworks.soc2}
                        </span>
                        <span className="px-2 py-0.2 rounded bg-gray-150 dark:bg-gray-900 border border-gray-250 dark:border-gray-850">
                          ISO: {check.frameworks.iso27001}
                        </span>
                        <span>Checked: {new Date(check.checkedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div>
                      {check.status === "passed" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                          <Check className="w-3.5 h-3.5" /> compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
                          <X className="w-3.5 h-3.5" /> fail / warning
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {controlTests.length === 0 && (
                  <EmptyStateCard
                    className="border-dashed shadow-none bg-transparent py-4"
                    icon={<Activity className="w-8 h-8 text-gray-400" />}
                    title="No Control Metrics"
                    message="No control test metrics loaded. Click 'Run Test Suite' to execute live environmental diagnostics."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: AI Policy Self-Healing */}
      {activeTab === "self-healing" && (
        <div className="space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800 dark:bg-slate-900 shadow-md">
            <CardHeader className="p-6 border-b border-gray-150 dark:border-gray-800/80 bg-gray-50/50 dark:bg-slate-900">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" /> AI Code-to-Policy "Self-Healing" Sync
              </CardTitle>
              <CardDescription className="text-xs">
                Audits GRC document updates generated dynamically by AI agents in response to codebase scan signals.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-250/50 dark:border-gray-850 dark:bg-slate-950 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-400/20 text-blue-500">
                          {proposal.signalType}
                        </span>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Proposal for: {proposal.documentTitle}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Findings: {proposal.evidence}</p>
                      <div className="text-[10px] text-gray-400 mt-1">Proposed At: {new Date(proposal.createdAt).toLocaleString()}</div>
                    </div>
                    <Button
                      onClick={() => setInspectProposal(proposal)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-3 rounded-lg text-xs"
                    >
                      Audit Proposed Diff
                    </Button>
                  </div>
                ))}
                {proposals.length === 0 && (
                  <EmptyStateCard
                    className="border-dashed shadow-none bg-transparent py-4"
                    icon={<Sparkles className="w-8 h-8 text-blue-400" />}
                    title="Fully Aligned"
                    message="No pending self-healing policy proposals detected. Codebase scans are fully aligned with your compliance docs."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model: Log GRC Threat */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl">
            <CardHeader className="p-6 border-b border-gray-150 dark:border-gray-850 bg-gray-50/50 dark:bg-slate-900 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-500" /> Log GRC Threat Entry
                </CardTitle>
                <CardDescription className="text-xs">
                  Fill in the inherent impact parameters; GRC scoring math is evaluated automatically.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Threat Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unauthenticated access to embedded database files"
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-300 dark:border-gray-850 dark:bg-slate-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Threat Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of compliance vulnerabilities or risks..."
                  className="w-full h-24 p-3.5 text-sm rounded-lg border border-gray-300 dark:border-gray-850 dark:bg-slate-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-855 dark:bg-slate-955 focus:outline-none"
                  >
                    <option value="Security">Security</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Operational">Operational</option>
                    <option value="Financial">Financial</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Mitigating Policy Link</label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !selectedControl.includes(val)) {
                        setSelectedControl([...selectedControl, val]);
                      }
                    }}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-850 dark:bg-slate-950 focus:outline-none"
                  >
                    <option value="">-- Link to Active Policy --</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedControl.length > 0 && (
                <div className="flex flex-wrap gap-1.5 bg-gray-50 dark:bg-gray-950 p-2.5 rounded-lg border border-gray-200/50 dark:border-gray-850">
                  {selectedControl.map((cId) => {
                    const doc = documents.find(d => d.id === cId);
                    return (
                      <span key={cId} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500">
                        {doc ? doc.title : "Linked Policy"}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedControl(selectedControl.filter(id => id !== cId))} />
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Assessment Sliding matrix sliders */}
              <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-200/40 dark:border-gray-800 space-y-4">
                <div className="text-xs font-bold text-gray-600 dark:text-gray-400">Risk Matrix Parameter Settings (Scale 1 to 5)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inherent */}
                  <div className="space-y-4">
                    <div className="text-[11px] font-bold uppercase text-red-500 tracking-wider">Inherent parameters</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Inherent Likelihood</span>
                        <span className="font-bold text-red-500">{inherentLikelihood}</span>
                      </div>
                      <input type="range" min="1" max="5" value={inherentLikelihood} onChange={(e) => setInherentLikelihood(parseInt(e.target.value, 10))} className="w-full accent-red-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Inherent Impact</span>
                        <span className="font-bold text-red-500">{inherentImpact}</span>
                      </div>
                      <input type="range" min="1" max="5" value={inherentImpact} onChange={(e) => setInherentImpact(parseInt(e.target.value, 10))} className="w-full accent-red-500" />
                    </div>
                    <div className="p-2.5 rounded bg-red-500/5 border border-red-500/20 flex justify-between items-center text-xs font-bold">
                      <span>Calculated Inherent Score:</span>
                      <span className="text-red-500 text-sm">{inherentLikelihood * inherentImpact} / 25</span>
                    </div>
                  </div>

                  {/* Residual */}
                  <div className="space-y-4">
                    <div className="text-[11px] font-bold uppercase text-emerald-500 tracking-wider">Residual parameters</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Residual Likelihood</span>
                        <span className="font-bold text-emerald-500">{residualLikelihood}</span>
                      </div>
                      <input type="range" min="1" max="5" value={residualLikelihood} onChange={(e) => setResidualLikelihood(parseInt(e.target.value, 10))} className="w-full accent-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Residual Impact</span>
                        <span className="font-bold text-emerald-500">{residualImpact}</span>
                      </div>
                      <input type="range" min="1" max="5" value={residualImpact} onChange={(e) => setResidualImpact(parseInt(e.target.value, 10))} className="w-full accent-emerald-500" />
                    </div>
                    <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20 flex justify-between items-center text-xs font-bold">
                      <span>Calculated Residual Score:</span>
                      <span className="text-emerald-500 text-sm">{residualLikelihood * residualImpact} / 25</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Treatment Plan</label>
                <input
                  type="text"
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="e.g. Implement client-side local encryption configurations inside package bundles"
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-300 dark:border-gray-850 dark:bg-slate-950 focus:outline-none"
                />
              </div>

              <Button
                onClick={() => createRiskMutation.mutate()}
                disabled={!title.trim() || createRiskMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md rounded-xl mt-4"
              >
                {createRiskMutation.isPending ? "Logging Threat..." : "Commit Threat to GRC Ledger"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: AI Self-Healing Proposal diff auditor */}
      {inspectProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl">
            <CardHeader className="p-6 border-b border-gray-150 dark:border-gray-850 bg-gray-50/50 dark:bg-slate-900 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" /> AI Policy Diff Audit
                </CardTitle>
                <CardDescription className="text-xs">
                  Review side-by-side modifications mapped from codebase scan signals before committing to version history.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setInspectProposal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Diff contents */}
              <div className="space-y-4">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3.5 text-xs text-blue-500">
                  <span className="font-bold">Codebase Event Signal:</span> {inspectProposal.signalType} <ArrowRight className="inline-block w-3.5 h-3.5 mx-1" /> {inspectProposal.evidence}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[40vh] overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                  {/* Left Column: Original */}
                  <div className="p-4 space-y-2 border-r border-gray-150 dark:border-gray-850">
                    <div className="text-xs font-bold text-gray-400 sticky top-0 bg-white dark:bg-slate-900 pb-2">ORIGINAL POLICY CONTENT</div>
                    <pre className="font-mono text-[10px] whitespace-pre-wrap text-gray-600 dark:text-gray-400 leading-relaxed">
                      {inspectProposal.originalContent}
                    </pre>
                  </div>
                  {/* Right Column: Proposed */}
                  <div className="p-4 space-y-2 bg-emerald-500/5">
                    <div className="text-xs font-bold text-emerald-500 sticky top-0 bg-emerald-500/5 pb-2">PROPOSED SELF-HEALING REVISION</div>
                    <pre className="font-mono text-[10px] whitespace-pre-wrap text-emerald-600 dark:text-emerald-300 leading-relaxed">
                      {inspectProposal.proposedContent}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => rejectProposalMutation.mutate(inspectProposal.id)}
                  disabled={rejectProposalMutation.isPending || approveProposalMutation.isPending}
                  className="h-11 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 font-bold text-sm rounded-xl"
                >
                  Reject & Discard Diffs
                </Button>
                <Button
                  onClick={() => approveProposalMutation.mutate(inspectProposal.id)}
                  disabled={rejectProposalMutation.isPending || approveProposalMutation.isPending}
                  className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md rounded-xl"
                >
                  Approve & Commit 1-Click Version
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
