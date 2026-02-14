import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  aiToolsNavItems,
  complianceNavItems,
  documentNavItems,
  frameworkNavItems,
  getVisibleSettingsNavItems,
  mainNavItems,
  type NavItem,
} from "./nav-config";

interface MobileSidebarProps {
  onClose: () => void;
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavLink({ item, isActive, onClick }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      data-testid={`mobile-nav-${item.href.replace(/\//g, '-').slice(1) || 'home'}`}
      className={cn(
        "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm",
        isActive
          ? "text-primary bg-blue-50 dark:bg-blue-900/20 shadow-sm"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className={cn(
          "text-xs text-white px-2 py-1 rounded-full shadow-sm",
          item.badgeColor
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function MobileSidebar({ onClose }: MobileSidebarProps) {
  const [location] = useLocation();
  const { data: appConfig } = useQuery<{ deploymentMode: 'cloud' | 'local'; isProduction: boolean }>({
    queryKey: ['/api/config'],
    queryFn: async () => {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to load app config');
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard" || location === "/";
    return location.startsWith(href.split("?")[0]);
  };

  const isLocalMode = appConfig?.deploymentMode === "local";
  const visibleSettingsNavItems = getVisibleSettingsNavItems(!!isLocalMode);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.38 2.21a.75.75 0 01.24 0l7 2.5a.75.75 0 01.5.7v11.84a.75.75 0 01-.5.7l-7 2.5a.75.75 0 01-.48 0l-7-2.5a.75.75 0 01-.5-.7V5.41a.75.75 0 01.5-.7l7-2.5zM10 3.73L4.25 5.75v8.5L10 16.27l5.75-2.02v-8.5L10 3.73z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">CyberDocGen</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-mobile-sidebar"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Main</h2>
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onClose} />
          ))}
        </div>
        
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Compliance Frameworks</h2>
          {frameworkNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onClose} />
          ))}
        </div>
        
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Documents</h2>
          {documentNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onClose} />
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">AI & Tools</h2>
          {aiToolsNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onClose} />
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Compliance</h2>
          {complianceNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onClose} />
          ))}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Settings</h2>
          {visibleSettingsNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onClose} />
          ))}
        </div>
      </nav>
    </div>
  );
}
