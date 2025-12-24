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
  "/organizations": "Organizations",
  "/storage": "Object Storage",
  "/ai-specialization": "AI Specialization",
  "/iso27001-framework": "ISO 27001",
  "/soc2-framework": "SOC 2 Type 2",
  "/fedramp-framework": "FedRAMP",
  "/nist-framework": "NIST CSF",
  "/evidence-ingestion": "Evidence Upload",
  "/export": "Export Center",
  "/ai-hub": "AI Hub",
  "/ai-assistant": "AI Assistant",
  "/ai-doc-generator": "AI Doc Generator",
  "/mcp-tools": "MCP Tools",
  "/gap-analysis": "Gap Analysis",
  "/control-approvals": "Control Approvals",
  "/auditor-workspace": "Auditor Workspace",
  "/cloud-integrations": "Cloud Integrations",
  "/admin": "Admin Settings",
  "/profile/settings": "User Settings",
  "/login": "Login",
  "/enterprise-login": "Enterprise Login",
  "/enterprise-signup": "Enterprise Signup",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
  "/mfa-setup": "MFA Setup",
  "/about": "About",
  "/features": "Features",
  "/pricing": "Pricing",
  "/contact": "Contact",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const [location] = useLocation();

  const breadcrumbItems = items || generateBreadcrumbs(location);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center space-x-1 text-sm text-muted-foreground ${className || ""}`}
      data-testid="nav-breadcrumbs"
    >
      <Link href="/dashboard">
        <a className="flex items-center hover:text-foreground transition-colors" data-testid="breadcrumb-home">
          <Home className="h-4 w-4" />
        </a>
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          {item.href && !item.current ? (
            <Link href={item.href}>
              <a 
                className="hover:text-foreground transition-colors"
                data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </a>
            </Link>
          ) : (
            <span 
              className={item.current ? "text-foreground font-medium" : ""}
              aria-current={item.current ? "page" : undefined}
              data-testid={`breadcrumb-current-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
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

  if (location === '/' || location === '/dashboard') {
    return [];
  }

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
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
  if (segment.match(/^[a-f0-9-]{36}$/)) {
    return "Detail";
  }
  
  if (segment.match(/^\d+$/)) {
    return `Item ${segment}`;
  }
  
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default Breadcrumbs;
