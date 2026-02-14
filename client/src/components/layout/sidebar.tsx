import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  aiToolsNavItems,
  complianceNavItems,
  documentNavItems,
  frameworkNavItems,
  getVisibleSettingsNavItems,
  mainNavItems,
  type NavItem,
} from "./nav-config";

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      data-testid={`nav-link-${item.href.replace(/\//g, '-').slice(1) || 'home'}`}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm",
        isActive
          ? "text-primary bg-blue-50 dark:bg-blue-900/20 shadow-sm"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.label}
      {item.badge && (
        <span className={cn(
          "ml-auto text-xs text-white px-2 py-1 rounded-full shadow-sm",
          item.badgeColor
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
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
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-colors">
      <nav className="p-4 space-y-2">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Main</h2>
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Compliance Frameworks</h2>
          {frameworkNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Documents</h2>
          {documentNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">AI & Tools</h2>
          {aiToolsNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Compliance</h2>
          {complianceNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Settings</h2>
          {visibleSettingsNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
