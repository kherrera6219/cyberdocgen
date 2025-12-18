import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, FileText, Users, BarChart3, Clock, Award, ArrowRight, Menu, X,
  Zap, Lock, Bot, CheckCircle, Upload, Eye, RefreshCw, Bell, Workflow,
  Database, Cloud, Settings, GitBranch, Brain, Sparkles, Cpu, Mail, MapPin
} from "lucide-react";
import { useState, useEffect } from "react";

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CyberDocGen
              </span>
              <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features"><span className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer">Features</span></Link>
            <Link href="/pricing"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">Pricing</span></Link>
            <Link href="/about"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">About</span></Link>
            <Link href="/contact"><span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 cursor-pointer">Contact</span></Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"><Button variant="ghost">Sign In</Button></Link>
            <Button onClick={() => window.location.href = '/api/login'}>Request Beta Access</Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-3">
              <Link href="/features"><span className="block px-3 py-2 text-sm font-medium text-blue-600">Features</span></Link>
              <Link href="/pricing"><span className="block px-3 py-2 text-sm font-medium">Pricing</span></Link>
              <Link href="/about"><span className="block px-3 py-2 text-sm font-medium">About</span></Link>
              <Link href="/contact"><span className="block px-3 py-2 text-sm font-medium">Contact</span></Link>
              <div className="flex flex-col gap-2 pt-3 border-t">
                <Link href="/login"><Button variant="outline">Sign In</Button></Link>
                <Button onClick={() => window.location.href = '/api/login'}>Request Beta Access</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="font-bold">CyberDocGen</span>
            <Badge variant="outline" className="ml-2 border-gray-600 text-gray-400 text-xs">Beta</Badge>
          </div>
          <div className="text-center md:text-left">
            <p className="text-gray-400 text-sm">A product of Lucentry.ai LLC</p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> CEO@lucentry.ai</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Sacramento, CA</span>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer">Contact</span></Link>
          </div>
          <p className="text-gray-400 text-sm">2025 Lucentry.ai LLC</p>
        </div>
      </div>
    </footer>
  );
}

export default function Features() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const mainFeatures = [
    {
      icon: Bot,
      title: "AI-Powered Document Generation",
      description: "Generate comprehensive compliance documents in minutes using advanced AI. Our multi-model system leverages GPT-5.1, Claude Opus 4.5, and Gemini 3.0 Pro to create tailored policies, procedures, and assessments.",
      highlights: ["Multi-model AI (GPT-5.1, Claude, Gemini)", "Context-aware content", "Multiple document types", "Automatic formatting"]
    },
    {
      icon: Shield,
      title: "Multi-Framework Support",
      description: "Complete coverage for the industry's most important compliance frameworks, with automatic control mapping and cross-framework alignment.",
      highlights: ["ISO 27001", "SOC 2 Type II", "FedRAMP", "NIST CSF", "HIPAA", "PCI DSS"]
    },
    {
      icon: BarChart3,
      title: "Gap Analysis & Assessment",
      description: "Identify compliance gaps instantly with AI-powered assessment. Get prioritized remediation plans and track progress toward certification.",
      highlights: ["Automated gap detection", "Priority scoring", "Remediation tracking", "Progress dashboards"]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together seamlessly with role-based access control, approval workflows, and real-time collaboration features.",
      highlights: ["Role-based permissions", "Approval workflows", "Comments & mentions", "Activity tracking"]
    },
    {
      icon: Eye,
      title: "Auditor Workspace",
      description: "Dedicated read-only workspace for auditors with organized evidence packages and streamlined access to all compliance artifacts.",
      highlights: ["Read-only access", "Evidence packages", "Document export", "Audit trail"]
    },
    {
      icon: RefreshCw,
      title: "Continuous Monitoring",
      description: "Stay compliant with automated control monitoring, real-time alerts, and continuous compliance dashboards.",
      highlights: ["Real-time monitoring", "Automated alerts", "Trend analysis", "Compliance scoring"]
    }
  ];

  const additionalFeatures = [
    { icon: Upload, title: "Evidence Management", description: "Upload, organize, and link evidence to controls with automatic categorization." },
    { icon: Workflow, title: "Approval Workflows", description: "Configurable multi-stage approval processes for documents and controls." },
    { icon: GitBranch, title: "Version Control", description: "Full document version history with diff comparison and rollback capabilities." },
    { icon: Bell, title: "Smart Notifications", description: "Get notified about pending approvals, upcoming deadlines, and compliance changes." },
    { icon: Database, title: "Secure Storage", description: "Enterprise-grade AES-256 encrypted storage for all your compliance documents and evidence." },
    { icon: Cloud, title: "Cloud Integrations", description: "Connect with Google Drive, OneDrive, and other cloud storage providers." },
    { icon: Clock, title: "Audit Trail", description: "Comprehensive audit logging of all activities for complete accountability." },
    { icon: Settings, title: "Custom Templates", description: "Create and manage custom document templates for your organization." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>Powerful Features for Modern Compliance</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Everything You Need for
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Compliance Success
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            From AI-powered document generation to continuous monitoring, CyberDocGen provides a complete platform for managing your compliance journey.
          </p>
          <Button size="lg" onClick={() => window.location.href = '/api/login'} data-testid="button-start-free-trial">
            Request Beta Access
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* AI Models Banner */}
      <div className="py-12 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-8">
            <h2 className="text-2xl font-bold mb-2">Powered by Leading AI Models</h2>
            <p className="text-blue-100">Intelligent routing selects the best model for each task</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: "GPT-5.1", provider: "OpenAI", icon: Brain },
              { name: "Claude Opus 4.5", provider: "Anthropic", icon: Sparkles },
              { name: "Gemini 3.0 Pro", provider: "Google", icon: Cpu },
            ].map((model) => (
              <div key={model.name} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <model.icon className="h-6 w-6 text-white" />
                <div>
                  <p className="font-semibold text-white">{model.name}</p>
                  <p className="text-xs text-blue-200">{model.provider}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="py-16 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Core Features</h2>
          <div className="space-y-16">
            {mainFeatures.map((feature, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
                <div className="flex-1">
                  <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                    <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{feature.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {feature.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 shadow-lg">
                    <CardContent className="p-8 flex items-center justify-center min-h-[300px]">
                      <div className="text-center">
                        <feature.icon className="h-24 w-24 text-blue-600/30 dark:text-blue-400/30 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Feature illustration</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Features Grid */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">More Powerful Features</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Beyond the core functionality, CyberDocGen includes everything you need to manage compliance at scale.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                    <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Frameworks Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">Supported Frameworks</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Generate documentation for all major compliance frameworks with built-in control mapping.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {["ISO 27001", "SOC 2", "FedRAMP", "NIST CSF", "HIPAA", "PCI DSS"].map((framework) => (
              <Card key={framework} className="border-0 bg-white dark:bg-gray-800 shadow-sm text-center">
                <CardContent className="pt-6">
                  <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 dark:text-white">{framework}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Beta Program</Badge>
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Compliance Process?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our beta program and experience the power of AI-driven compliance automation. Free during beta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => window.location.href = '/api/login'} data-testid="button-start-trial">
              Request Beta Access
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" data-testid="button-view-pricing">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
