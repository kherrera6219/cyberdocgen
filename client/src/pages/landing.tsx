import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, CheckCircle, Users, ArrowRight, Zap, Globe, Lock } from "lucide-react";

export function Landing() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (!savedTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-full shadow-xl">
                  <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight px-2">
              ComplianceAI
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Generate comprehensive compliance documentation for ISO 27001, SOC 2, FedRAMP, and NIST frameworks with AI-powered automation
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-get-started"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300"
                onClick={() => window.location.href = '/login'}
                data-testid="button-enterprise-login"
              >
                Enterprise Login
              </Button>

              <Button 
                variant="ghost" 
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => window.location.href = '/enterprise-signup'}
                data-testid="button-create-account"
              >
                Create Account
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Enterprise security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Fast generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Streamline Your Compliance Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Transform complex regulatory requirements into actionable documentation with our AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Multi-Framework Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                  Complete coverage for ISO 27001, SOC 2 Type 2, FedRAMP, and NIST Cybersecurity Framework
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                  <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">AI-Generated Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                  Automatically generate policies, procedures, and assessments tailored to your organization
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                  <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                  Work together with your team to review, approve, and maintain compliance documents
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full w-fit group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                  <Globe className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Cloud-Native Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                  Secure, scalable, and accessible from anywhere with enterprise-grade infrastructure
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Frameworks Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Supported Compliance Frameworks
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Generate comprehensive documentation for the industry's most important security and compliance standards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "ISO 27001", description: "Information Security Management", documents: "45+ documents" },
              { name: "SOC 2 Type 2", description: "Service Organization Control", documents: "35+ documents" },
              { name: "FedRAMP", description: "Federal Risk Authorization", documents: "50+ documents" },
              { name: "NIST CSF", description: "Cybersecurity Framework", documents: "40+ documents" }
            ].map((framework) => (
              <Card key={framework.name} className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">{framework.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{framework.documents}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Automate Your Compliance?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join leading organizations who trust ComplianceAI to streamline their security documentation and accelerate their compliance journey.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={() => window.location.href = '/api/login'}
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}