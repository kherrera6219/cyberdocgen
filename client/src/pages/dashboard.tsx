import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProgressModal } from "@/components/ui/progress-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  CheckCircle
} from "lucide-react";
import type { CompanyProfile, Document, GenerationJob } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentFramework, setCurrentFramework] = useState("");

  // Get company profiles
  const { data: profiles = [] } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
  });

  // Get documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

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
      
      const response = await apiRequest("POST", "/api/generate-documents", {
        companyProfileId: profile.id,
        framework,
      });
      return response.json();
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

  const recentDocuments = documents
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Compliance Dashboard</h1>
        <p className="text-gray-600">Automate your compliance documentation with AI-powered generation</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.length > 0 ? Math.round((completedDocs / documents.length) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents Generated</p>
                <p className="text-2xl font-bold text-gray-900">{completedDocs}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Frameworks</p>
                <p className="text-2xl font-bold text-gray-900">{activeFrameworks}</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Deadline</p>
                <p className="text-2xl font-bold text-gray-900">45d</p>
              </div>
              <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Profile Section */}
      {profile && (
        <Card className="mb-8">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle>Company Profile</CardTitle>
              <Button size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Company:</span> {profile.companyName}</p>
                  <p><span className="font-medium">Industry:</span> {profile.industry}</p>
                  <p><span className="font-medium">Size:</span> {profile.companySize}</p>
                  <p><span className="font-medium">Location:</span> {profile.headquarters}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Technical Environment</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Cloud:</span> {profile.cloudInfrastructure.join(', ')}</p>
                  <p><span className="font-medium">Data Classification:</span> {profile.dataClassification}</p>
                  <p><span className="font-medium">Applications:</span> {profile.businessApplications}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Generation Section */}
      <Card className="mb-8">
        <CardHeader className="border-b border-gray-200">
          <CardTitle>AI Document Generation</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Generate compliance documentation based on your company profile</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ISO 27001 Card */}
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">ISO 27001</h3>
                      <p className="text-sm text-gray-600">Information Security Management</p>
                    </div>
                  </div>
                  <span className="text-xs bg-accent text-white px-2 py-1 rounded-full">
                    {iso27001Progress}% Complete
                  </span>
                </div>
                
                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => handleGenerateDocuments("ISO27001")}
                  disabled={!profile || isGenerating}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Documents
                </Button>
              </CardContent>
            </Card>
            
            {/* SOC 2 Type 2 Card */}
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">SOC 2 Type 2</h3>
                      <p className="text-sm text-gray-600">System & Organization Controls</p>
                    </div>
                  </div>
                  <span className="text-xs bg-warning text-white px-2 py-1 rounded-full">
                    {soc2Progress}% Complete
                  </span>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => handleGenerateDocuments("SOC2")}
                  disabled={!profile || isGenerating}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Documents
                </Button>
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

      <ProgressModal
        isOpen={isGenerating}
        onOpenChange={setIsGenerating}
        progress={generationProgress}
        currentStep={`Generating ${currentFramework} documents...`}
        framework={currentFramework}
      />
    </div>
  );
}