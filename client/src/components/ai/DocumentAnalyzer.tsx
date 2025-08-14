import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Shield,
  Upload,
  Search,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DocumentAnalysisResult {
  summary: string;
  keyFindings: string[];
  complianceGaps: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  extractedData: {
    companyInfo?: any;
    policies?: string[];
    controls?: string[];
    procedures?: string[];
  };
}

interface AnalyzerProps {
  className?: string;
}

export function DocumentAnalyzer({ className }: AnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [framework, setFramework] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'file' | 'text'>('file');
  const { toast } = useToast();

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (data: { content: string; filename: string; framework?: string }) => {
      return apiRequest(`/api/ai/analyze-document`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Document has been successfully analyzed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Company profile extraction mutation
  const extractProfileMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/ai/extract-profile`, {
        method: 'POST',
        body: { content }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Extracted",
        description: "Company information has been extracted from the document.",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Read file content for text files
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setTextInput(content);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleAnalyze = async () => {
    let content = '';
    let filename = '';

    if (analysisMode === 'file' && selectedFile) {
      if (selectedFile.type.startsWith('text/') || selectedFile.type === 'application/json') {
        content = textInput;
        filename = selectedFile.name;
      } else {
        toast({
          title: "Unsupported File Type",
          description: "Please upload a text file for analysis.",
          variant: "destructive",
        });
        return;
      }
    } else if (analysisMode === 'text') {
      content = textInput;
      filename = 'Text Input';
    } else {
      toast({
        title: "No Content",
        description: "Please provide content to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Empty Content",
        description: "Please provide content to analyze.",
        variant: "destructive",
      });
      return;
    }

    analysisMutation.mutate({ content, filename, framework });
  };

  const handleExtractProfile = () => {
    if (!textInput.trim()) {
      toast({
        title: "No Content",
        description: "Please provide content to extract profile from.",
        variant: "destructive",
      });
      return;
    }

    extractProfileMutation.mutate(textInput);
  };

  const analysisResult = analysisMutation.data as DocumentAnalysisResult;
  const extractedProfile = extractProfileMutation.data;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Document Analysis & RAG
          </CardTitle>
          <CardDescription>
            Analyze documents for compliance information and extract company profile data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={analysisMode} onValueChange={(value) => setAnalysisMode(value as 'file' | 'text')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Input
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Document
                </label>
                <input
                  type="file"
                  accept=".txt,.json,.md,.csv"
                  onChange={handleFileSelect}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Document Content
                </label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your document content here..."
                  className="min-h-[200px]"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Compliance Framework (Optional)
              </label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Framework</SelectItem>
                  <SelectItem value="iso27001">ISO 27001</SelectItem>
                  <SelectItem value="soc2">SOC 2</SelectItem>
                  <SelectItem value="fedramp">FedRAMP</SelectItem>
                  <SelectItem value="nist">NIST 800-53</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              onClick={handleAnalyze}
              disabled={analysisMutation.isPending}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {analysisMutation.isPending ? 'Analyzing...' : 'Analyze Document'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleExtractProfile}
              disabled={extractProfileMutation.isPending}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {extractProfileMutation.isPending ? 'Extracting...' : 'Extract Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Analysis Results
              <Badge className={getRiskColor(analysisResult.riskLevel)}>
                {analysisResult.riskLevel.toUpperCase()} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="findings">Key Findings</TabsTrigger>
                <TabsTrigger value="gaps">Compliance Gaps</TabsTrigger>
                <TabsTrigger value="data">Extracted Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {analysisResult.summary}
                  </AlertDescription>
                </Alert>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="findings" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Key Findings</h4>
                  <div className="space-y-2">
                    {analysisResult.keyFindings.map((finding, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="gaps" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Compliance Gaps
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.complianceGaps.map((gap, index) => (
                      <Alert key={index}>
                        <AlertDescription>{gap}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="data" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.extractedData.policies && analysisResult.extractedData.policies.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Policies Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {analysisResult.extractedData.policies.map((policy, index) => (
                            <li key={index} className="text-sm">{policy}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  
                  {analysisResult.extractedData.controls && analysisResult.extractedData.controls.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Controls Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {analysisResult.extractedData.controls.map((control, index) => (
                            <li key={index} className="text-sm">{control}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Extracted Profile */}
      {extractedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Extracted Company Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(extractedProfile).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-sm text-gray-600">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}