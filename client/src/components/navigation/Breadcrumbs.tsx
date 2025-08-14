import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard", 
  "/profile": "Company Profile",
  "/enhanced-profile": "Enhanced Profile",
  "/workspace": "Document Workspace",
  "/documents": "Documents",
  "/audit-trail": "Audit Trail",
  "/user-profile": "User Profile",
  "/organizations": "Organizations"
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const [location] = useLocation();

  // Generate breadcrumbs from current route if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(location);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      <Link href="/" className="flex items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href && !item.current ? (
            <Link 
              href={item.href} 
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.current ? "text-gray-900 dark:text-gray-100 font-medium" : ""}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbs(location: string): BreadcrumbItem[] {
  const pathSegments = location.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Home unless we're already there
  if (location !== '/') {
    breadcrumbs.push({ label: "Home", href: "/" });
  }

  // Build breadcrumbs from path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Get label from predefined labels or format segment
    const label = routeLabels[currentPath] || formatSegment(segment);
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast
    });
  });

  return breadcrumbs;
}

function formatSegment(segment: string): string {
  // Handle dynamic segments (IDs, etc.)
  if (segment.match(/^[a-f0-9-]{36}$/)) {
    return "Detail";
  }
  
  // Format kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}