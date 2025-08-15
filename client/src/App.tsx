import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import { ObjectStorageManager } from "./components/ObjectStorageManager";
import { IndustrySpecialization } from "./components/ai/IndustrySpecialization";
import GapAnalysis from "./pages/gap-analysis";
import Layout from "./components/layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/profile" component={CompanyProfile} />
          <Route path="/enhanced-profile" component={EnhancedCompanyProfile} />
          <Route path="/workspace" component={() => <DocumentWorkspace organizationId="default" />} />
          <Route path="/documents" component={Documents} />
          <Route path="/gap-analysis" component={GapAnalysis} />
          <Route path="/audit-trail" component={AuditTrail} />
          <Route path="/document-versions/:id" component={(props: any) => <DocumentVersions documentId={props.params.id} documentTitle="Document" />} />
          <Route path="/user-profile" component={UserProfile} />
          <Route path="/organizations" component={OrganizationSetup} />
          <Route path="/storage" component={ObjectStorageManager} />
          <Route path="/ai-specialization" component={IndustrySpecialization} />
        </>
      )}
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

  if (isLoading || !isAuthenticated) {
    return <Router />;
  }

  return (
    <Layout>
      <Router />
    </Layout>
  );
}

export default App;
