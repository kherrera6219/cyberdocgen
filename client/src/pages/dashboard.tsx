import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardSkeleton } from "@/components/loading/loading-skeleton";
import { DocumentPreview } from "@/components/templates/document-preview";
import { GenerationCustomizer } from "@/components/generation/GenerationCustomizer";
import { HelpTooltip } from "@/components/help/ContextualHelp";
import {
  TrendingUp,
  FileText,
  Layers,
  Clock,
  Tag,
  Shield,
  Flag,
  Lock,
  Wand2,
  Edit,
  CheckCircle,
  Eye,
  Zap
} from "lucide-react";
import type { CompanyProfile, Document, GenerationJob } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentFramework, setCurrentFramework] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewFramework, setPreviewFramework] = useState("");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("");

  // Get company profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
  });

  // Get documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Show loading skeleton if data is loading
  if (profilesLoading || documentsLoading) {
    return <DashboardSkeleton />;
  }

  // Get the first profile (for demo purposes)
  const profile = profiles[0];

  // Calculate stats
  const completedDocs = documents.filter(doc => doc.status === 'complete').length;
  const totalFrameworks = ['ISO27001', 'SOC2', 'FedRAMP', 'NIST'];
  const activeFrameworks = Array.from(new Set(documents.map(doc => doc.framework))).length;

  // Framework stats
  const iso27001Docs = documents.filter(doc => doc.framework === 'ISO27001' && doc.status === 'complete').length;
  const soc2Docs = documents.filter(doc => doc.framework === 'SOC2' && doc.status === 'complete').length;
  const fedrampDocs = documents.filter(doc => doc.framework === 'FedRAMP' && doc.status === 'complete').length;
  const nistDocs = documents.filter(doc => doc.framework === 'NIST' && doc.status === 'complete').length;

  const iso27001Progress = Math.round((iso27001Docs / 14) * 100);
  const soc2Progress = Math.round((soc2Docs / 12) * 100);

  // Document generation mutation
  const generateDocsMutation = useMutation({
    mutationFn: async ({ framework }: { framework: string }) => {
      if (!profile) throw new Error("No company profile found");

      return await apiRequest("/api/generate-documents", {
        method: "POST",
        body: {
          companyProfileId: profile.id,
          framework,
        }
      });
    },
    onSuccess: (data) => {
      setCurrentFramework("");
      const jobId = data.jobId;

      // Poll for job status
      const pollJob = async () => {
        try {
          const jobResponse = await fetch(`/api/generation-jobs/${jobId}`);
          const job: GenerationJob = await jobResponse.json();

          setGenerationProgress(job.progress);

          if (job.status === 'completed') {
            setIsGenerating(false);
            setGenerationProgress(0);
            queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
            toast({
              title: "Documents Generated",
              description: "All compliance documents have been generated successfully.",
            });
          } else if (job.status === 'failed') {
            setIsGenerating(false);
            setGenerationProgress(0);
            toast({
              title: "Generation Failed",
              description: "There was an error generating documents. Please try again.",
              variant: "destructive",
            });
          } else {
            setTimeout(pollJob, 2000);
          }
        } catch (error) {
          console.error("Error polling job:", error);
        }
      };

      setTimeout(pollJob, 1000);
    },
    onError: (error) => {
      setIsGenerating(false);
      setCurrentFramework("");
      toast({
        title: "Generation Failed",
        description: "Failed to start document generation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateDocuments = (framework: string) => {
    if (!profile) {
      toast({
        title: "Profile Required",
        description: "Please create a company profile first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setCurrentFramework(framework);
    generateDocsMutation.mutate({ framework });
  };

  const handleStartGeneration = (framework: string) => {
    handleGenerateDocuments(framework);
  };

  const recentDocuments = documents
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Compliance Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Automate your compliance documentation with AI-powered generation</p>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent dark:bg-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {documents.length > 0 ? Math.round((completedDocs / documents.length) * 100) : 0}%
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-accent/10 to-accent/20 rounded-lg flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary dark:bg-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Documents Generated</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{completedDocs}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 dark:bg-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Active Frameworks</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{activeFrameworks}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500/10 to-yellow-500/20 rounded-lg flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 dark:bg-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Next Deadline</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">45d</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500/10 to-red-500/20 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Profile Section */}
      {profile && (
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">Company Profile</CardTitle>
              <Button size="sm" className="self-start sm:self-auto">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Basic Information</h3>
                <div className="space-y-2">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Company:</span> {profile.companyName}</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Industry:</span> {profile.industry}</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Size:</span> {profile.companySize}</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Location:</span> {profile.headquarters}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Technical Environment</h3>
                <div className="space-y-2">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Cloud:</span> {profile.cloudInfrastructure.join(', ')}</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Data Classification:</span> {profile.dataClassification}</p>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300"><span className="font-medium">Applications:</span> {profile.businessApplications}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Generation Section */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">AI Document Generation</CardTitle>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Generate compliance documentation based on your company profile</p>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* ISO 27001 Card */}
            <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-accent/10 to-accent/20 rounded-xl flex items-center justify-center shadow-sm">
                      <Tag className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">ISO 27001</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Information Security Management</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gradient-to-r from-accent to-accent/80 text-white px-3 py-1.5 rounded-full shadow-sm">
                    {iso27001Progress}% Complete
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full bg-accent hover:bg-accent/90"
                    onClick={() => handleGenerateDocuments("ISO27001")}
                    disabled={!profile || isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Documents
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPreviewFramework("ISO27001");
                      setShowPreview(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Templates
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SOC 2 Type 2 Card */}
            <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">SOC 2 Type 2</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">System & Organization Controls</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gradient-to-r from-warning to-warning/80 text-white px-3 py-1.5 rounded-full shadow-sm">
                    {soc2Progress}% Complete
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleGenerateDocuments("SOC2")}
                    disabled={!profile || isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Documents
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setPreviewFramework("SOC2");
                      setShowPreview(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Frameworks Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* FedRAMP Card */}
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Flag className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">FedRAMP</h3>
                      <p className="text-sm text-gray-600">Federal Risk Authorization</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">Not Started</span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleGenerateDocuments("FedRAMP")}
                  disabled={!profile || isGenerating}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Documents
                </Button>
              </CardContent>
            </Card>

            {/* NIST Card */}
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">NIST CSF</h3>
                      <p className="text-sm text-gray-600">Cybersecurity Framework</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">Not Started</span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleGenerateDocuments("NIST")}
                  disabled={!profile || isGenerating}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Documents
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.title}</h4>
                      <p className="text-sm text-gray-500">{doc.framework} • {doc.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-sm text-gray-500">Complete</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Progress Dialog */}
      <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Generating {currentFramework} Documents</span>
            </DialogTitle>
            <DialogDescription>
              AI is generating customized compliance documents based on your company profile. This process typically takes 10-15 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>



            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                Tip: You can continue using other features while generation is in progress.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Templates Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Templates - {previewFramework}</DialogTitle>
            <DialogDescription>
              Preview available document templates for {previewFramework} compliance framework
            </DialogDescription>
          </DialogHeader>
          {showPreview && (
            <DocumentPreview
              templates={[]}
              framework={previewFramework}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Generation Customizer Dialog */}
      {showCustomizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Customize Generation</h3>
            <p className="text-gray-600 mb-4">
              Customize AI document generation for {selectedFramework} framework.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowCustomizer(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => {
                setShowCustomizer(false);
                handleStartGeneration(selectedFramework);
              }}>
                Generate Documents
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}