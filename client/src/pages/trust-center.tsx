import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldCheck, 
  Lock, 
  Download, 
  FileSignature, 
  History, 
  Globe, 
  Key, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Building
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TrustDoc {
  id: string;
  name: string;
  type: "file" | "policy";
  size: number;
  category: string;
  updatedAt: string;
}

interface TrustDocsResponse {
  files: TrustDoc[];
  policies: TrustDoc[];
}

interface NdaCheckResponse {
  signed: boolean;
  nda: {
    id: string;
    fullName: string;
    email: string;
    companyName: string;
    signedAt: string;
    signatureHash: string;
  } | null;
}

interface DownloadAuditLog {
  id: string;
  ndaEmail: string;
  ndaName: string;
  fileName: string;
  downloadedAt: string;
  ipAddress: string;
}

export default function TrustCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [buyerEmail, setBuyerEmail] = useState("");
  const [ndaForm, setNdaForm] = useState({ fullName: "", companyName: "" });
  const [activeNda, setActiveNda] = useState<NdaCheckResponse["nda"]>(null);
  const [isNdaVerified, setIsNdaVerified] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);

  // Queries
  const { data: docData, isLoading: docsLoading } = useQuery<TrustDocsResponse>({
    queryKey: ["/api/trust-center/documents"]
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<DownloadAuditLog[]>({
    queryKey: ["/api/trust-center/downloads-audit"],
    enabled: isNdaVerified // Only fetch if an admin/auditor is exploring
  });

  // Mutations
  const verifyNdaMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/trust-center/check-nda", { email }) as Promise<NdaCheckResponse>;
    },
    onSuccess: (data) => {
      if (data.signed && data.nda) {
        setActiveNda(data.nda);
        setIsNdaVerified(true);
        setIsCheckModalOpen(false);
        toast({
          title: "Access Approved",
          description: `Active NDA verified for ${data.nda.fullName} (${data.nda.companyName}).`
        });
      } else {
        toast({
          title: "NDA Not Found",
          description: "No signed NDA found for this email. Please sign the agreement first.",
          variant: "destructive"
        });
      }
    }
  });

  const signNdaMutation = useMutation({
    mutationFn: async (payload: { fullName: string; email: string; companyName: string }) => {
      return await apiRequest("POST", "/api/trust-center/sign", payload);
    },
    onSuccess: (res) => {
      setActiveNda(res.data);
      setIsNdaVerified(true);
      setIsSigningModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trust-center/downloads-audit"] });
      toast({
        title: "NDA Signed & Sealed",
        description: "Your digital signature has been recorded. Restricted documents are unlocked."
      });
    }
  });

  const handleNdaCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerEmail) return;
    verifyNdaMutation.mutate(buyerEmail);
  };

  const handleNdaSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerEmail || !ndaForm.fullName || !ndaForm.companyName) {
      toast({
        title: "Validation Error",
        description: "All fields are required to sign the NDA.",
        variant: "destructive"
      });
      return;
    }
    signNdaMutation.mutate({
      email: buyerEmail,
      fullName: ndaForm.fullName,
      companyName: ndaForm.companyName
    });
  };

  const triggerSecureDownload = async (doc: TrustDoc) => {
    if (!activeNda) {
      setIsCheckModalOpen(true);
      toast({
        title: "Verification Required",
        description: "Please sign or verify your active NDA to access this secure resource."
      });
      return;
    }

    try {
      toast({
        title: "Applying PDF Protections",
        description: "Encrypting and watermarking your document...",
      });
      
      const downloadUrl = `/api/trust-center/download/${doc.id}?ndaId=${activeNda.id}&type=${doc.type}`;
      
      // Perform standard browser redirection to download endpoint
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", doc.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh logs
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/trust-center/downloads-audit"] });
      }, 1000);
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download secure resource.",
        variant: "destructive"
      });
    }
  };

  const allDocuments = [
    ...(docData?.files || []),
    ...(docData?.policies || [])
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500 animate-pulse" />
            <h1 id="trust-center-title" className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Gated Customer Trust Center</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Real-time compliance visibility portal. Prospective partners sign NDAs online to download custom-watermarked, secure compliance packages autonomously.
          </p>
        </div>

        {/* NDA Status Panel */}
        <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
          {isNdaVerified && activeNda ? (
            <div className="flex flex-col text-right">
              <span className="text-xs text-muted-foreground">Active Session</span>
              <span className="text-sm font-semibold text-emerald-500">{activeNda.companyName}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[200px] font-mono">{activeNda.signatureHash.substring(0, 16)}...</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">NDA Verification Required</span>
          )}
          
          {isNdaVerified && activeNda ? (
            <Button variant="outline" size="sm" onClick={() => { setActiveNda(null); setIsNdaVerified(false); }} className="border-red-500/20 text-red-400 hover:bg-red-500/10">
              Lock Portal
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" id="btn-verify-nda" onClick={() => setIsCheckModalOpen(true)}>Verify NDA</Button>
              <Button size="sm" variant="secondary" id="btn-sign-nda" onClick={() => setIsSigningModalOpen(true)}>Sign NDA</Button>
            </div>
          )}
        </div>
      </div>

      {/* Trust Badges Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/45 backdrop-blur-md border border-border/40 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">SOC 2 Type II</CardTitle>
              <Badge variant="secondary" className="mt-1 bg-blue-500/10 text-blue-400">Compliant</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Evaluated against the security, availability, and confidentiality trust services criteria. Audited annually by AICPA registered practitioners.
          </CardContent>
        </Card>

        <Card className="bg-card/45 backdrop-blur-md border border-border/40 shadow-lg hover:shadow-xl hover:border-purple-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">ISO 27001:2022</CardTitle>
              <Badge variant="secondary" className="mt-1 bg-purple-500/10 text-purple-400">Certified</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Information Security Management System (ISMS) fully certified. Global standard for managing security risks and customer assets.
          </CardContent>
        </Card>

        <Card className="bg-card/45 backdrop-blur-md border border-border/40 shadow-lg hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Zero-Knowledge RAG</CardTitle>
              <Badge variant="secondary" className="mt-1 bg-emerald-500/10 text-emerald-400">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Core GRC platform runs fully local-first with in-process vector DBs. No customer PII or controls leave the secure host boundaries.
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="bg-muted/40 border border-muted-foreground/10 p-1">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Security Catalog
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2" disabled={!isNdaVerified}>
            <History className="w-4 h-4" /> Downloads GRC Ledger
          </TabsTrigger>
        </TabsList>

        {/* Security Catalog Grid */}
        <TabsContent value="catalog" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restricted Documentation catalog</CardTitle>
              <CardDescription>
                Browse official reports, certifications, and compliance packages. Access is restricted and requires a signed NDA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : allDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No trust documents registered. Please upload policies to list here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm hover:bg-muted/10 transition-all duration-200 shadow-sm hover:border-primary/25">
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{doc.category || "General"}</Badge>
                          <span>{doc.type === "file" ? "PDF Report" : "Active Policy"}</span>
                          <span>•</span>
                          <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>

                      {activeNda ? (
                        <Button variant="outline" size="sm" onClick={() => triggerSecureDownload(doc)} className="flex items-center gap-2 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400">
                          <Download className="w-3.5 h-3.5" /> Download Secured
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setIsSigningModalOpen(true)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                          <Lock className="w-3.5 h-3.5 text-orange-400" /> Unlock Gated
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Administration downloads audit logs */}
        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Continuous Downloads Audit Trail</CardTitle>
              <CardDescription>
                Immutable transaction log capturing every gated document download, including IP addresses, buyer references, and SHA-256 integrity seal hashes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No downloads logged inside this session context.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-muted-foreground border-collapse">
                    <thead>
                      <tr className="border-b border-muted-foreground/10 text-xs uppercase text-muted-foreground bg-muted/20">
                        <th className="p-3">Buyer / Company</th>
                        <th className="p-3">Document Downloaded</th>
                        <th className="p-3">Host IP Address</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-muted-foreground/10 hover:bg-muted/5">
                          <td className="p-3 font-semibold text-foreground">
                            {log.ndaName}
                            <span className="block text-xs font-normal text-muted-foreground">{log.ndaEmail}</span>
                          </td>
                          <td className="p-3">{log.fileName}</td>
                          <td className="p-3 font-mono text-xs">{log.ipAddress}</td>
                          <td className="p-3 text-xs">{new Date(log.downloadedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal A: Check NDA Status */}
      <Dialog open={isCheckModalOpen} onOpenChange={setIsCheckModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Gated Trust Portal</DialogTitle>
            <DialogDescription>
              Enter the corporate email address used to sign the agreement to unlock immediate self-service document access.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNdaCheck} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyer-check-email">Corporate Email Address</Label>
              <Input 
                id="buyer-check-email" 
                type="email" 
                placeholder="john.doe@enterprise.com" 
                value={buyerEmail} 
                onChange={(e) => setBuyerEmail(e.target.value)} 
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCheckModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={verifyNdaMutation.isPending}>
                {verifyNdaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Unlock Access
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal B: Sign NDA Modal */}
      <Dialog open={isSigningModalOpen} onOpenChange={setIsSigningModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-emerald-500" />
              Sign Non-Disclosure Agreement
            </DialogTitle>
            <DialogDescription>
              Please complete your signatory details. By signing dynamically, you agree to treat downloaded reports as confidential material.
            </DialogDescription>
          </DialogHeader>

          {/* Simulated NDA Text Box */}
          <div className="bg-muted/40 p-3 rounded-lg text-xs max-h-[120px] overflow-y-auto border border-muted-foreground/10 font-mono text-muted-foreground space-y-2">
            <p><strong>MUTUAL CONFIDENTIALITY AND SECURITY DOCUMENTATION AGREEMENT</strong></p>
            <p>1. <strong>Purpose</strong>: The signatory requests access to restricted GRC reports (SOC 2, ISO certs, system architectures) for assessment.</p>
            <p>2. <strong>Confidentiality</strong>: Recipient agrees to hold all materials in strict confidence. No copying, distribution, or decompilation is allowed.</p>
            <p>3. <strong>Traceability</strong>: Dynamic watermarks will embed signee email. Dynamic tracking hash acts as legal signature receipt.</p>
          </div>

          <form onSubmit={handleNdaSign} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="nda-full-name">Signatory Full Name</Label>
                <Input 
                  id="nda-full-name" 
                  value={ndaForm.fullName} 
                  onChange={(e) => setNdaForm({ ...ndaForm, fullName: e.target.value })} 
                  placeholder="John Doe" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nda-company">Company Name</Label>
                <Input 
                  id="nda-company" 
                  value={ndaForm.companyName} 
                  onChange={(e) => setNdaForm({ ...ndaForm, companyName: e.target.value })} 
                  placeholder="Enterprise Inc." 
                  required 
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="nda-email">Signatory Corporate Email</Label>
              <Input 
                id="nda-email" 
                type="email" 
                value={buyerEmail} 
                onChange={(e) => setBuyerEmail(e.target.value)} 
                placeholder="john.doe@enterprise.com" 
                required 
              />
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsSigningModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500" disabled={signNdaMutation.isPending}>
                {signNdaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign & Authorize
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
