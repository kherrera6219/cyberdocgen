import { lazy, Suspense, type ComponentType } from "react";

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipNavigation } from "@/components/SkipNavigation";
import { AppErrorHandler } from "@/components/AppErrorHandler";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModeGate } from "@/components/routing/ModeGate";
import type { DeploymentMode, RuntimeFeatures } from "@/lib/runtimeConfig";
import { Switch, Route, useParams } from "wouter";
import Layout from "./components/layout";

// Lazy load all pages for code splitting
const NotFound = lazy(() => import("./pages/not-found"));
const Landing = lazy(() => import("./pages/landing").then(m => ({ default: m.Landing })));

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
const AuditTrail = lazy(() => import("./pages/audit-trail"));
const RepositoryAnalysis = lazy(() => import("./pages/repository-analysis").then(m => ({ default: m.RepositoryAnalysisPage })));
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

function RouteErrorFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <div className="max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        This page encountered an unexpected error. Please refresh or navigate to a different section.
      </div>
    </div>
  );
}

interface BoundaryRouteProps {
  path: string;
  component: ComponentType<Record<string, unknown>>;
  requiredMode?: DeploymentMode;
  requiredFeature?: keyof RuntimeFeatures;
}

function BoundaryRoute({ path, component: Component, requiredMode, requiredFeature }: BoundaryRouteProps) {
  return (
    <Route path={path}>
      {(params) => (
        <ErrorBoundary fallback={<RouteErrorFallback />}>
          <ModeGate requiredMode={requiredMode} requiredFeature={requiredFeature}>
            <Component {...params} />
          </ModeGate>
        </ErrorBoundary>
      )}
    </Route>
  );
}

function AuthenticatedRouter() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <BoundaryRoute path="/" component={Dashboard} />
        <BoundaryRoute path="/dashboard" component={Dashboard} />
        <BoundaryRoute path="/profile" component={CompanyProfile} />
        <BoundaryRoute path="/enhanced-profile" component={EnhancedCompanyProfile} />
        <BoundaryRoute path="/workspace" component={WorkspaceWrapper} />
        <BoundaryRoute path="/documents" component={Documents} />
        <BoundaryRoute path="/gap-analysis" component={GapAnalysis} />
        <BoundaryRoute path="/iso27001-framework" component={ISO27001Framework} />
        <BoundaryRoute path="/soc2-framework" component={SOC2Framework} />
        <BoundaryRoute path="/fedramp-framework" component={FedRAMPFramework} />
        <BoundaryRoute path="/nist-framework" component={NISTFramework} />
        <BoundaryRoute path="/audit-trail" component={AuditTrail} />
        <BoundaryRoute path="/repository-analysis" component={RepositoryAnalysis} />
        <BoundaryRoute path="/document-versions/:id" component={DocumentVersionsWrapper} />
        <BoundaryRoute path="/user-profile" component={UserProfile} />
        <BoundaryRoute path="/organizations" component={OrganizationSetup} requiredMode="cloud" requiredFeature="organizationManagement" />
        <BoundaryRoute path="/storage" component={ObjectStorageManager} />
        <BoundaryRoute path="/ai-specialization" component={IndustrySpecialization} />
        <BoundaryRoute path="/export" component={ExportCenter} />
        <BoundaryRoute path="/admin" component={AdminSettings} requiredMode="cloud" requiredFeature="userManagement" />
        <BoundaryRoute path="/local-settings" component={LocalSettings} requiredMode="local" />
        <BoundaryRoute path="/api-keys" component={ApiKeys} requiredMode="local" />
        <BoundaryRoute path="/cloud-integrations" component={CloudIntegrations} requiredMode="cloud" />
        <BoundaryRoute path="/profile/settings" component={ProfileSettings} />
        <BoundaryRoute path="/ai-assistant" component={AIAssistant} />
        <BoundaryRoute path="/mcp-tools" component={MCPTools} />
        <BoundaryRoute path="/ai-doc-generator" component={AIDocGenerator} />
        <BoundaryRoute path="/ai-hub" component={AIHub} />
        <BoundaryRoute path="/connectors" component={ConnectorsHub} />
        <BoundaryRoute path="/evidence-ingestion" component={EvidenceIngestion} />
        <BoundaryRoute path="/control-approvals" component={ControlApprovals} />
        <BoundaryRoute path="/auditor-workspace" component={AuditorWorkspace} />
        <Route>
          <ErrorBoundary fallback={<RouteErrorFallback />}>
            <NotFound />
          </ErrorBoundary>
        </Route>
      </Switch>
    </Suspense>
  );
}

function PublicRouter() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <BoundaryRoute path="/" component={Landing} />
        <BoundaryRoute path="/login" component={EnterpriseLogin} requiredMode="cloud" requiredFeature="sso" />
        <BoundaryRoute path="/enterprise-login" component={EnterpriseLogin} requiredMode="cloud" requiredFeature="sso" />
        <BoundaryRoute path="/enterprise-signup" component={EnterpriseSignup} requiredMode="cloud" requiredFeature="sso" />
        <BoundaryRoute path="/forgot-password" component={ForgotPassword} requiredMode="cloud" requiredFeature="sso" />
        <BoundaryRoute path="/reset-password" component={ResetPassword} requiredMode="cloud" requiredFeature="sso" />
        <BoundaryRoute path="/mfa-setup" component={MfaSetup} requiredMode="cloud" requiredFeature="mfa" />
        <BoundaryRoute path="/about" component={About} />
        <BoundaryRoute path="/features" component={Features} />
        <BoundaryRoute path="/pricing" component={Pricing} />
        <BoundaryRoute path="/contact" component={Contact} />
        <BoundaryRoute path="/privacy" component={Privacy} />
        <BoundaryRoute path="/terms" component={Terms} />
        <Route>
          <ErrorBoundary fallback={<RouteErrorFallback />}>
            <NotFound fullScreen />
          </ErrorBoundary>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppErrorHandler />
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

import { NetworkBanner } from "./components/NetworkBanner";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Not authenticated - show public routes without layout
  if (!isAuthenticated && !isLoading) {
    return (
      <>
        <NetworkBanner />
        <SkipNavigation />
        <main id="main-content" tabIndex={-1}>
          <PublicRouter />
        </main>
      </>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
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
