import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building, 
  FileText, 
  Settings, 
  Menu, 
  X,
  Home,
  Folder
} from "lucide-react";

interface MobileNavigationProps {
  className?: string;
}

const navigationItems = [
  { 
    href: "/", 
    icon: Home, 
    label: "Home",
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
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden",
      "safe-area-inset-bottom", // For devices with home indicators
      className
    )}>
      <div className="flex items-center justify-around px-2 py-1">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center space-y-1 h-auto py-2 px-3 rounded-lg transition-colors min-w-0",
                isActive(item.href)
                  ? "text-primary bg-primary/10"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-medium truncate max-w-12 sm:max-w-16">
                {item.shortLabel}
              </span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}