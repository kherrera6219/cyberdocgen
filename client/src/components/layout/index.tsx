import React, { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNavigation from "./mobile-navigation";
import { OfflineIndicator } from "./offline-indicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { TempUserBanner } from "@/components/TemporaryLoginDialog";
import { LocalModeBanner } from "@/components/local-mode/LocalModeBanner";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { SkipNavigation } from "@/components/SkipNavigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isOnline } = useOnlineStatus();

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <SkipNavigation />
      <LocalModeBanner />
      <TempUserBanner />
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar - Hidden on mobile/tablet */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 w-full lg:ml-0">
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto transition-colors pt-16 sm:pt-20 pb-16 lg:pb-0"
          >
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-full space-y-4">
              {!isOnline && <OfflineIndicator />}
              <Breadcrumbs className="mb-2" />
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation - Hidden on desktop */}
          <MobileNavigation />
        </div>
      </div>
    </div>
  );
}
