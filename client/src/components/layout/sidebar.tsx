import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building, 
  Tag, 
  Shield, 
  Flag, 
  Lock, 
  Folder, 
  FolderOutput 
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeColor?: string;
}

const mainNavItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile", icon: Building, label: "Company Profile" },
];

const frameworkNavItems: NavItem[] = [
  { href: "/documents?framework=ISO27001", icon: Tag, label: "ISO 27001", badge: "12/14", badgeColor: "bg-accent" },
  { href: "/documents?framework=SOC2", icon: Shield, label: "SOC 2 Type 2", badge: "8/12", badgeColor: "bg-warning" },
  { href: "/documents?framework=FedRAMP", icon: Flag, label: "FedRAMP", badge: "0/18", badgeColor: "bg-gray-400" },
  { href: "/documents?framework=NIST", icon: Lock, label: "NIST CSF", badge: "0/23", badgeColor: "bg-gray-400" },
];

const documentNavItems: NavItem[] = [
  { href: "/documents", icon: Folder, label: "All Documents" },
  { href: "/export", icon: FolderOutput, label: "Export Center" },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href.split("?")[0]);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Main</h2>
          {mainNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                isActive(item.href)
                  ? "text-primary bg-blue-50"
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compliance Frameworks</h2>
          {frameworkNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                isActive(item.href)
                  ? "text-primary bg-blue-50"
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
                {item.badge && (
                  <span className={cn(
                    "ml-auto text-xs text-white px-2 py-1 rounded-full",
                    item.badgeColor
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Documents</h2>
          {documentNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                isActive(item.href)
                  ? "text-primary bg-blue-50"
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}