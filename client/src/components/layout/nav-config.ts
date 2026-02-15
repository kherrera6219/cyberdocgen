import type { ComponentType } from "react";
import {
  Bot,
  Brain,
  Building,
  CheckSquare,
  Cloud,
  Database,
  Eye,
  Flag,
  Folder,
  FolderOutput,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  Settings,
  Shield,
  ShieldCheck,
  Target,
  Upload,
  User,
  Wand2,
  Wrench,
  Zap,
} from "lucide-react";
import type { RuntimeFeatures, DeploymentMode } from "@/lib/runtimeConfig";

export interface NavItem {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeColor?: string;
}

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile", icon: Building, label: "Company Profile" },
  { href: "/storage", icon: Database, label: "Object Storage" },
  { href: "/ai-specialization", icon: Brain, label: "AI Specialization" },
];

export const frameworkNavItems: NavItem[] = [
  { href: "/iso27001-framework", icon: ShieldCheck, label: "ISO 27001", badge: "12/14", badgeColor: "bg-accent" },
  { href: "/soc2-framework", icon: Shield, label: "SOC 2 Type 2", badge: "8/12", badgeColor: "bg-warning" },
  { href: "/fedramp-framework", icon: Flag, label: "FedRAMP", badge: "0/18", badgeColor: "bg-gray-400" },
  { href: "/nist-framework", icon: Lock, label: "NIST CSF", badge: "0/23", badgeColor: "bg-gray-400" },
];

export const documentNavItems: NavItem[] = [
  { href: "/documents", icon: Folder, label: "All Documents" },
  { href: "/evidence-ingestion", icon: Upload, label: "Evidence Upload" },
  { href: "/connectors", icon: Cloud, label: "Connectors Hub" },
  { href: "/export", icon: FolderOutput, label: "Export Center" },
];

export const aiToolsNavItems: NavItem[] = [
  { href: "/ai-hub", icon: Zap, label: "AI Hub" },
  { href: "/ai-assistant", icon: Bot, label: "AI Assistant" },
  { href: "/ai-doc-generator", icon: Wand2, label: "AI Doc Generator" },
  { href: "/mcp-tools", icon: Wrench, label: "MCP Tools" },
];

export const complianceNavItems: NavItem[] = [
  { href: "/gap-analysis", icon: Target, label: "Gap Analysis" },
  { href: "/control-approvals", icon: CheckSquare, label: "Control Approvals" },
  { href: "/auditor-workspace", icon: Eye, label: "Auditor Workspace" },
  { href: "/audit-trail", icon: History, label: "Audit Trail" },
];

export const settingsNavItems: NavItem[] = [
  { href: "/api-keys", icon: KeyRound, label: "AI API Keys" },
  { href: "/cloud-integrations", icon: Cloud, label: "Cloud Integrations" },
  { href: "/local-settings", icon: Settings, label: "Local Settings" },
  { href: "/admin", icon: Settings, label: "Admin Settings" },
  { href: "/profile/settings", icon: User, label: "User Settings" },
];

interface SettingsVisibilityContext {
  deploymentMode: DeploymentMode;
  features: RuntimeFeatures;
}

export function getVisibleSettingsNavItems(context: SettingsVisibilityContext) {
  const isLocalMode = context.deploymentMode === "local";

  return settingsNavItems.filter((item) => {
    if (item.href === "/api-keys" || item.href === "/local-settings") {
      return isLocalMode;
    }

    if (item.href === "/cloud-integrations") {
      return !isLocalMode;
    }

    if (item.href === "/admin") {
      return context.features.userManagement || context.features.organizationManagement;
    }

    return true;
  });
}
