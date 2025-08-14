import { useEffect, useState } from "react";
import Header from "./layout/header";
import Sidebar from "./layout/sidebar";
import { WelcomeWizard } from "./onboarding/welcome-wizard";
import { ErrorBoundary } from "./error-boundary";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { useUserPreferences } from "@/hooks/use-storage";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { value: preferences, setValue: setPreferences, loading } = useUserPreferences();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && !preferences.hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [loading, preferences.hasSeenOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setPreferences(prev => ({ ...prev, hasSeenOnboarding: true }));
  };

  // Show onboarding wizard for first-time users
  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <WelcomeWizard onComplete={handleOnboardingComplete} />
      </ErrorBoundary>
    );
  }

  // Regular app layout
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex h-screen pt-14 sm:pt-16">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:flex">
            <Sidebar />
          </div>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto w-full lg:w-auto">
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full px-4">
                  <div className="text-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Something went wrong
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Please refresh the page to continue
                    </p>
                  </div>
                </div>
              }
            >
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Breadcrumb Navigation */}
                <div className="mb-6">
                  <Breadcrumbs />
                </div>
                {children}
              </div>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}