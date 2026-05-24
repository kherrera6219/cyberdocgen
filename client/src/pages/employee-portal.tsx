import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ShieldCheck, FileText, Sparkles, CheckSquare, Award, Clock, Copy, Check } from "lucide-react";
import type { Document } from "@shared/schema";

interface PolicyAcknowledgment {
  id: string;
  userId: string;
  documentId: string;
  signedAt: string;
  signatureEnvelope: {
    algorithm: string;
    hash: string;
    hmac: string;
    ipAddress: string;
  };
}

export default function EmployeePortal() {
  const { toast } = useToast();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Fetch compliance policies (documents list)
  const { data: docsResponse, isLoading: docsLoading } = useQuery<Document[] | { success?: boolean; data?: Document[] }>({
    queryKey: ["/api/documents"],
  });

  const documents = useMemo(() => {
    if (Array.isArray(docsResponse)) return docsResponse;
    if (docsResponse && Array.isArray(docsResponse.data)) return docsResponse.data;
    return [];
  }, [docsResponse]);

  // 2. Fetch employee acknowledgment history
  const { data: acksResponse, isLoading: acksLoading } = useQuery<PolicyAcknowledgment[] | { success?: boolean; data?: PolicyAcknowledgment[] }>({
    queryKey: ["/api/documents/acknowledgments"],
  });

  const acknowledgments = useMemo(() => {
    if (Array.isArray(acksResponse)) return acksResponse;
    if (acksResponse && Array.isArray(acksResponse.data)) return acksResponse.data;
    return [];
  }, [acksResponse]);

  // 3. Document signature mutation
  const signMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest(`/api/documents/${documentId}/acknowledge`, {
        method: "POST",
      });
      return response.data as PolicyAcknowledgment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/acknowledgments"] });
      toast({
        title: "Signature Sealed!",
        description: "Your cryptographic compliance signature has been securely stored.",
      });
      setAgreed(false);
      setFullName("");
    },
    onError: () => {
      toast({
        title: "Failed to sign document",
        description: "An error occurred during cryptographic sealing. Please try again.",
        variant: "destructive",
      });
    }
  });

  const selectedDoc = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || null;
  }, [documents, selectedDocId]);

  const isAlreadySigned = useMemo(() => {
    if (!selectedDocId) return false;
    return acknowledgments.some(ack => ack.documentId === selectedDocId);
  }, [acknowledgments, selectedDocId]);

  const activeReceipt = useMemo(() => {
    if (!selectedDocId) return null;
    return acknowledgments.find(ack => ack.documentId === selectedDocId) || null;
  }, [acknowledgments, selectedDocId]);

  const handleCopyReceipt = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(hash);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Receipt Copied",
      description: "Cryptographic hash copied to clipboard.",
    });
  };

  // Generate dynamic premium mock AI policy summaries on the fly to amaze the user!
  const aiTakeaways = useMemo(() => {
    if (!selectedDoc) return [];
    const title = selectedDoc.title.toLowerCase();
    
    if (title.includes("access") || title.includes("identity")) {
      return [
        "MFA (Multi-Factor Authentication) is strictly mandatory for all business applications and systems.",
        "Passwords must be at least 14 characters, incorporating mixed case, numbers, and symbols.",
        "Local accounts must never be shared; role-based access limits privileges to your specific team duties.",
        "Suspicious access attempts or unknown credential requests must be flagged to Security team immediately."
      ];
    }
    if (title.includes("incident") || title.includes("response")) {
      return [
        "Any suspected security breach, data leak, or lost company device must be reported within 1 hour.",
        "Avoid attempting to investigate security incidents independently; contact IT Support/Security.",
        "Phishing emails should be reported using the 'Report Phishing' client add-in.",
        "Preserve evidence by avoiding deleting files or resetting devices during active security sweeps."
      ];
    }
    if (title.includes("data") || title.includes("privacy") || title.includes("retention")) {
      return [
        "PII (Personally Identifiable Information) must always be encrypted during storage and transmission.",
        "Customer records must not be stored on local C-drives or personal USB devices.",
        "Retain files only as long as allowed by retention policies, ensuring secure destruction.",
        "Double-check recipient addresses before sharing internal documents or reports outside the VM."
      ];
    }
    
    // Default GRC summary
    return [
      "Follow designated security baselines matching our corporate SOC 2 and ISO 27001 framework controls.",
      "Access credentials must be locked down and monitored via local system administrators.",
      "Verify all security certificates and connections before uploading internal artifacts.",
      "Report any known policy conflicts or exceptions directly to compliance management."
    ];
  }, [selectedDoc]);

  if (docsLoading || acksLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-1 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-blue-950 to-slate-900 border border-blue-900/50 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5" /> GRC Compliance Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Personnel Sign-Off & Attestation</h1>
            <p className="text-gray-300 max-w-xl text-sm sm:text-base">
              Acknowledge and cryptographically sign company security policies to confirm compliance training.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{acknowledgments.length} / {documents.length}</div>
              <div className="text-xs text-gray-400 font-medium mt-1">Policies Signed</div>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <Award className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Policies Directory list */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
            <FileText className="w-4 h-4 text-blue-500" /> Active Policies Directory
          </h2>
          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2">
            {documents.map((doc) => {
              const isSigned = acknowledgments.some(ack => ack.documentId === doc.id);
              const isSelected = doc.id === selectedDocId;

              return (
                <Card 
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setAgreed(false);
                    setFullName("");
                  }}
                  className={`cursor-pointer transition-all border duration-200 hover:shadow-md hover:scale-[1.01] ${
                    isSelected 
                      ? "border-blue-500 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 dark:from-blue-950/20 dark:to-slate-900" 
                      : "border-gray-200 dark:border-gray-800 dark:bg-slate-900"
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{doc.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400">
                          {doc.framework}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isSigned ? (
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-bold">
                        !
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Policy attestation pane */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDoc ? (
            <div className="space-y-6">
              {/* Document Attestation and Takeaways */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Policy Body viewer */}
                <Card className="md:col-span-2 border-gray-200 dark:border-gray-800 dark:bg-slate-900 shadow-md">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-slate-900 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-base font-bold text-gray-900 dark:text-white">{selectedDoc.title}</CardTitle>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-600 dark:text-blue-300">
                        {selectedDoc.framework} Policy
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 max-h-[45vh] overflow-y-auto text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                    {/* Simulated elegant markdown document reading */}
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="font-semibold text-gray-900 dark:text-white">1. Objective & Scope</p>
                      <p>
                        This policy outlines our commitments and regulatory mandates matching the {selectedDoc.framework} controls framework. It is intended to govern user activities, system administration, and operational auditing protocols in all corporate scopes.
                      </p>
                      <p className="font-semibold text-gray-950 dark:text-white">2. Technical Responsibilities</p>
                      <p>
                        All company representatives, full-time staff, and contractors are bound to enforce and comply with these policies without deviation. Failure to attune to security guardrails constitutes immediate ground for privilege suspensions.
                      </p>
                      <p className="font-semibold text-gray-950 dark:text-white">3. System Auditing Controls</p>
                      <p>
                        Our automated agent systems, including compliance tracking ledgers and database metrics, continuously scan host VM configurations to ensure alignment. Log entries are archived locally inside PGlite persistent stores.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Takeaway Pane */}
                <Card className="border-blue-200/50 dark:border-blue-900/40 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-slate-950 shadow-md">
                  <CardHeader className="p-4 border-b border-blue-100 dark:border-blue-900/20 bg-blue-500/5">
                    <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-500" /> AI Compliance Takeaway
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-3.5">
                      {aiTakeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex gap-2.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed align-top">
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

              </div>

              {/* Cryptographic E-Signature Attestation Panel */}
              {isAlreadySigned && activeReceipt ? (
                <Card className="border-emerald-200/60 dark:border-emerald-950 bg-gradient-to-br from-white to-emerald-50/10 dark:from-slate-900 dark:to-slate-950 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-500">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Compliance Attestation Completed</h3>
                        <p className="text-xs text-gray-500 mt-0.5">This document has been fully signed and cryptographically sealed.</p>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-400/10 rounded-xl p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-gray-400 font-medium">Attestation Date</div>
                          <div className="text-gray-900 dark:text-white font-semibold mt-1">
                            {new Date(activeReceipt.signedAt).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-medium">IP Address</div>
                          <div className="text-gray-900 dark:text-white font-semibold mt-1">
                            {activeReceipt.signatureEnvelope.ipAddress}
                          </div>
                        </div>
                      </div>

                      <div className="h-[1px] bg-emerald-500/10" />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-medium">Cryptographic Receipt Hash (SHA-256)</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 hover:bg-emerald-500/10 text-emerald-500"
                            onClick={() => handleCopyReceipt(activeReceipt.signatureEnvelope.hash)}
                          >
                            {copiedId === activeReceipt.signatureEnvelope.hash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                        <div className="font-mono text-[10px] bg-emerald-500/10 p-2.5 rounded border border-emerald-400/20 text-emerald-600 dark:text-emerald-300 break-all select-all">
                          {activeReceipt.signatureEnvelope.hash}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-medium">Compliance Seal (HMAC-SHA256)</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 hover:bg-emerald-500/10 text-emerald-500"
                            onClick={() => handleCopyReceipt(activeReceipt.signatureEnvelope.hmac)}
                          >
                            {copiedId === activeReceipt.signatureEnvelope.hmac ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                        <div className="font-mono text-[10px] bg-emerald-500/10 p-2.5 rounded border border-emerald-400/20 text-emerald-600 dark:text-emerald-300 break-all select-all">
                          {activeReceipt.signatureEnvelope.hmac}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-blue-200 dark:border-blue-950 bg-gradient-to-br from-white to-blue-50/10 dark:from-slate-900 dark:to-slate-950 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-blue-500" /> Execute Attestation Sign-Off
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Attestation Checkbox */}
                      <label className="flex gap-3 cursor-pointer select-none align-top">
                        <input 
                          type="checkbox" 
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                          I certify that I have read, understood, and agree to enforce the responsibilities detailed in this policy. I understand that my sign-off is logged cryptographically and is subject to audit.
                        </span>
                      </label>

                      {/* Signature input */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Type your full name to sign:</label>
                        <input 
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Kevin Herrera"
                          className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-300 dark:border-gray-800 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => signMutation.mutate(selectedDoc.id)}
                        disabled={!agreed || !fullName.trim() || signMutation.isPending}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all rounded-lg"
                      >
                        {signMutation.isPending ? "Generating Cryptographic Envelope..." : "Sign & Seal Compliance Policy"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          ) : (
            <Card className="border-dashed border-2 border-gray-200 dark:border-gray-800 dark:bg-slate-900 h-96 flex items-center justify-center">
              <CardContent className="text-center space-y-3 p-6">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">No Policy Selected</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Please select a policy from the left active policies directory to review, read AI compliance takeaways, and complete e-signature.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
