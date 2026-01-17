import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Wand2, Eye, Shield, Flag, Lock } from "lucide-react";

interface FrameworkGenerationCardsProps {
  profile: any;
  iso27001Progress: number;
  soc2Progress: number;
  isGenerating: boolean;
  onGenerate: (framework: string) => void;
  onPreview: (framework: string) => void;
}

export function FrameworkGenerationCards({ 
  profile, 
  iso27001Progress, 
  soc2Progress, 
  isGenerating, 
  onGenerate, 
  onPreview 
}: FrameworkGenerationCardsProps) {
  return (
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
                    <ShieldCheck className="w-6 h-6 text-accent" />
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
                  onClick={() => onGenerate("ISO27001")}
                  disabled={!profile || isGenerating}
                  data-testid="button-generate-iso27001"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Documents
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onPreview("ISO27001")}
                  data-testid="button-preview-iso27001"
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
                  onClick={() => onGenerate("SOC2")}
                  disabled={!profile || isGenerating}
                  data-testid="button-generate-soc2"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Documents
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onPreview("SOC2")}
                  data-testid="button-preview-soc2"
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
                onClick={() => onGenerate("FedRAMP")}
                disabled={!profile || isGenerating}
                data-testid="button-generate-fedramp"
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
                onClick={() => onGenerate("NIST")}
                disabled={!profile || isGenerating}
                data-testid="button-generate-nist"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
