import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import CompanyProfile from "./pages/company-profile";
import Documents from "./pages/documents";
import { Landing } from "./pages/landing";
import { Home } from "./pages/home";
import { UserProfile } from "./pages/user-profile";
import { OrganizationSetup } from "./pages/organization-setup";
import EnhancedCompanyProfile from "./pages/enhanced-company-profile";
import DocumentWorkspace from "./pages/document-workspace";
import AuditTrail from "./pages/audit-trail";
import DocumentVersions from "./pages/document-versions";
import { useParams } from "wouter";

function WorkspaceWrapper() {
  return <DocumentWorkspace organizationId="default" />;
}

function DocumentVersionsWrapper() {
  const params = useParams<{ id: string }>();
  return <DocumentVersions documentId={params.id || ""} documentTitle="Document" />;
}
import { ObjectStorageManager } from "./components/ObjectStorageManager";
import { IndustrySpecialization } from "./components/ai/IndustrySpecialization";
import GapAnalysis from "./pages/gap-analysis";
import ExportCenter from "./pages/export-center";
import ISO27001Framework from "./pages/iso27001-framework";
import SOC2Framework from "./pages/soc2-framework";
import FedRAMPFramework from "./pages/fedramp-framework";
import NISTFramework from "./pages/nist-framework";
import Layout from "./components/layout";

// Lazy load components
const EnterpriseLogin = lazy(() => import("@/pages/enterprise-login"));
const EnterpriseSignup = lazy(() => import("@/pages/enterprise-signup"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const MfaSetup = lazy(() => import("@/pages/mfa-setup"));
const AdminSettings = lazy(() => import("@/pages/admin-settings"));
const CloudIntegrations = lazy(() => import("@/pages/cloud-integrations"));
const AIAssistant = lazy(() => import("@/pages/ai-assistant"));
const MCPTools = lazy(() => import("@/pages/mcp-tools"));
const AIDocGenerator = lazy(() => import("@/pages/ai-doc-generator"));

// Placeholder for AuditTrailComplete and UserProfileNew components
const AuditTrailComplete = lazy(() => import("./pages/audit-trail-complete"));
const UserProfileNew = lazy(() => import("./pages/user-profile-new"));

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/admin">
        <Suspense fallback={<div>Loading...</div>}>
          <AdminSettings />
        </Suspense>
      </Route>
      <Route path="/cloud-integrations">
        <Suspense fallback={<div>Loading...</div>}>
          <CloudIntegrations />
        </Suspense>
      </Route>
      <Route path="/audit-trail/complete">
        <Suspense fallback={<div>Loading...</div>}>
          <AuditTrailComplete />
        </Suspense>
      </Route>
      <Route path="/profile/settings">
        <Suspense fallback={<div>Loading...</div>}>
          <UserProfileNew />
        </Suspense>
      </Route>
      <Route path="/ai-assistant">
        <Suspense fallback={<div>Loading...</div>}>
          <AIAssistant />
        </Suspense>
      </Route>
      <Route path="/mcp-tools">
        <Suspense fallback={<div>Loading...</div>}>
          <MCPTools />
        </Suspense>
      </Route>
      <Route path="/ai-doc-generator">
        <Suspense fallback={<div>Loading...</div>}>
          <AIDocGenerator />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login">
        <Suspense fallback={<div>Loading...</div>}>
          <EnterpriseLogin />
        </Suspense>
      </Route>
      <Route path="/enterprise-signup">
        <Suspense fallback={<div>Loading...</div>}>
          <EnterpriseSignup />
        </Suspense>
      </Route>
      <Route path="/forgot-password">
        <Suspense fallback={<div>Loading...</div>}>
          <ForgotPassword />
        </Suspense>
      </Route>
      <Route path="/reset-password">
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPassword />
        </Suspense>
      </Route>
      <Route path="/mfa-setup">
        <Suspense fallback={<div>Loading...</div>}>
          <MfaSetup />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
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

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  // Timeout the loading state after 2 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
  if (!isAuthenticated) {
    return <PublicRouter />;
  }

  // Authenticated - show routes with layout and organization context
  return (
    <OrganizationProvider>
      <Layout>
        <AuthenticatedRouter />
      </Layout>
    </OrganizationProvider>
  );
}

export default App;