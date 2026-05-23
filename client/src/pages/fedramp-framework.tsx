import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrameworkSpreadsheet } from "@/components/compliance/FrameworkSpreadsheet";
import { 
  Shield,
  Search,
  FileText,
  AlertCircle,
  Download,
  Users,
  Lock,
  ChevronRight,
  Filter,
  FileCheck,
  Calendar,
  Server,
  Eye,
  Key,
  AlertTriangle,
  Wrench,
  HardDrive,
  MapPin,
  ClipboardList,
  Briefcase,
  UserCheck,
  Target,
  ShoppingCart,
  Wifi,
  Bug,
  Link,
  Unlink,
  Paperclip,
  Plus,
  Table as TableIcon
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CompanyProfile } from "@shared/schema";

import {
  EvidenceFile,
  ControlStatus,
  EvidenceStatus,
  Baseline,
  Control,
  ControlFamily,
  initialControlFamilies
} from "@/data/frameworks/fedramp";

export default function FedRAMPFramework() {
  const { toast } = useToast();
  const [controlFamilies, setControlFamilies] = useState<ControlFamily[]>(initialControlFamilies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [baselineFilter, setBaselineFilter] = useState<string>("all");
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("controls");
  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [selectedControlForEvidence, setSelectedControlForEvidence] = useState<Control | null>(null);

  const { data: companyProfiles } = useQuery<CompanyProfile[]>({
    queryKey: ['/api/company-profiles'],
  });

  // Fetch all evidence for the FedRAMP framework
  const { data: evidenceData } = useQuery<{ evidence: EvidenceFile[]; count: number }>({
    queryKey: ['/api/evidence/fedramp'],
    queryFn: async () => {
      const response = await fetch('/api/evidence?framework=fedramp', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch evidence');
      return response.json();
    },
  });

  // Get evidence files linked to a specific control
  const getControlEvidence = (controlId: string): EvidenceFile[] => {
    if (!evidenceData?.evidence) return [];
    return evidenceData.evidence.filter(file => 
      file.metadata?.tags?.includes(`control:${controlId}`)
    );
  };

  // Get available evidence not yet linked to the selected control
  const getAvailableEvidence = (): EvidenceFile[] => {
    if (!evidenceData?.evidence || !selectedControlForEvidence) return [];
    return evidenceData.evidence.filter(file => 
      !file.metadata?.tags?.includes(`control:${selectedControlForEvidence.id}`)
    );
  };

  // Mutation for linking evidence to controls
  const linkEvidenceMutation = useMutation({
    mutationFn: async ({ evidenceId, controlId, action }: { 
      evidenceId: string; 
      controlId: string; 
      action: 'add' | 'remove';
    }) => {
      return await apiRequest(`/api/evidence/${evidenceId}/controls`, {
        method: 'POST',
        body: JSON.stringify({ 
          controlIds: [controlId], 
          framework: 'fedramp',
          action 
        }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/fedramp'] });
      toast({
        title: variables.action === 'add' ? "Evidence Linked" : "Evidence Unlinked",
        description: `Evidence has been ${variables.action === 'add' ? 'linked to' : 'removed from'} the control`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update evidence",
        description: error.message || "Could not update evidence linking",
        variant: "destructive",
      });
    }
  });

  const allControls = useMemo(() => {
    return controlFamilies.flatMap(family => 
      family.controls.map(control => ({ ...control, familyId: family.id, familyName: family.name }))
    );
  }, [controlFamilies]);

  const filteredControls = useMemo(() => {
    return allControls.filter(control => {
      const matchesSearch = searchTerm === "" || 
        control.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || control.status === statusFilter;
      const matchesFamily = familyFilter === "all" || control.familyId === familyFilter;
      const matchesBaseline = baselineFilter === "all" || control.baseline === baselineFilter;
      
      return matchesSearch && matchesStatus && matchesFamily && matchesBaseline;
    });
  }, [allControls, searchTerm, statusFilter, familyFilter, baselineFilter]);

  const stats = useMemo(() => {
    const total = allControls.length;
    const implemented = allControls.filter(c => c.status === "implemented").length;
    const inProgress = allControls.filter(c => c.status === "in_progress").length;
    const notStarted = allControls.filter(c => c.status === "not_started").length;
    const notApplicable = allControls.filter(c => c.status === "not_applicable").length;
    const applicableTotal = total - notApplicable;
    const score = applicableTotal > 0 ? Math.round((implemented / applicableTotal) * 100) : 0;
    
    const lowBaseline = allControls.filter(c => c.baseline === "low").length;
    const moderateBaseline = allControls.filter(c => c.baseline === "moderate").length;
    const highBaseline = allControls.filter(c => c.baseline === "high").length;
    
    return { total, implemented, inProgress, notStarted, notApplicable, score, lowBaseline, moderateBaseline, highBaseline };
  }, [allControls]);

  const updateControlStatus = (controlId: string, newStatus: ControlStatus) => {
    setControlFamilies(families => 
      families.map(family => ({
        ...family,
        controls: family.controls.map(control => 
          control.id === controlId 
            ? { ...control, status: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
    toast({
      title: "Control Updated",
      description: `${controlId} status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const updateEvidenceStatus = (controlId: string, newStatus: EvidenceStatus) => {
    setControlFamilies(families => 
      families.map(family => ({
        ...family,
        controls: family.controls.map(control => 
          control.id === controlId 
            ? { ...control, evidenceStatus: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
  };

  const handleGenerateDocument = (controlId: string, controlName: string) => {
    toast({
      title: "Generating Document",
      description: `Creating documentation for ${controlId}: ${controlName}`,
    });
  };

  const handleGenerateAllDocuments = () => {
    toast({
      title: "Generating All Documents",
      description: `Creating documentation for all ${stats.total} FedRAMP controls`,
    });
  };



  const getBaselineBadge = (baseline: Baseline) => {
    switch (baseline) {
      case "low":
        return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">Low</Badge>;
      case "moderate":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Moderate</Badge>;
      case "high":
        return <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">High</Badge>;
    }
  };



  const getFamilyStats = (family: ControlFamily) => {
    const total = family.controls.length;
    const implemented = family.controls.filter(c => c.status === "implemented").length;
    const inProgress = family.controls.filter(c => c.status === "in_progress").length;
    return { total, implemented, inProgress };
  };

  const filteredFamilies = useMemo(() => {
    if (familyFilter !== "all") {
      return controlFamilies.filter(f => f.id === familyFilter);
    }
    return controlFamilies;
  }, [controlFamilies, familyFilter]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">
              FedRAMP - Federal Risk and Authorization Management Program
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              NIST 800-53 based security controls for federal cloud services
            </p>
          </div>
        </div>
        <Button 
          onClick={handleGenerateAllDocuments}
          data-testid="button-generate-all-documents"
        >
          <Download className="h-4 w-4 mr-2" />
          Generate All Documents
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList data-testid="tabs-framework-sections">
            <TabsTrigger value="controls" data-testid="tab-controls">
              <Shield className="h-4 w-4 mr-2" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <TableIcon className="h-4 w-4 mr-2" />
              Template Data
            </TabsTrigger>
          </TabsList>

          {activeTab === "templates" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Company Profile:</span>
              <Select 
                value={selectedCompanyProfileId || ""} 
                onValueChange={(v) => setSelectedCompanyProfileId(v || null)}
              >
                <SelectTrigger className="w-[200px]" data-testid="select-company-profile">
                  <SelectValue placeholder="Select profile..." />
                </SelectTrigger>
                <SelectContent>
                  {companyProfiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="templates" className="space-y-4">
          <FrameworkSpreadsheet 
            framework="FedRAMP" 
            companyProfileId={selectedCompanyProfileId} 
          />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                Overall Compliance Progress
              </CardTitle>
              <CardDescription>
                Track your organization's FedRAMP implementation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Compliance Score</span>
                  <span className="text-2xl font-bold" data-testid="text-compliance-score">{stats.score}%</span>
                </div>
                <Progress value={stats.score} className="h-3" data-testid="progress-compliance" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-stat-implemented">
                  {stats.implemented}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Implemented</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-stat-in-progress">
                  {stats.inProgress}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">In Progress</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-400" data-testid="text-stat-not-started">
                  {stats.notStarted}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Not Started</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-stat-total">
                  {stats.total}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-500">Total Controls</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="text-baseline-low">
                  {stats.lowBaseline}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Low Baseline</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-baseline-moderate">
                  {stats.moderateBaseline}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">Moderate Baseline</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-xl font-bold text-red-700 dark:text-red-400" data-testid="text-baseline-high">
                  {stats.highBaseline}
                </div>
                <div className="text-xs text-red-600 dark:text-red-500">High Baseline</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search controls by ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-controls"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="not_applicable">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger data-testid="select-family-filter">
                <SelectValue placeholder="Filter by family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {controlFamilies.map(family => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.id} - {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={baselineFilter} onValueChange={setBaselineFilter}>
              <SelectTrigger data-testid="select-baseline-filter">
                <SelectValue placeholder="Filter by baseline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Baselines</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || familyFilter !== "all" || baselineFilter !== "all") && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredControls.length} of {stats.total} controls
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion 
        type="multiple" 
        value={expandedFamilies} 
        onValueChange={setExpandedFamilies}
        className="space-y-4"
      >
        {filteredFamilies.map(family => {
          const familyStats = getFamilyStats(family);
          const FamilyIcon = family.icon;
          const familyControls = (searchTerm || statusFilter !== "all" || baselineFilter !== "all")
            ? family.controls.filter(c => {
                const matchesSearch = searchTerm === "" || 
                  c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === "all" || c.status === statusFilter;
                const matchesBaseline = baselineFilter === "all" || c.baseline === baselineFilter;
                return matchesSearch && matchesStatus && matchesBaseline;
              })
            : family.controls;

          if (familyControls.length === 0) return null;

          return (
            <AccordionItem 
              key={family.id} 
              value={family.id}
              className="border rounded-lg"
              data-testid={`accordion-family-${family.id}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <FamilyIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{family.id} - {family.name}</div>
                      <div className="text-sm text-muted-foreground">{family.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="outline">{familyControls.length} controls</Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {familyStats.implemented} done
                      </Badge>
                    </div>
                    <Progress 
                      value={(familyStats.implemented / familyStats.total) * 100} 
                      className="w-20 h-2 hidden sm:block"
                    />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 mt-2">
                  {familyControls.map(control => (
                    <Card key={control.id} className="border" data-testid={`card-control-${control.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-2 mb-2">
                              <Badge variant="secondary" className="shrink-0">{control.id}</Badge>
                              {getBaselineBadge(control.baseline)}
                              <h4 className="font-medium text-sm">{control.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {control.description}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-3">
                            <Select 
                              value={control.status} 
                              onValueChange={(value) => updateControlStatus(control.id, value as ControlStatus)}
                            >
                              <SelectTrigger 
                                className="w-full sm:w-[160px]"
                                data-testid={`select-status-${control.id}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="implemented">Implemented</SelectItem>
                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select 
                              value={control.evidenceStatus} 
                              onValueChange={(value) => updateEvidenceStatus(control.id, value as EvidenceStatus)}
                            >
                              <SelectTrigger 
                                className="w-full sm:w-[140px]"
                                data-testid={`select-evidence-${control.id}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Evidence</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateDocument(control.id, control.name)}
                              data-testid={`button-generate-${control.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Generate Doc</span>
                              <span className="sm:hidden">Generate</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedControlForEvidence(control);
                                setEvidenceDialogOpen(true);
                              }}
                              data-testid={`button-evidence-${control.id}`}
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Evidence
                              {getControlEvidence(control.id).length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  {getControlEvidence(control.id).length}
                                </Badge>
                              )}
                            </Button>
                          </div>
                        </div>

                        {control.lastUpdated && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Last updated: {new Date(control.lastUpdated).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {filteredControls.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Controls Found</h3>
            <p className="text-muted-foreground text-sm">
              No controls match your current filter criteria. Try adjusting your search or filters.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setFamilyFilter("all");
                setBaselineFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>

      {/* Evidence Linking Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Manage Evidence for {selectedControlForEvidence?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedControlForEvidence?.name} - Link or unlink evidence files to this control
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Linked Evidence */}
            <div>
              <h4 className="text-sm font-medium mb-3">Linked Evidence</h4>
              {selectedControlForEvidence && getControlEvidence(selectedControlForEvidence.id).length > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {getControlEvidence(selectedControlForEvidence.id).map(evidence => (
                      <div 
                        key={evidence.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{evidence.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(evidence.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedControlForEvidence) {
                              linkEvidenceMutation.mutate({
                                evidenceId: evidence.id,
                                controlId: selectedControlForEvidence.id,
                                action: 'remove'
                              });
                            }
                          }}
                          disabled={linkEvidenceMutation.isPending}
                          data-testid={`button-unlink-${evidence.id}`}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No evidence linked to this control</p>
                </div>
              )}
            </div>

            {/* Available Evidence to Link */}
            <div>
              <h4 className="text-sm font-medium mb-3">Available Evidence to Link</h4>
              {getAvailableEvidence().length > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {getAvailableEvidence().map(evidence => (
                      <div 
                        key={evidence.id}
                        className="flex items-center justify-between p-3 border rounded-md hover-elevate cursor-pointer"
                        onClick={() => {
                          if (selectedControlForEvidence) {
                            linkEvidenceMutation.mutate({
                              evidenceId: evidence.id,
                              controlId: selectedControlForEvidence.id,
                              action: 'add'
                            });
                          }
                        }}
                        data-testid={`button-link-${evidence.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{evidence.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(evidence.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={linkEvidenceMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No additional evidence available to link</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
