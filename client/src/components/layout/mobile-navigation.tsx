import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building, 
  FileText, 
  Folder
} from "lucide-react";
import type { ComponentType } from "react";

interface MobileNavigationProps {
  className?: string;
}

interface NavItem {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  shortLabel: string;
}

const navigationItems: NavItem[] = [
  { 
    href: "/dashboard", 
    icon: LayoutDashboard, 
    label: "Dashboard",
    shortLabel: "Home"
  },
  { 
    href: "/profile", 
    icon: Building, 
    label: "Profile",
    shortLabel: "Profile"
  },
  { 
    href: "/documents", 
    icon: FileText, 
    label: "Documents",
    shortLabel: "Docs"
  },
  { 
    href: "/workspace", 
    icon: Folder, 
    label: "Workspace",
    shortLabel: "Work"
  },
];

export default function MobileNavigation({ className }: MobileNavigationProps) {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/dashboard" || location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden",
      "safe-area-inset-bottom",
      className
    )}>
      <div className="flex items-center justify-around px-2 py-1">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-testid={`mobile-nav-${item.shortLabel.toLowerCase()}`}
            className={cn(
              "flex flex-col items-center space-y-1 h-auto py-2 px-3 rounded-lg transition-colors min-w-0",
              isActive(item.href)
                ? "text-primary bg-primary/10"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs font-medium truncate max-w-12 sm:max-w-16">
              {item.shortLabel}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
