import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Document } from "@shared/schema";
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
  isCollapsed: boolean;
}

function getBadgeStyle(badge: string) {
  // Numeric count badges (e.g. "12/14", "8/12", "0/18")
  if (badge.includes("/")) {
    const [num, total] = badge.split("/").map(Number);
    const percent = total > 0 ? (num / total) * 100 : 0;
    if (percent === 100) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full";
    }
    if (percent > 0) {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full";
    }
    return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-250 dark:border-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full";
  }

  // AI / Twin / Gated / New feature badges
  const isAI = badge === "AI" || badge === "Twin";
  if (isAI) {
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm";
  }
  
  if (badge === "New") {
    return "bg-accent/10 text-accent-foreground dark:text-accent border border-accent/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm";
  }

  if (badge === "Gated") {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm";
  }

  return "bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider";
}

function NavLink({ item, isActive, isCollapsed }: NavLinkProps) {
  const content = (
    <Link
      href={item.href}
      data-testid={`nav-link-${item.href.replace(/\//g, '-').slice(1) || 'home'}`}
      className={cn(
        "flex items-center rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm",
        isCollapsed ? "justify-center p-2.5" : "px-3 py-2 text-sm font-medium",
        isActive
          ? "text-primary bg-blue-50 dark:bg-blue-900/20 shadow-sm"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <item.icon className={cn("w-5 h-5", isCollapsed ? "" : "mr-3")} />
      {!isCollapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className={cn("ml-auto flex-shrink-0", getBadgeStyle(item.badge))}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span className="font-semibold text-xs">{item.label}</span>
          {item.badge && (
            <span className={getBadgeStyle(item.badge)}>
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default function Sidebar() {
  const [location] = useLocation();
  const { config } = useRuntimeConfig();

  // Collapsible sidebar state backed by localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  const { data: documentsResponse } = useQuery<Document[] | { success?: boolean; data?: Document[] }>({
    queryKey: ["/api/documents"],
  });

  const documents = useMemo(() => {
    if (Array.isArray(documentsResponse)) return documentsResponse;
    if (documentsResponse && Array.isArray(documentsResponse.data)) return documentsResponse.data;
    return [];
  }, [documentsResponse]);

  const dynamicFrameworkNavItems = useMemo(() => {
    return frameworkNavItems.map(item => {
      let code = "";
      let total = 0;
      if (item.href === "/iso27001-framework") { code = "ISO27001"; total = 14; }
      else if (item.href === "/soc2-framework") { code = "SOC2"; total = 12; }
      else if (item.href === "/fedramp-framework") { code = "FedRAMP"; total = 18; }
      else if (item.href === "/nist-framework") { code = "NIST"; total = 23; }

      if (code) {
        const completedCount = documents.filter(doc => doc.framework === code && doc.status === "complete").length;
        return {
          ...item,
          badge: `${completedCount}/${total}`,
        };
      }
      return item;
    });
  }, [documents]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard" || location === "/";
    return location.startsWith(href.split("?")[0]);
  };

  const visibleSettingsNavItems = getVisibleSettingsNavItems({
    deploymentMode: config.deploymentMode,
    features: config.features,
  });

  return (
    <aside 
      className={cn(
        "h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden transition-all duration-300 relative flex flex-col justify-between",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1">
        {/* Toggle Collapse Header */}
        <div className={cn("p-4 flex items-center pt-24", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Navigation
            </span>
          )}
          <button 
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="px-3 pb-6 space-y-4">
          {/* Main items */}
          <div>
            {!isCollapsed && <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Main</h2>}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>

          {/* Compliance Frameworks */}
          <div>
            {!isCollapsed && <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Frameworks</h2>}
            <div className="space-y-1">
              {dynamicFrameworkNavItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            {!isCollapsed && <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Documents</h2>}
            <div className="space-y-1">
              {documentNavItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>

          {/* AI Copilots */}
          <div>
            {!isCollapsed && <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">AI Copilots & Hub</h2>}
            <div className="space-y-1">
              {aiToolsNavItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>

          {/* Compliance Workflows */}
          <div>
            {!isCollapsed && <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Compliance Workflows</h2>}
            <div className="space-y-1">
              {complianceNavItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            {!isCollapsed && <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-2">Settings</h2>}
            <div className="space-y-1">
              {visibleSettingsNavItems.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} isCollapsed={isCollapsed} />
              ))}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
