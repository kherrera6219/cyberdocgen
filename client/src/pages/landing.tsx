import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, FileText, CheckCircle, Users, ArrowRight, Zap, Globe, Lock, 
  BarChart3, Clock, Award, Building2, ChevronRight, Menu, X, Sparkles,
  Brain, Cpu, Mail, MapPin
} from "lucide-react";

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
            <Link href="/features">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Features</span>
            </Link>
            <Link href="/pricing">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Pricing</span>
            </Link>
            <Link href="/about">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">About</span>
            </Link>
            <Link href="/contact">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">Contact</span>
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button 
                data-testid="header-login-button"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-3">
              <Link href="/features">
                <span className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">Features</span>
              </Link>
              <Link href="/pricing">
                <span className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">Pricing</span>
              </Link>
              <Link href="/about">
                <span className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">About</span>
              </Link>
              <Link href="/contact">
                <span className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">Contact</span>
              </Link>
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <Link href="/login"><Button>Sign In</Button></Link>
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
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">CyberDocGen</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Enterprise-grade compliance automation powered by AI. A product of Lucentry.ai LLC.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:CEO@lucentry.ai" className="hover:text-white transition-colors">CEO@lucentry.ai</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Sacramento, CA</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/features"><span className="hover:text-white cursor-pointer transition-colors">Features</span></Link></li>
              <li><Link href="/pricing"><span className="hover:text-white cursor-pointer transition-colors">Pricing</span></Link></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Integrations</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">API</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about"><span className="hover:text-white cursor-pointer transition-colors">About</span></Link></li>
              <li><Link href="/contact"><span className="hover:text-white cursor-pointer transition-colors">Contact</span></Link></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Careers</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Blog</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></Link></li>
              <li><Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span></Link></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Security</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Compliance</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            2025 Lucentry.ai LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <Badge variant="outline" className="border-gray-600 text-gray-400">Beta</Badge>
            <span className="text-sm">Building the future of compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

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

  const aiModels = [
    { name: "GPT-5.1", provider: "OpenAI", icon: Brain },
    { name: "Claude Opus 4.5", provider: "Anthropic", icon: Sparkles },
    { name: "Gemini 3.0 Pro", provider: "Google", icon: Cpu },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Now in Beta - Powered by GPT-5.1, Claude Opus 4.5 & Gemini 3.0</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight px-2">
              Compliance Documentation
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Generate audit-ready documentation for ISO 27001, SOC 2, FedRAMP, and NIST frameworks in minutes, not months. Multi-model AI for superior results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 px-4">
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-md shadow-lg transition-all duration-300"
                  data-testid="button-get-started"
                >
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-8 py-4 rounded-md transition-all duration-300"
                onClick={() => window.location.href = '/features'}
                data-testid="button-see-features"
              >
                See How It Works
                <ChevronRight className="ml-2 h-5 w-5" />
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
      <div className="py-16 bg-white dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Powered by Leading AI Models
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{model.name}</h3>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Compliance Success
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
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
              <Card key={index} className="group border-0 bg-white dark:bg-gray-800/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/features">
              <Button variant="outline" size="lg" data-testid="button-view-all-features">
                View All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Frameworks Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-800/30">
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
              { name: "ISO 27001", description: "Information Security Management", documents: "45+ templates", icon: Shield },
              { name: "SOC 2 Type II", description: "Service Organization Control", documents: "35+ templates", icon: Lock },
              { name: "FedRAMP", description: "Federal Risk Authorization", documents: "50+ templates", icon: Building2 },
              { name: "NIST CSF", description: "Cybersecurity Framework", documents: "40+ templates", icon: Globe }
            ].map((framework) => (
              <Card key={framework.name} className="text-center border-0 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <framework.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
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

      {/* Security & Trust Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built with Security First
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your compliance data deserves enterprise-grade protection
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "AES-256 Encryption", description: "All data encrypted at rest and in transit with field-level encryption support" },
              { title: "Multi-Factor Auth", description: "TOTP and passkey support with comprehensive audit logging" },
              { title: "Role-Based Access", description: "Granular permissions with multi-tenant isolation" },
            ].map((item, index) => (
              <Card key={index} className="border-0 bg-white dark:bg-gray-800 shadow-sm text-center">
                <CardContent className="pt-8">
                  <Lock className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{item.description}</p>
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
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-md shadow-lg transition-all duration-300"
                data-testid="button-start-free-trial"
              >
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10 px-8 py-4 rounded-md"
                data-testid="button-contact-sales"
              >
                Request Beta Access
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
