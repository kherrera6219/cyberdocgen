import { lazy, Suspense, useState, useEffect, useDeferredValue } from "react";

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { Switch, Route, useParams } from "wouter";
import Layout from "./components/layout";

// Lazy load all pages for code splitting
const NotFound = lazy(() => import("./pages/not-found"));
const Landing = lazy(() => import("./pages/landing").then(m => ({ default: m.Landing })));
const Home = lazy(() => import("./pages/home").then(m => ({ default: m.Home })));

// Core application pages
const Dashboard = lazy(() => import("./pages/dashboard"));
const CompanyProfile = lazy(() => import("./pages/company-profile"));
const EnhancedCompanyProfile = lazy(() => import("./pages/enhanced-company-profile"));
const Documents = lazy(() => import("./pages/documents"));
const DocumentWorkspace = lazy(() => import("./pages/document-workspace"));
const DocumentVersions = lazy(() => import("./pages/document-versions"));
const UserProfile = lazy(() => import("./pages/user-profile").then(m => ({ default: m.UserProfile })));
const OrganizationSetup = lazy(() => import("./pages/organization-setup").then(m => ({ default: m.OrganizationSetup })));

// Compliance framework pages
const ISO27001Framework = lazy(() => import("./pages/iso27001-framework"));
const SOC2Framework = lazy(() => import("./pages/soc2-framework"));
const FedRAMPFramework = lazy(() => import("./pages/fedramp-framework"));
const NISTFramework = lazy(() => import("./pages/nist-framework"));

// Analysis and audit pages
const GapAnalysis = lazy(() => import("./pages/gap-analysis"));
const AuditTrail = lazy(() => import("./pages/audit-trail-complete"));
const ExportCenter = lazy(() => import("./pages/export-center"));

// Authentication pages
const EnterpriseLogin = lazy(() => import("@/pages/enterprise-login"));
const EnterpriseSignup = lazy(() => import("@/pages/enterprise-signup"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const MfaSetup = lazy(() => import("@/pages/mfa-setup"));

// Admin and settings
const AdminSettings = lazy(() => import("@/pages/admin-settings"));
const ProfileSettings = lazy(() => import("./pages/profile-settings"));
const LocalSettings = lazy(() => import("@/pages/local-settings"));
const ApiKeys = lazy(() => import("@/pages/api-keys"));

// AI features
const AIAssistant = lazy(() => import("@/pages/ai-assistant"));
const AIDocGenerator = lazy(() => import("@/pages/ai-doc-generator"));
const AIHub = lazy(() => import("./pages/ai-hub"));

// Integrations and tools
const CloudIntegrations = lazy(() => import("@/pages/cloud-integrations"));
const ConnectorsHub = lazy(() => import("@/pages/connectors-hub"));
const MCPTools = lazy(() => import("@/pages/mcp-tools"));
const ObjectStorageManager = lazy(() => import("./components/ObjectStorageManager").then(m => ({ default: m.ObjectStorageManager })));
const IndustrySpecialization = lazy(() => import("./components/ai/IndustrySpecialization").then(m => ({ default: m.IndustrySpecialization })));

// Evidence and approvals
const EvidenceIngestion = lazy(() => import("./pages/evidence-ingestion"));
const ControlApprovals = lazy(() => import("./pages/control-approvals"));
const AuditorWorkspace = lazy(() => import("./pages/auditor-workspace"));

// Public pages
const About = lazy(() => import("./pages/about"));
const Features = lazy(() => import("./pages/features"));
const Pricing = lazy(() => import("./pages/pricing"));
const Contact = lazy(() => import("./pages/contact"));
const Privacy = lazy(() => import("./pages/privacy"));
const Terms = lazy(() => import("./pages/terms"));

// Wrapper components for dynamic routes
function WorkspaceWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading workspace...</div>}>
      <DocumentWorkspace organizationId="default" />
    </Suspense>
  );
}

function DocumentVersionsWrapper() {
  const params = useParams<{ id: string }>();
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading document versions...</div>}>
      <DocumentVersions documentId={params.id || ""} documentTitle="Document" />
    </Suspense>
  );
}

function AuthenticatedRouter() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile" component={CompanyProfile} />
        <Route path="/enhanced-profile" component={EnhancedCompanyProfile} />
        <Route path="/workspace" component={WorkspaceWrapper} />
        <Route path="/documents" component={Documents} />
        <Route path="/gap-analysis" component={GapAnalysis} />
        <Route path="/iso27001-framework" component={ISO27001Framework} />
        <Route path="/soc2-framework" component={SOC2Framework} />
        <Route path="/fedramp-framework" component={FedRAMPFramework} />
        <Route path="/nist-framework" component={NISTFramework} />
        <Route path="/audit-trail" component={AuditTrail} />
        <Route path="/document-versions/:id" component={DocumentVersionsWrapper} />
        <Route path="/user-profile" component={UserProfile} />
        <Route path="/organizations" component={OrganizationSetup} />
        <Route path="/storage" component={ObjectStorageManager} />
        <Route path="/ai-specialization" component={IndustrySpecialization} />
        <Route path="/export" component={ExportCenter} />
        <Route path="/admin" component={AdminSettings} />
        <Route path="/local-settings" component={LocalSettings} />
        <Route path="/api-keys" component={ApiKeys} />
        <Route path="/cloud-integrations" component={CloudIntegrations} />
        <Route path="/profile/settings" component={ProfileSettings} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/mcp-tools" component={MCPTools} />
        <Route path="/ai-doc-generator" component={AIDocGenerator} />
        <Route path="/ai-hub" component={AIHub} />
        <Route path="/connectors" component={ConnectorsHub} />
        <Route path="/evidence-ingestion" component={EvidenceIngestion} />
        <Route path="/control-approvals" component={ControlApprovals} />
        <Route path="/auditor-workspace" component={AuditorWorkspace} />
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Suspense>
  );
}

function PublicRouter() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={EnterpriseLogin} />
        <Route path="/enterprise-login" component={EnterpriseLogin} />
        <Route path="/enterprise-signup" component={EnterpriseSignup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/mfa-setup" component={MfaSetup} />
        <Route path="/about" component={About} />
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route>
          <NotFound fullScreen />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

import { NetworkBanner } from "./components/NetworkBanner";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  
  // Defer authentication state changes to prevent Suspense errors during synchronous updates
  // This fixes the "A component suspended while responding to synchronous input" error
  const deferredIsAuthenticated = useDeferredValue(isAuthenticated);

  // Timeout the loading state after 2 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Global error handler for actions/queries outside of components
  const { toast } = useToast();
  useEffect(() => {
    const handleAppError = (event: CustomEvent<{ message: string; title?: string }>) => {
      const { message, title } = event.detail;
      toast({
        title: title || "Error",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    };

    window.addEventListener('app:error', handleAppError as EventListener);
    return () => window.removeEventListener('app:error', handleAppError as EventListener);
  }, [toast]);

  // Also stop showing loading when auth check completes
  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
    }
  }, [isLoading]);

  // Show a proper loading state to prevent routing flicker (with timeout)
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show public routes without layout
  if (!deferredIsAuthenticated) {
    return (
      <>
        <NetworkBanner />
        <PublicRouter />
      </>
    );
  }

  // Authenticated - show routes with layout and organization context
  return (
    <OrganizationProvider>
      <NetworkBanner />
      <Layout>
        <AuthenticatedRouter />
      </Layout>
    </OrganizationProvider>
  );
}

export default App;