import type { ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building, 
  Tag, 
  Shield, 
  Flag, 
  Lock, 
  Folder, 
  FolderOutput,
  Database,
  Brain,
  Upload,
  Zap,
  Bot,
  Sparkles,
  Wrench,
  Search,
  CheckSquare,
  Eye,
  History,
  Cloud,
  Settings,
  User,
  KeyRound,
  X
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
  { href: "/iso27001-framework", icon: Tag, label: "ISO 27001", badge: "12/14", badgeColor: "bg-accent" },
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
  { href: "/ai-doc-generator", icon: Sparkles, label: "AI Doc Generator" },
  { href: "/mcp-tools", icon: Wrench, label: "MCP Tools" },
];

const complianceNavItems: NavItem[] = [
  { href: "/gap-analysis", icon: Search, label: "Gap Analysis" },
  { href: "/control-approvals", icon: CheckSquare, label: "Control Approvals" },
  { href: "/auditor-workspace", icon: Eye, label: "Auditor Workspace" },
  { href: "/audit-trail", icon: History, label: "Audit Trail" },
];

const settingsNavItems: NavItem[] = [
  { href: "/api-keys", icon: KeyRound, label: "AI API Keys" },
  { href: "/cloud-integrations", icon: Cloud, label: "Cloud Integrations" },
  { href: "/local-settings", icon: Settings, label: "Local Settings" },
  { href: "/admin", icon: Settings, label: "Admin Settings" },
  { href: "/profile/settings", icon: User, label: "User Settings" },
];

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
    <Link href={item.href} data-testid={`mobile-nav-${item.href.replace(/\//g, '-').slice(1) || 'home'}`}>
      <a 
        className={cn(
          "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm",
          isActive
            ? "text-primary bg-blue-50 dark:bg-blue-900/20 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        onClick={onClick}
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
      </a>
    </Link>
  );
}

export default function MobileSidebar({ onClose }: MobileSidebarProps) {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard" || location === "/";
    return location.startsWith(href.split("?")[0]);
  };

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
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-mobile-sidebar">
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
          {settingsNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onClose} />
          ))}
        </div>
      </nav>
    </div>
  );
}
