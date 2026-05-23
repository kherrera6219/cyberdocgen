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
import { 
  Shield,
  Search,
  Activity,
  FileText,
  AlertCircle,
  Download,
  Eye,
  ShieldCheck,
  Zap,
  RotateCcw,
  ChevronRight,
  Filter,
  FileCheck,
  Calendar,
  Target,
  Unlink,
  Paperclip,
  Plus,
  Table as TableIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrameworkSpreadsheet } from "@/components/compliance/FrameworkSpreadsheet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CompanyProfile } from "@shared/schema";

import {
  EvidenceFile,
  SubcategoryStatus,
  EvidenceStatus,
  ImplementationTier,
  Subcategory,
  Category,
  NISTFunction,
  initialNISTFunctions
} from "@/data/frameworks/nist";

export default function NISTFramework() {
  const { toast } = useToast();
  const [nistFunctions, setNistFunctions] = useState<NISTFunction[]>(initialNISTFunctions);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [functionFilter, setFunctionFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [expandedFunctions, setExpandedFunctions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("controls");
  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [selectedControlForEvidence, setSelectedControlForEvidence] = useState<Subcategory | null>(null);

  const { data: companyProfiles } = useQuery<CompanyProfile[]>({
    queryKey: ['/api/company-profiles'],
  });

  // Fetch all evidence for the NIST framework
  const { data: evidenceData } = useQuery<{ evidence: EvidenceFile[]; count: number }>({
    queryKey: ['/api/evidence/nist'],
    queryFn: async () => {
      const response = await fetch('/api/evidence?framework=nist', {
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
          framework: 'nist',
          action 
        }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/nist'] });
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

  const allSubcategories = useMemo(() => {
    return nistFunctions.flatMap(func => 
      func.categories.flatMap(cat =>
        cat.subcategories.map(sub => ({ 
          ...sub, 
          functionId: func.id, 
          functionName: func.name,
          categoryId: cat.id,
          categoryName: cat.name
        }))
      )
    );
  }, [nistFunctions]);

  const filteredSubcategories = useMemo(() => {
    return allSubcategories.filter(sub => {
      const matchesSearch = searchTerm === "" || 
        sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      const matchesFunction = functionFilter === "all" || sub.functionId === functionFilter;
      const matchesTier = tierFilter === "all" || sub.implementationTier === tierFilter;
      
      return matchesSearch && matchesStatus && matchesFunction && matchesTier;
    });
  }, [allSubcategories, searchTerm, statusFilter, functionFilter, tierFilter]);

  const stats = useMemo(() => {
    const total = allSubcategories.length;
    const implemented = allSubcategories.filter(s => s.status === "implemented").length;
    const inProgress = allSubcategories.filter(s => s.status === "in_progress").length;
    const notStarted = allSubcategories.filter(s => s.status === "not_started").length;
    const notApplicable = allSubcategories.filter(s => s.status === "not_applicable").length;
    const applicableTotal = total - notApplicable;
    const score = applicableTotal > 0 ? Math.round((implemented / applicableTotal) * 100) : 0;
    
    return { total, implemented, inProgress, notStarted, notApplicable, score };
  }, [allSubcategories]);

  const updateSubcategoryStatus = (subcategoryId: string, newStatus: SubcategoryStatus) => {
    setNistFunctions(funcs => 
      funcs.map(func => ({
        ...func,
        categories: func.categories.map(cat => ({
          ...cat,
          subcategories: cat.subcategories.map(sub => 
            sub.id === subcategoryId 
              ? { ...sub, status: newStatus, lastUpdated: new Date().toISOString() }
              : sub
          )
        }))
      }))
    );
    toast({
      title: "Subcategory Updated",
      description: `${subcategoryId} status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const updateEvidenceStatus = (subcategoryId: string, newStatus: EvidenceStatus) => {
    setNistFunctions(funcs => 
      funcs.map(func => ({
        ...func,
        categories: func.categories.map(cat => ({
          ...cat,
          subcategories: cat.subcategories.map(sub => 
            sub.id === subcategoryId 
              ? { ...sub, evidenceStatus: newStatus, lastUpdated: new Date().toISOString() }
              : sub
          )
        }))
      }))
    );
  };

  const updateImplementationTier = (subcategoryId: string, newTier: ImplementationTier) => {
    setNistFunctions(funcs => 
      funcs.map(func => ({
        ...func,
        categories: func.categories.map(cat => ({
          ...cat,
          subcategories: cat.subcategories.map(sub => 
            sub.id === subcategoryId 
              ? { ...sub, implementationTier: newTier, lastUpdated: new Date().toISOString() }
              : sub
          )
        }))
      }))
    );
    toast({
      title: "Implementation Tier Updated",
      description: `${subcategoryId} tier changed to ${getTierLabel(newTier)}`,
    });
  };

  const handleGenerateDocument = (subcategoryId: string, subcategoryName: string) => {
    toast({
      title: "Generating Document",
      description: `Creating documentation for ${subcategoryId}: ${subcategoryName}`,
    });
  };

  const handleGenerateAllDocuments = () => {
    toast({
      title: "Generating All Documents",
      description: `Creating documentation for all ${stats.total} NIST CSF subcategories`,
    });
  };

  const getTierLabel = (tier: ImplementationTier): string => {
    switch (tier) {
      case "tier_1": return "Partial";
      case "tier_2": return "Risk Informed";
      case "tier_3": return "Repeatable";
      case "tier_4": return "Adaptive";
    }
  };



  const getFunctionStats = (func: NISTFunction) => {
    const allSubs = func.categories.flatMap(c => c.subcategories);
    const total = allSubs.length;
    const implemented = allSubs.filter(s => s.status === "implemented").length;
    const inProgress = allSubs.filter(s => s.status === "in_progress").length;
    return { total, implemented, inProgress };
  };

  const getFunctionColorClasses = (color: string) => {
    switch (color) {
      case "blue": return { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", accent: "bg-blue-50 dark:bg-blue-950" };
      case "green": return { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", accent: "bg-green-50 dark:bg-green-950" };
      case "yellow": return { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300", accent: "bg-yellow-50 dark:bg-yellow-950" };
      case "orange": return { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300", accent: "bg-orange-50 dark:bg-orange-950" };
      case "purple": return { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300", accent: "bg-purple-50 dark:bg-purple-950" };
      default: return { bg: "bg-gray-100 dark:bg-gray-900", text: "text-gray-700 dark:text-gray-300", accent: "bg-gray-50 dark:bg-gray-950" };
    }
  };

  const filteredFunctions = useMemo(() => {
    if (functionFilter !== "all") {
      return nistFunctions.filter(f => f.id === functionFilter);
    }
    return nistFunctions;
  }, [nistFunctions, functionFilter]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">
              NIST Cybersecurity Framework (CSF)
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Comprehensive cybersecurity risk management framework
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
              <Activity className="h-4 w-4 mr-2" />
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
            framework="NIST" 
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
                Track your organization's NIST CSF implementation status
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
              <div className="text-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400" data-testid="text-stat-total">
                  {stats.total}
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-500">Total Subcategories</div>
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
                placeholder="Search subcategories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-subcategories"
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
            <Select value={functionFilter} onValueChange={setFunctionFilter}>
              <SelectTrigger data-testid="select-function-filter">
                <SelectValue placeholder="Filter by function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                {nistFunctions.map(func => (
                  <SelectItem key={func.id} value={func.id}>
                    {func.id} - {func.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger data-testid="select-tier-filter">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="tier_1">Tier 1: Partial</SelectItem>
                <SelectItem value="tier_2">Tier 2: Risk Informed</SelectItem>
                <SelectItem value="tier_3">Tier 3: Repeatable</SelectItem>
                <SelectItem value="tier_4">Tier 4: Adaptive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || functionFilter !== "all" || tierFilter !== "all") && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredSubcategories.length} of {stats.total} subcategories
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion 
        type="multiple" 
        value={expandedFunctions} 
        onValueChange={setExpandedFunctions}
        className="space-y-4"
      >
        {filteredFunctions.map(func => {
          const funcStats = getFunctionStats(func);
          const FuncIcon = func.icon;
          const colorClasses = getFunctionColorClasses(func.color);
          
          const filteredCategories = func.categories.map(cat => ({
            ...cat,
            subcategories: cat.subcategories.filter(sub => {
              const matchesSearch = searchTerm === "" || 
                sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sub.name.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
              const matchesTier = tierFilter === "all" || sub.implementationTier === tierFilter;
              return matchesSearch && matchesStatus && matchesTier;
            })
          })).filter(cat => cat.subcategories.length > 0);

          if (filteredCategories.length === 0) return null;

          return (
            <AccordionItem 
              key={func.id} 
              value={func.id}
              className="border rounded-lg"
              data-testid={`accordion-function-${func.id}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
                      <FuncIcon className={`h-5 w-5 ${colorClasses.text}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{func.id} - {func.name}</div>
                      <div className="text-sm text-muted-foreground">{func.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="outline">{funcStats.total} subcategories</Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {funcStats.implemented} done
                      </Badge>
                    </div>
                    <Progress 
                      value={(funcStats.implemented / funcStats.total) * 100} 
                      className="w-20 h-2 hidden sm:block"
                    />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6 mt-2">
                  {filteredCategories.map(category => (
                    <div key={category.id} className="space-y-3">
                      <div className={`p-3 rounded-lg ${colorClasses.accent}`}>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Badge variant="secondary">{category.id}</Badge>
                          {category.name}
                        </h3>
                      </div>
                      <div className="space-y-3 pl-2">
                        {category.subcategories.map(subcategory => (
                          <Card key={subcategory.id} className="border" data-testid={`card-subcategory-${subcategory.id}`}>
                            <CardContent className="p-4">
                              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2 mb-2">
                                    <Badge variant="secondary" className="shrink-0">{subcategory.id}</Badge>
                                    <h4 className="font-medium text-sm">{subcategory.name}</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {subcategory.description}
                                  </p>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-3">
                                  <Select 
                                    value={subcategory.status} 
                                    onValueChange={(value) => updateSubcategoryStatus(subcategory.id, value as SubcategoryStatus)}
                                  >
                                    <SelectTrigger 
                                      className="w-full sm:w-[160px]"
                                      data-testid={`select-status-${subcategory.id}`}
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
                                    value={subcategory.evidenceStatus} 
                                    onValueChange={(value) => updateEvidenceStatus(subcategory.id, value as EvidenceStatus)}
                                  >
                                    <SelectTrigger 
                                      className="w-full sm:w-[140px]"
                                      data-testid={`select-evidence-${subcategory.id}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No Evidence</SelectItem>
                                      <SelectItem value="partial">Partial</SelectItem>
                                      <SelectItem value="complete">Complete</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Select 
                                    value={subcategory.implementationTier} 
                                    onValueChange={(value) => updateImplementationTier(subcategory.id, value as ImplementationTier)}
                                  >
                                    <SelectTrigger 
                                      className="w-full sm:w-[180px]"
                                      data-testid={`select-tier-${subcategory.id}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="tier_1">Tier 1: Partial</SelectItem>
                                      <SelectItem value="tier_2">Tier 2: Risk Informed</SelectItem>
                                      <SelectItem value="tier_3">Tier 3: Repeatable</SelectItem>
                                      <SelectItem value="tier_4">Tier 4: Adaptive</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleGenerateDocument(subcategory.id, subcategory.name)}
                                    data-testid={`button-generate-${subcategory.id}`}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Generate Doc</span>
                                    <span className="sm:hidden">Generate</span>
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedControlForEvidence(subcategory);
                                      setEvidenceDialogOpen(true);
                                    }}
                                    data-testid={`button-evidence-${subcategory.id}`}
                                  >
                                    <Paperclip className="h-4 w-4 mr-1" />
                                    Evidence
                                    {getControlEvidence(subcategory.id).length > 0 && (
                                      <Badge variant="secondary" className="ml-1 text-xs">
                                        {getControlEvidence(subcategory.id).length}
                                      </Badge>
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {subcategory.lastUpdated && (
                                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  Last updated: {new Date(subcategory.lastUpdated).toLocaleDateString()}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {filteredSubcategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Subcategories Found</h3>
            <p className="text-muted-foreground text-sm">
              No subcategories match your current filter criteria. Try adjusting your search or filters.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setFunctionFilter("all");
                setTierFilter("all");
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
