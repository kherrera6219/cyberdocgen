import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, FileText, CheckCircle, Users, ArrowRight, Zap, Globe, Lock, 
  BarChart3, Clock, Award, Building2, ChevronRight, Sparkles,
  Brain, Cpu
} from "lucide-react";
import { TemporaryLoginDialog } from "@/components/TemporaryLoginDialog";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicHeader";

export function Landing() {
  const aiModels = [
    { name: "GPT-5.1", provider: "OpenAI", icon: Brain },
    { name: "Claude Opus 4.5", provider: "Anthropic", icon: Sparkles },
    { name: "Gemini 3.0 Pro", provider: "Google", icon: Cpu },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PublicHeader />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Now in Beta - Powered by GPT-5.1, Claude Opus 4.5 & Gemini 3.0</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight px-2">
              Compliance Documentation
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Generate audit-ready documentation for ISO 27001, SOC 2, FedRAMP, and NIST frameworks in minutes, not months. Multi-model AI for superior results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 px-4">
              <TemporaryLoginDialog
                trigger={
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-md shadow-lg transition-all duration-300"
                    data-testid="button-get-started"
                  >
                    Start for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                }
              />

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 py-4 rounded-md transition-all duration-300"
                data-testid="button-see-features"
              >
                <Link href="/features">
                  See How It Works
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-8 text-sm text-gray-500 dark:text-gray-400 px-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Free during beta</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Multi-tenant support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Models Section */}
      <div className="py-16 bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Powered by Leading AI Models
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Intelligent model selection routes your requests to the best AI for each task
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {aiModels.map((model) => (
              <Card key={model.name} className="border-0 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 shadow-sm text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit">
                    <model.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{model.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{model.provider}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Compliance Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform complex regulatory requirements into actionable documentation with our AI-powered platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Multi-Framework Support", description: "Complete coverage for ISO 27001, SOC 2, FedRAMP, NIST, and more. One platform for all your compliance needs.", color: "blue" },
              { icon: FileText, title: "AI Document Generation", description: "Generate policies, procedures, and assessments automatically tailored to your organization's context.", color: "purple" },
              { icon: Users, title: "Team Collaboration", description: "Work together with role-based access, approval workflows, and real-time commenting.", color: "green" },
              { icon: BarChart3, title: "Gap Analysis", description: "Identify compliance gaps instantly with AI-powered assessment and prioritized remediation plans.", color: "orange" },
              { icon: Clock, title: "Audit Preparation", description: "Dedicated auditor workspace with evidence packages and read-only access for seamless audits.", color: "red" },
              { icon: Award, title: "Continuous Monitoring", description: "Stay compliant with automated control monitoring and real-time compliance dashboards.", color: "indigo" },
            ].map((feature, index) => (
              <Card key={index} className="group border-0 bg-card/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" data-testid="button-view-all-features">
              <Link href="/features">
                View All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Frameworks Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Supported Compliance Frameworks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Generate comprehensive documentation for the industry's most important security and compliance standards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "ISO 27001", description: "Information Security Management", documents: "45+ templates", icon: Shield },
              { name: "SOC 2 Type II", description: "Service Organization Control", documents: "35+ templates", icon: Lock },
              { name: "FedRAMP", description: "Federal Risk Authorization", documents: "50+ templates", icon: Building2 },
              { name: "NIST CSF", description: "Cybersecurity Framework", documents: "40+ templates", icon: Globe }
            ].map((framework) => (
              <Card key={framework.name} className="text-center border-0 bg-card shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <framework.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{framework.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{framework.documents}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Security & Trust Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built with Security First
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your compliance data deserves enterprise-grade protection
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "AES-256 Encryption", description: "All data encrypted at rest and in transit with field-level encryption support" },
              { title: "Multi-Factor Auth", description: "TOTP and passkey support with comprehensive audit logging" },
              { title: "Role-Based Access", description: "Granular permissions with multi-tenant isolation" },
            ].map((item, index) => (
              <Card key={index} className="border-0 bg-card shadow-sm text-center">
                <CardContent className="pt-8">
                  <Lock className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
            Now in Beta
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Compliance?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Experience the future of AI-powered compliance documentation. Contact us to request beta access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <TemporaryLoginDialog 
              trigger={
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-md shadow-lg transition-all duration-300"
                  data-testid="button-start-free-trial"
                >
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              }
            />
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 px-8 py-4 rounded-md"
              data-testid="button-contact-sales"
            >
              <Link href="/contact">
                Request Beta Access
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

