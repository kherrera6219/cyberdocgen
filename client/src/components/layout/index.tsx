import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNavigation from "./mobile-navigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 w-full lg:ml-0">
        <Header />
        <main className="flex-1 overflow-y-auto transition-colors pt-16 sm:pt-20 pb-16 lg:pb-0">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-full">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation - Hidden on desktop */}
        <MobileNavigation />
      </div>
    </div>
  );
}