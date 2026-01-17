import type { ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building,
  Database,
  Brain,
  ShieldCheck,
  Shield,
  Flag,
  Lock,
  Folder,
  FolderOutput,
  Bot,
  Wrench,
  Target,
  History,
  Settings,
  Cloud,
  User,
  Wand2,
  Zap,
  Upload,
  CheckSquare,
  Eye
} from "lucide-react";

interface NavItem {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeColor?: string;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile", icon: Building, label: "Company Profile" },
  { href: "/storage", icon: Database, label: "Object Storage" },
  { href: "/ai-specialization", icon: Brain, label: "AI Specialization" },
];

const frameworkNavItems: NavItem[] = [
  { href: "/iso27001-framework", icon: ShieldCheck, label: "ISO 27001", badge: "12/14", badgeColor: "bg-accent" },
  { href: "/soc2-framework", icon: Shield, label: "SOC 2 Type 2", badge: "8/12", badgeColor: "bg-warning" },
  { href: "/fedramp-framework", icon: Flag, label: "FedRAMP", badge: "0/18", badgeColor: "bg-gray-400" },
  { href: "/nist-framework", icon: Lock, label: "NIST CSF", badge: "0/23", badgeColor: "bg-gray-400" },
];

const documentNavItems: NavItem[] = [
  { href: "/documents", icon: Folder, label: "All Documents" },
  { href: "/evidence-ingestion", icon: Upload, label: "Evidence Upload" },
  { href: "/export", icon: FolderOutput, label: "Export Center" },
];

const aiToolsNavItems: NavItem[] = [
  { href: "/ai-hub", icon: Zap, label: "AI Hub" },
  { href: "/ai-assistant", icon: Bot, label: "AI Assistant" },
  { href: "/ai-doc-generator", icon: Wand2, label: "AI Doc Generator" },
  { href: "/mcp-tools", icon: Wrench, label: "MCP Tools" },
];

const complianceNavItems: NavItem[] = [
  { href: "/gap-analysis", icon: Target, label: "Gap Analysis" },
  { href: "/control-approvals", icon: CheckSquare, label: "Control Approvals" },
  { href: "/auditor-workspace", icon: Eye, label: "Auditor Workspace" },
  { href: "/audit-trail", icon: History, label: "Audit Trail" },
];

const settingsNavItems: NavItem[] = [
  { href: "/cloud-integrations", icon: Cloud, label: "Cloud Integrations" },
  { href: "/admin", icon: Settings, label: "Admin Settings" },
  { href: "/profile/settings", icon: User, label: "User Settings" },
];

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  return (
    <Link href={item.href} data-testid={`nav-link-${item.href.replace(/\//g, '-').slice(1) || 'home'}`}>
      <a 
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
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard" || location === "/";
    return location.startsWith(href.split("?")[0]);
  };

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
          {settingsNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
