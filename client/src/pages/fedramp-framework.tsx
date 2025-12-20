import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield,
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Users,
  Building,
  Cpu,
  Lock,
  ChevronRight,
  Filter,
  FileCheck,
  Calendar,
  Server,
  Eye,
  Key,
  AlertTriangle,
  Wrench,
  HardDrive,
  MapPin,
  ClipboardList,
  Briefcase,
  UserCheck,
  Target,
  ShoppingCart,
  Wifi,
  Bug,
  Link,
  Unlink,
  Paperclip,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FrameworkSpreadsheet } from "@/components/compliance/FrameworkSpreadsheet";
import { Table as TableIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CompanyProfile } from "@shared/schema";

// Evidence file interface for type safety (matches ISO 27001 pattern)
interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string | null;
  createdAt: string;
  metadata: {
    tags?: string[];
    description?: string;
  } | null;
}

type ControlStatus = "not_started" | "in_progress" | "implemented" | "not_applicable";
type EvidenceStatus = "none" | "partial" | "complete";
type Baseline = "low" | "moderate" | "high";

interface Control {
  id: string;
  name: string;
  description: string;
  baseline: Baseline;
  status: ControlStatus;
  evidenceStatus: EvidenceStatus;
  lastUpdated: string | null;
}

interface ControlFamily {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  controls: Control[];
}

const initialControlFamilies: ControlFamily[] = [
  {
    id: "AC",
    name: "Access Control",
    description: "Controls for managing access to systems and information",
    icon: Lock,
    controls: [
      { id: "AC-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an access control policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-2", name: "Account Management", description: "Manage system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-2(1)", name: "Account Management - Automated System Account Management", description: "Support the management of system accounts using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-2(2)", name: "Account Management - Automated Temporary and Emergency Account Management", description: "Automatically remove or disable temporary and emergency accounts.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-2(3)", name: "Account Management - Disable Accounts", description: "Disable accounts within specified time period when account is no longer associated with a user.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-2(4)", name: "Account Management - Automated Audit Actions", description: "Automatically audit account creation, modification, enabling, disabling, and removal actions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-2(12)", name: "Account Management - Account Monitoring for Atypical Usage", description: "Monitor system accounts for atypical usage and report to designated personnel.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-3", name: "Access Enforcement", description: "Enforce approved authorizations for logical access to information and system resources.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-4", name: "Information Flow Enforcement", description: "Enforce approved authorizations for controlling the flow of information within the system and between connected systems.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-5", name: "Separation of Duties", description: "Separate duties of individuals to prevent malevolent activity without collusion.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-6", name: "Least Privilege", description: "Employ the principle of least privilege, allowing only authorized accesses for users which are necessary to accomplish assigned tasks.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-6(1)", name: "Least Privilege - Authorize Access to Security Functions", description: "Explicitly authorize access to security functions and security-relevant information.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-6(2)", name: "Least Privilege - Non-Privileged Access for Nonsecurity Functions", description: "Require users to access non-security functions with non-privileged accounts.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-6(5)", name: "Least Privilege - Privileged Accounts", description: "Restrict privileged accounts to designated personnel.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-6(9)", name: "Least Privilege - Log Use of Privileged Functions", description: "Log the execution of privileged functions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-6(10)", name: "Least Privilege - Prohibit Non-Privileged Users from Executing Privileged Functions", description: "Prevent non-privileged users from executing privileged functions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-7", name: "Unsuccessful Logon Attempts", description: "Enforce a limit of consecutive invalid logon attempts and take actions when exceeded.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-8", name: "System Use Notification", description: "Display system use notification message before granting access.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-10", name: "Concurrent Session Control", description: "Limit the number of concurrent sessions for each account.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-11", name: "Device Lock", description: "Prevent further access by initiating a device lock after a period of inactivity.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-11(1)", name: "Device Lock - Pattern-Hiding Displays", description: "Conceal via device lock information previously visible on the display.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-12", name: "Session Termination", description: "Automatically terminate a user session after defined conditions or trigger events.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-14", name: "Permitted Actions without Identification or Authentication", description: "Identify and document user actions that can be performed without identification or authentication.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-17", name: "Remote Access", description: "Establish and document usage restrictions for remote access to the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-17(1)", name: "Remote Access - Monitoring and Control", description: "Employ automated mechanisms to monitor and control remote access methods.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-17(2)", name: "Remote Access - Protection of Confidentiality and Integrity", description: "Employ cryptographic mechanisms to protect the confidentiality and integrity of remote access sessions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-17(3)", name: "Remote Access - Managed Access Control Points", description: "Route remote accesses through authorized and managed network access control points.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-17(4)", name: "Remote Access - Privileged Commands and Access", description: "Authorize, monitor, and control execution of privileged commands via remote access.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-18", name: "Wireless Access", description: "Establish usage restrictions and implementation guidance for wireless access.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-18(1)", name: "Wireless Access - Authentication and Encryption", description: "Protect wireless access using authentication and encryption.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-19", name: "Access Control for Mobile Devices", description: "Establish usage restrictions and implementation guidance for mobile devices.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-19(5)", name: "Access Control for Mobile Devices - Full Device or Container-Based Encryption", description: "Employ full-device encryption or container-based encryption to protect confidentiality and integrity of information on mobile devices.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-20", name: "Use of External Systems", description: "Establish terms and conditions for authorized use of external systems.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-20(1)", name: "Use of External Systems - Limits on Authorized Use", description: "Permit authorized individuals to use an external system only when the organization verifies required controls are in place.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-20(2)", name: "Use of External Systems - Portable Storage Devices - Restricted Use", description: "Restrict the use of organization-controlled portable storage devices by authorized individuals on external systems.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AC-22", name: "Publicly Accessible Content", description: "Designate individuals authorized to make information publicly accessible and review content for nonpublic information.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "AU",
    name: "Audit and Accountability",
    description: "Controls for auditing and maintaining accountability of system activities",
    icon: Eye,
    controls: [
      { id: "AU-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an audit and accountability policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-2", name: "Event Logging", description: "Identify the types of events that the system is capable of logging.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-2(3)", name: "Event Logging - Reviews and Updates", description: "Review and update the list of organization-defined auditable events.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-3", name: "Content of Audit Records", description: "Ensure audit records contain information needed for effective analysis.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-3(1)", name: "Content of Audit Records - Additional Audit Information", description: "Generate audit records containing additional, more detailed information.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-4", name: "Audit Log Storage Capacity", description: "Allocate audit log storage capacity to accommodate audit log retention requirements.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-5", name: "Response to Audit Logging Process Failures", description: "Alert personnel or roles in the event of an audit logging process failure.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-6", name: "Audit Record Review, Analysis, and Reporting", description: "Review and analyze system audit records for indications of inappropriate or unusual activity.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-6(1)", name: "Audit Record Review - Automated Process Integration", description: "Integrate audit record review, analysis, and reporting processes using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-6(3)", name: "Audit Record Review - Correlate Audit Record Repositories", description: "Analyze and correlate audit records across different repositories to gain organization-wide situational awareness.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-7", name: "Audit Record Reduction and Report Generation", description: "Provide and implement an audit record reduction and report generation capability.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-7(1)", name: "Audit Record Reduction - Automatic Processing", description: "Provide and implement the capability to process, sort, and search audit records for events of interest.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-8", name: "Time Stamps", description: "Use internal system clocks to generate time stamps for audit records.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-8(1)", name: "Time Stamps - Synchronization with Authoritative Time Source", description: "Compare internal system clocks with authoritative time source and synchronize.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-9", name: "Protection of Audit Information", description: "Protect audit information and audit logging tools from unauthorized access, modification, and deletion.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-9(2)", name: "Protection of Audit Information - Store on Separate Physical Systems or Components", description: "Store audit records on a physically different system or system component than the system being audited.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-9(4)", name: "Protection of Audit Information - Access by Subset of Privileged Users", description: "Authorize access to management of audit logging functionality to only a subset of privileged users.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-11", name: "Audit Record Retention", description: "Retain audit records for a defined time period to provide support for after-the-fact investigations.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-12", name: "Audit Record Generation", description: "Provide audit record generation capability for auditable events defined in AU-2.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-12(1)", name: "Audit Record Generation - System-Wide and Time-Correlated Audit Trail", description: "Compile audit records from system components into a system-wide audit trail that is time-correlated.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AU-12(3)", name: "Audit Record Generation - Changes by Authorized Individuals", description: "Provide and implement the capability for authorized individuals to change the logging behavior on components based on criteria.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "AT",
    name: "Awareness and Training",
    description: "Controls for security awareness and training programs",
    icon: Users,
    controls: [
      { id: "AT-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a security awareness and training policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-2", name: "Literacy Training and Awareness", description: "Provide security and privacy literacy training to system users.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-2(1)", name: "Literacy Training - Practical Exercises", description: "Provide practical exercises in literacy training that simulate events and incidents.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-2(2)", name: "Literacy Training - Insider Threat", description: "Provide literacy training on recognizing and reporting potential indicators of insider threat.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-3", name: "Role-based Training", description: "Provide role-based security and privacy training to personnel with assigned security roles.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-3(3)", name: "Role-based Training - Practical Exercises", description: "Provide practical exercises in security and privacy training that reinforce training objectives.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "AT-4", name: "Training Records", description: "Document and monitor individual security and privacy training activities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "CA",
    name: "Assessment, Authorization, and Monitoring",
    description: "Controls for security assessment and continuous monitoring",
    icon: ClipboardList,
    controls: [
      { id: "CA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a security assessment and authorization policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-2", name: "Control Assessments", description: "Develop a control assessment plan and assess the controls in the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-2(1)", name: "Control Assessments - Independent Assessors", description: "Employ independent assessors or assessment teams to conduct control assessments.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-2(2)", name: "Control Assessments - Specialized Assessments", description: "Include as part of control assessments specialized assessments such as penetration testing and monitoring.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-3", name: "Information Exchange", description: "Approve and manage the exchange of information between the system and other systems.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-3(5)", name: "Information Exchange - Restrictions on Commercial or Government Services", description: "Restrict the use of commercial or government-owned cloud services to approved providers and services.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-5", name: "Plan of Action and Milestones", description: "Develop a plan of action and milestones for the system to document remediation actions.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-6", name: "Authorization", description: "Assign a senior official to authorize the system before commencing operations.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-7", name: "Continuous Monitoring", description: "Develop and implement a continuous monitoring strategy and program.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-7(1)", name: "Continuous Monitoring - Independent Assessment", description: "Employ independent assessors or assessment teams to monitor the controls in the system on an ongoing basis.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CA-9", name: "Internal System Connections", description: "Authorize internal connections of system components or classes of components to the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "CM",
    name: "Configuration Management",
    description: "Controls for configuration management of information systems",
    icon: Server,
    controls: [
      { id: "CM-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a configuration management policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-2", name: "Baseline Configuration", description: "Develop, document, and maintain a current baseline configuration of the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-2(1)", name: "Baseline Configuration - Reviews and Updates", description: "Review and update the baseline configuration on a defined frequency.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-2(2)", name: "Baseline Configuration - Automation Support for Accuracy and Currency", description: "Maintain the currency, completeness, accuracy, and availability of the baseline configuration using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-2(3)", name: "Baseline Configuration - Retention of Previous Configurations", description: "Retain previous versions of baseline configurations to support rollback.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-2(7)", name: "Baseline Configuration - Configure Systems and Components for High-Risk Areas", description: "Issue systems or system components with enhanced security configurations to individuals traveling to locations deemed high risk.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-3", name: "Configuration Change Control", description: "Determine and document the types of changes to the system that are configuration-controlled.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-3(1)", name: "Configuration Change Control - Automated Documentation and Notification", description: "Use automated mechanisms to document proposed changes and notify designated approval authorities.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-4", name: "Impact Analyses", description: "Analyze changes to the system to determine potential security and privacy impacts.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-4(1)", name: "Impact Analyses - Separate Test Environments", description: "Analyze changes to the system in a separate test environment before implementation in an operational environment.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-5", name: "Access Restrictions for Change", description: "Define, document, approve, and enforce physical and logical access restrictions associated with changes to the system.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-6", name: "Configuration Settings", description: "Establish and document configuration settings for components employed within the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-6(1)", name: "Configuration Settings - Automated Management, Application, and Verification", description: "Manage, apply, and verify configuration settings using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-7", name: "Least Functionality", description: "Configure the system to provide only mission-essential capabilities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-7(1)", name: "Least Functionality - Periodic Review", description: "Review the system on a defined frequency to identify and disable unnecessary functions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-8", name: "System Component Inventory", description: "Develop and document an inventory of system components.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-8(1)", name: "System Component Inventory - Updates During Installation and Removal", description: "Update the inventory of system components as part of component installations, removals, and updates.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-8(3)", name: "System Component Inventory - Automated Unauthorized Component Detection", description: "Detect the presence of unauthorized hardware, software, and firmware components within the system using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-10", name: "Software Usage Restrictions", description: "Use software and associated documentation in accordance with contract agreements and copyright laws.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CM-11", name: "User-Installed Software", description: "Establish policies governing the installation of software by users.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "CP",
    name: "Contingency Planning",
    description: "Controls for contingency planning and business continuity",
    icon: AlertTriangle,
    controls: [
      { id: "CP-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a contingency planning policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-2", name: "Contingency Plan", description: "Develop a contingency plan for the system that addresses contingency roles and responsibilities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-2(1)", name: "Contingency Plan - Coordinate with Related Plans", description: "Coordinate contingency plan development with organizational elements responsible for related plans.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-2(3)", name: "Contingency Plan - Resume Mission and Business Functions", description: "Plan for the resumption of mission and business functions within a defined time period of contingency plan activation.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-2(8)", name: "Contingency Plan - Identify Critical Assets", description: "Identify critical system assets supporting mission and business functions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-3", name: "Contingency Training", description: "Provide contingency training to system users consistent with assigned roles and responsibilities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-3(1)", name: "Contingency Training - Simulated Events", description: "Incorporate simulated events into contingency training to facilitate effective response by personnel in crisis situations.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-4", name: "Contingency Plan Testing", description: "Test the contingency plan for the system to determine effectiveness and readiness.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-4(1)", name: "Contingency Plan Testing - Coordinate with Related Plans", description: "Coordinate contingency plan testing with organizational elements responsible for related plans.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-6", name: "Alternate Storage Site", description: "Establish an alternate storage site and implement necessary agreements to permit storage and retrieval of system backup information.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-6(1)", name: "Alternate Storage Site - Separation from Primary Site", description: "Identify an alternate storage site that is sufficiently separated from the primary storage site.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-6(3)", name: "Alternate Storage Site - Accessibility", description: "Identify potential accessibility problems to the alternate storage site in the event of an area-wide disruption or disaster.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-7", name: "Alternate Processing Site", description: "Establish an alternate processing site and implement necessary agreements to permit transfer and resumption of operations.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-7(1)", name: "Alternate Processing Site - Separation from Primary Site", description: "Identify an alternate processing site that is sufficiently separated from the primary processing site.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-7(2)", name: "Alternate Processing Site - Accessibility", description: "Identify potential accessibility problems to the alternate processing site in the event of an area-wide disruption or disaster.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-7(3)", name: "Alternate Processing Site - Priority of Service", description: "Develop alternate processing site agreements that contain priority-of-service provisions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-8", name: "Telecommunications Services", description: "Establish alternate telecommunications services including necessary agreements to permit resumption of operations.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-8(1)", name: "Telecommunications Services - Priority of Service Provisions", description: "Develop primary and alternate telecommunications service agreements that contain priority-of-service provisions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-8(2)", name: "Telecommunications Services - Single Points of Failure", description: "Obtain alternate telecommunications services to reduce the likelihood of sharing a single point of failure with primary telecommunications services.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-9", name: "System Backup", description: "Conduct backups of user-level and system-level information contained in the system.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-9(1)", name: "System Backup - Testing for Reliability and Integrity", description: "Test backup information to verify media reliability and information integrity.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "CP-10", name: "System Recovery and Reconstitution", description: "Provide for the recovery and reconstitution of the system to a known state after a disruption, compromise, or failure.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "IA",
    name: "Identification and Authentication",
    description: "Controls for user identification and authentication",
    icon: Key,
    controls: [
      { id: "IA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an identification and authentication policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-2", name: "Identification and Authentication (Organizational Users)", description: "Uniquely identify and authenticate organizational users and associate that identification with processes.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-2(1)", name: "Identification and Authentication - Multi-Factor Authentication to Privileged Accounts", description: "Implement multi-factor authentication for access to privileged accounts.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-2(2)", name: "Identification and Authentication - Multi-Factor Authentication to Non-Privileged Accounts", description: "Implement multi-factor authentication for access to non-privileged accounts.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-2(8)", name: "Identification and Authentication - Access to Accounts - Replay Resistant", description: "Implement replay-resistant authentication mechanisms for access to privileged and non-privileged accounts.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-2(12)", name: "Identification and Authentication - Acceptance of PIV Credentials", description: "Accept and electronically verify Personal Identity Verification (PIV) credentials.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-3", name: "Device Identification and Authentication", description: "Uniquely identify and authenticate devices before establishing a connection.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-4", name: "Identifier Management", description: "Manage system identifiers by receiving authorization from designated organizational personnel to assign identifiers.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-4(4)", name: "Identifier Management - Identify User Status", description: "Manage individual identifiers by uniquely identifying each individual as contractors or foreign nationals.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-5", name: "Authenticator Management", description: "Manage system authenticators by verifying the identity of individuals and establishing initial authenticator content.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-5(1)", name: "Authenticator Management - Password-Based Authentication", description: "For password-based authentication, enforce minimum password complexity and change of characters.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-5(2)", name: "Authenticator Management - Public Key-Based Authentication", description: "For public key-based authentication, enforce authorized access to the corresponding private key.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-5(6)", name: "Authenticator Management - Protection of Authenticators", description: "Protect authenticators commensurate with the security category of the information to which use of the authenticator permits access.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-5(7)", name: "Authenticator Management - No Embedded Unencrypted Static Authenticators", description: "Ensure that unencrypted static authenticators are not embedded in applications or access scripts.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-5(11)", name: "Authenticator Management - Hardware Token-Based Authentication", description: "Employ mechanisms that satisfy minimum token requirements for hardware-based authentication.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-6", name: "Authentication Feedback", description: "Obscure feedback of authentication information during the authentication process.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-7", name: "Cryptographic Module Authentication", description: "Implement mechanisms for authentication to a cryptographic module that meet applicable requirements.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-8", name: "Identification and Authentication (Non-Organizational Users)", description: "Uniquely identify and authenticate non-organizational users or processes acting on behalf of non-organizational users.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-8(1)", name: "Identification and Authentication - Acceptance of PIV Credentials from Other Agencies", description: "Accept and electronically verify PIV credentials from other federal agencies.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-8(2)", name: "Identification and Authentication - Acceptance of Third-Party Credentials", description: "Accept only external authenticators that are NIST-compliant.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IA-8(4)", name: "Identification and Authentication - Use of Defined Profiles", description: "Conform to defined profiles when implementing federation mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "IR",
    name: "Incident Response",
    description: "Controls for incident response capabilities",
    icon: AlertCircle,
    controls: [
      { id: "IR-1", name: "Policy and Procedures", description: "Develop, document, and disseminate an incident response policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-2", name: "Incident Response Training", description: "Provide incident response training to system users consistent with assigned roles and responsibilities.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-2(1)", name: "Incident Response Training - Simulated Events", description: "Incorporate simulated events into incident response training to facilitate effective response by personnel in crisis situations.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-2(2)", name: "Incident Response Training - Automated Training Environments", description: "Provide an incident response training environment using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-3", name: "Incident Response Testing", description: "Test the effectiveness of the incident response capability for the system using defined tests.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-4", name: "Incident Handling", description: "Implement an incident handling capability for incidents that includes preparation, detection, analysis, containment, eradication, and recovery.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-4(1)", name: "Incident Handling - Automated Incident Handling Processes", description: "Support the incident handling process using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-5", name: "Incident Monitoring", description: "Track and document system security incidents on an ongoing basis.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-6", name: "Incident Reporting", description: "Require personnel to report suspected incidents to the organizational incident response capability within an organizational time period.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-6(1)", name: "Incident Reporting - Automated Reporting", description: "Report incidents using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-7", name: "Incident Response Assistance", description: "Provide an incident response support resource that offers advice and assistance to users of the system for incident handling and reporting.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-7(1)", name: "Incident Response Assistance - Automation Support for Availability of Information and Support", description: "Increase the availability of incident response information and support using automated mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "IR-8", name: "Incident Response Plan", description: "Develop an incident response plan that provides a road map for implementing an incident response capability.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "MA",
    name: "Maintenance",
    description: "Controls for system maintenance activities",
    icon: Wrench,
    controls: [
      { id: "MA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system maintenance policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-2", name: "Controlled Maintenance", description: "Schedule, document, and review records of maintenance, repair, and replacement on system components.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-3", name: "Maintenance Tools", description: "Approve, control, and monitor the use of system maintenance tools and inspect tools carried into a facility.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-3(1)", name: "Maintenance Tools - Inspect Tools", description: "Inspect maintenance tools carried into a facility by maintenance personnel for improper or unauthorized modifications.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-3(2)", name: "Maintenance Tools - Inspect Media", description: "Check media containing diagnostic and test programs for malicious code before the media are used in the system.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-4", name: "Nonlocal Maintenance", description: "Approve and monitor nonlocal maintenance and diagnostic activities, allow nonlocal maintenance only as needed, and employ strong authentication.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-4(2)", name: "Nonlocal Maintenance - Document Nonlocal Maintenance", description: "Document nonlocal maintenance and diagnostic sessions, including session termination.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-5", name: "Maintenance Personnel", description: "Establish a process for maintenance personnel authorization and maintain a list of authorized maintenance personnel.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-5(1)", name: "Maintenance Personnel - Individuals without Appropriate Access", description: "Implement procedures for the use of maintenance personnel that lack appropriate security clearances or are not U.S. citizens.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MA-6", name: "Timely Maintenance", description: "Obtain maintenance support and spare parts for system components within a defined time period of failure.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "MP",
    name: "Media Protection",
    description: "Controls for protecting system media",
    icon: HardDrive,
    controls: [
      { id: "MP-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a media protection policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-2", name: "Media Access", description: "Restrict access to system media to authorized individuals.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-3", name: "Media Marking", description: "Mark system media indicating the distribution limitations, handling caveats, and applicable security markings of the information.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-4", name: "Media Storage", description: "Physically control and securely store system media within controlled areas using security measures.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-5", name: "Media Transport", description: "Protect and control system media during transport outside of controlled areas using cryptographic mechanisms and security measures.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-5(4)", name: "Media Transport - Cryptographic Protection", description: "Implement cryptographic mechanisms to protect the confidentiality and integrity of information stored on digital media during transport.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-6", name: "Media Sanitization", description: "Sanitize system media prior to disposal, release out of organizational control, or release for reuse using approved techniques and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-6(1)", name: "Media Sanitization - Review, Approve, Track, Document, and Verify", description: "Review, approve, track, document, and verify media sanitization and disposal actions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-6(2)", name: "Media Sanitization - Equipment Testing", description: "Test sanitization equipment and procedures to verify that the intended sanitization is being achieved.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-7", name: "Media Use", description: "Restrict the use of specific types of system media on systems or system components and prohibit the use of portable storage devices in organizational systems when such devices have no identifiable owner.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "MP-7(1)", name: "Media Use - Prohibit Use Without Owner", description: "Prohibit the use of portable storage devices in organizational systems when such devices have no identifiable owner.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PE",
    name: "Physical and Environmental Protection",
    description: "Controls for physical and environmental security",
    icon: MapPin,
    controls: [
      { id: "PE-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a physical and environmental protection policy and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-2", name: "Physical Access Authorizations", description: "Develop, approve, and maintain a list of individuals with authorized access to the facility where the system resides.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-3", name: "Physical Access Control", description: "Enforce physical access authorizations at entry and exit points to the facility where the system resides.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-3(1)", name: "Physical Access Control - System Access", description: "Enforce physical access authorizations to the system in addition to the physical access controls for the facility.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-4", name: "Access Control for Transmission", description: "Control physical access to system distribution and transmission lines within organizational facilities.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-5", name: "Access Control for Output Devices", description: "Control physical access to output devices to prevent unauthorized individuals from obtaining the output.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-6", name: "Monitoring Physical Access", description: "Monitor physical access to the facility where the system resides to detect and respond to physical security incidents.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-6(1)", name: "Monitoring Physical Access - Intrusion Alarms and Surveillance Equipment", description: "Monitor physical access to the facility where the system resides using physical intrusion alarms and surveillance equipment.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-8", name: "Visitor Access Records", description: "Maintain visitor access records to the facility where the system resides for a defined time period.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-9", name: "Power Equipment and Cabling", description: "Protect power equipment and power cabling for the system from damage and destruction.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-10", name: "Emergency Shutoff", description: "Provide the capability of shutting off power to the system or individual system components in emergency situations.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-11", name: "Emergency Power", description: "Provide an uninterruptible power supply to facilitate an orderly shutdown of the system in the event of a primary power source loss.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-12", name: "Emergency Lighting", description: "Employ and maintain automatic emergency lighting for the system that activates in the event of a power outage or disruption.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-13", name: "Fire Protection", description: "Employ and maintain fire detection and suppression systems that are supported by an independent energy source.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-13(3)", name: "Fire Protection - Automatic Fire Suppression", description: "Employ an automatic fire suppression capability for the system when the facility is not staffed on a continuous basis.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-14", name: "Environmental Controls", description: "Maintain environmental controls in the facility containing the system at consistent levels and monitor environmental control levels.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-14(2)", name: "Environmental Controls - Monitoring with Alarms and Notifications", description: "Employ environmental control monitoring that provides an alarm or notification of changes potentially harmful to personnel or equipment.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-15", name: "Water Damage Protection", description: "Protect the system from damage resulting from water leakage by providing master shutoff or isolation valves.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-16", name: "Delivery and Removal", description: "Authorize and control system components entering and exiting the facility and maintain records of the items.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PE-17", name: "Alternate Work Site", description: "Determine and document alternate work sites and assess the effectiveness of security controls at alternate work sites.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PL",
    name: "Planning",
    description: "Controls for security planning activities",
    icon: ClipboardList,
    controls: [
      { id: "PL-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a planning policy and procedures for addressing purpose, scope, and roles.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-2", name: "System Security and Privacy Plans", description: "Develop security and privacy plans for the system that describe the controls in place or planned for meeting security and privacy requirements.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-2(3)", name: "System Security and Privacy Plans - Plan and Coordinate with Other Organizational Entities", description: "Plan and coordinate security- and privacy-related activities affecting the system with other organizational entities.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-4", name: "Rules of Behavior", description: "Establish and provide to individuals requiring access to the system the rules that describe their responsibilities and expected behavior.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-4(1)", name: "Rules of Behavior - Social Media and External Site/Application Usage Restrictions", description: "Include in the rules of behavior restrictions on use of social media, social networking sites, and external sites/applications.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-8", name: "Security and Privacy Architectures", description: "Develop security and privacy architectures for the system that describe the requirements and approach for protecting confidentiality, integrity, and availability.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-8(1)", name: "Security and Privacy Architectures - Defense in Depth", description: "Design the security and privacy architectures for the system using a defense-in-depth approach.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-10", name: "Baseline Selection", description: "Select a control baseline for the system based on the security categorization.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PL-11", name: "Baseline Tailoring", description: "Tailor the selected control baseline by applying specified tailoring actions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PM",
    name: "Program Management",
    description: "Controls for organization-wide information security program",
    icon: Briefcase,
    controls: [
      { id: "PM-1", name: "Information Security Program Plan", description: "Develop and disseminate an organization-wide information security program plan that provides an overview of the requirements for the program.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-2", name: "Information Security Program Leadership Role", description: "Appoint a senior agency information security officer with the mission and resources to coordinate, develop, implement, and maintain an organization-wide information security program.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-3", name: "Information Security and Privacy Resources", description: "Include the resources needed to implement the information security and privacy programs in capital planning and investment requests.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-4", name: "Plan of Action and Milestones Process", description: "Implement a process to ensure that plans of action and milestones for the information security, privacy, and supply chain risk management programs are maintained and document the remedial information security, privacy, and supply chain risk management actions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-5", name: "System Inventory", description: "Develop and maintain an inventory of organizational systems.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-6", name: "Measures of Performance", description: "Develop, monitor, and report on the results of information security and privacy measures of performance.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-7", name: "Enterprise Architecture", description: "Develop and maintain an enterprise architecture with consideration for information security, privacy, and supply chain risk management.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-8", name: "Critical Infrastructure Plan", description: "Address information security and privacy issues in the development, documentation, and updating of a critical infrastructure and key resources protection plan.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-9", name: "Risk Management Strategy", description: "Develop a comprehensive strategy to manage risk to organizational operations and assets, individuals, other organizations, and the Nation associated with the operation and use of organizational systems.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-10", name: "Authorization Process", description: "Manage the security and privacy state of organizational systems through authorization processes.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-11", name: "Mission and Business Process Definition", description: "Define organizational mission and business processes with consideration for information security and privacy and the resulting risk to organizational operations, organizational assets, individuals, other organizations, and the Nation.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-12", name: "Insider Threat Program", description: "Implement an insider threat program that includes a cross-discipline insider threat incident handling team.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-13", name: "Security and Privacy Workforce", description: "Establish a security and privacy workforce development and improvement program.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-14", name: "Testing, Training, and Monitoring", description: "Implement a process for ensuring that organizational plans for conducting security and privacy testing, training, and monitoring activities associated with organizational systems are developed and maintained.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-15", name: "Security and Privacy Groups and Associations", description: "Establish and institutionalize contact with selected groups and associations within the security and privacy communities.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PM-16", name: "Threat Awareness Program", description: "Implement a threat awareness program that includes a cross-organization information-sharing capability for threat intelligence.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "PS",
    name: "Personnel Security",
    description: "Controls for personnel security measures",
    icon: UserCheck,
    controls: [
      { id: "PS-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a personnel security policy and procedures addressing purpose, scope, roles, responsibilities, and compliance.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-2", name: "Position Risk Designation", description: "Assign a risk designation to all organizational positions and establish screening criteria for individuals filling those positions.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-3", name: "Personnel Screening", description: "Screen individuals prior to authorizing access to the system and rescreen individuals according to organization-defined conditions requiring rescreening.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-3(3)", name: "Personnel Screening - Information Requiring Special Protection", description: "Verify that individuals accessing a system processing, storing, or transmitting information requiring special protection have valid access authorizations.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-4", name: "Personnel Termination", description: "Upon termination of individual employment, disable system access within a time period, conduct exit interviews, retrieve all security-related organizational system-related property, and retain access to organizational information and systems formerly controlled by terminated individual.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-4(2)", name: "Personnel Termination - Automated Actions", description: "Use automated mechanisms to notify personnel and system administrators when individuals are terminated and to disable system access.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-5", name: "Personnel Transfer", description: "Review and confirm ongoing operational need for current logical and physical access authorizations to systems and facilities when individuals are reassigned or transferred.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-6", name: "Access Agreements", description: "Develop and document access agreements for organizational systems, review and update access agreements, and require individuals to sign appropriate access agreements.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-7", name: "External Personnel Security", description: "Establish personnel security requirements for external providers, monitor provider compliance with personnel security requirements, and document personnel security requirements.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "PS-8", name: "Personnel Sanctions", description: "Employ a formal sanctions process for individuals failing to comply with established information security and privacy policies and procedures.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "RA",
    name: "Risk Assessment",
    description: "Controls for risk assessment activities",
    icon: Target,
    controls: [
      { id: "RA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a risk assessment policy and procedures addressing purpose, scope, roles, responsibilities, management commitment, and compliance.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-2", name: "Security Categorization", description: "Categorize the system and information it processes, stores, and transmits according to applicable laws, executive orders, directives, and regulations.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-2(1)", name: "Security Categorization - Impact-Level Prioritization", description: "Conduct an impact-level prioritization of organizational systems to obtain additional granularity on system impact levels.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-3", name: "Risk Assessment", description: "Conduct a risk assessment, including identifying threats to and vulnerabilities in the system, determining the likelihood and magnitude of harm, and documenting results.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-3(1)", name: "Risk Assessment - Supply Chain Risk Assessment", description: "Assess supply chain risks associated with systems, system components, and system services and update the risk assessment when there are significant changes.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-5", name: "Vulnerability Monitoring and Scanning", description: "Monitor and scan for vulnerabilities in the system and hosted applications and remediate legitimate vulnerabilities in accordance with organizational risk assessments.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-5(1)", name: "Vulnerability Monitoring and Scanning - Update Tool Capability", description: "Employ vulnerability monitoring tools that include the capability to readily update the vulnerabilities to be scanned.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-5(2)", name: "Vulnerability Monitoring and Scanning - Update Vulnerabilities to be Scanned", description: "Update the system vulnerabilities to be scanned prior to a new scan or when new vulnerabilities are identified and reported.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-5(3)", name: "Vulnerability Monitoring and Scanning - Breadth and Depth of Coverage", description: "Define the breadth and depth of vulnerability scanning coverage.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-5(5)", name: "Vulnerability Monitoring and Scanning - Privileged Access", description: "Implement privileged access authorization to system components for selected vulnerability scanning activities.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "RA-5(8)", name: "Vulnerability Monitoring and Scanning - Review Historic Audit Logs", description: "Review historic audit logs to determine if a vulnerability identified in a system has been previously exploited within an organizational time period.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SA",
    name: "System and Services Acquisition",
    description: "Controls for system and services acquisition",
    icon: ShoppingCart,
    controls: [
      { id: "SA-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system and services acquisition policy and procedures addressing purpose, scope, roles, responsibilities, and compliance.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-2", name: "Allocation of Resources", description: "Determine, document, and allocate the resources required to protect the system as part of the organizational capital planning and investment control process.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-2(1)", name: "Allocation of Resources - Life-Cycle Resource Determinations", description: "Employ a business case or cost-benefit analysis for organizational systems requiring development or upgrade.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-3", name: "System Development Life Cycle", description: "Acquire, develop, and manage the system using a system development life cycle that incorporates information security and privacy considerations.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-4", name: "Acquisition Process", description: "Include the following requirements, descriptions, and criteria in the acquisition contract for the system, system component, or system service.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-4(1)", name: "Acquisition Process - Functional Properties of Controls", description: "Require the developer of the system, system component, or system service to provide a description of the functional properties of the controls to be implemented.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-4(2)", name: "Acquisition Process - Design and Implementation Information for Controls", description: "Require the developer of the system, system component, or system service to provide design and implementation information for the controls.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-4(9)", name: "Acquisition Process - Functions, Ports, Protocols, and Services in Use", description: "Require the developer to identify the functions, ports, protocols, and services intended for organizational use.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-4(10)", name: "Acquisition Process - Use of Approved PIV Products", description: "Employ only information technology products on the FIPS 201-approved products list for Personal Identity Verification (PIV) capability.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-5", name: "System Documentation", description: "Obtain or develop administrator and user documentation for the system, system component, or system service.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-8", name: "Security and Privacy Engineering Principles", description: "Apply systems security and privacy engineering principles in the specification, design, development, implementation, and modification of the system.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-9", name: "External System Services", description: "Require that providers of external system services comply with organizational security and privacy requirements and employ controls in accordance with applicable laws, executive orders, and regulations.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-9(1)", name: "External System Services - Risk Assessments and Organizational Approvals", description: "Conduct an organizational assessment of risk prior to the acquisition or outsourcing of information security services.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-9(2)", name: "External System Services - Identification of Functions, Ports, Protocols, and Services", description: "Require providers of external system services to identify the functions, ports, protocols, and other services required for the use of such services.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-9(4)", name: "External System Services - Consistent Interests of Consumers and Providers", description: "Take actions to ensure that the interests of external service providers are consistent with and reflect organizational interests.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-10", name: "Developer Configuration Management", description: "Require the developer of the system, system component, or system service to perform configuration management during system, component, or service development, implementation, and operation.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-11", name: "Developer Testing and Evaluation", description: "Require the developer of the system, system component, or system service to create and implement a security and privacy test and evaluation plan.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-11(1)", name: "Developer Testing and Evaluation - Static Code Analysis", description: "Require the developer of the system, system component, or system service to employ static code analysis tools to identify common flaws.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-15", name: "Development Process, Standards, and Tools", description: "Require the developer of the system, system component, or system service to follow a documented development process that addresses security and privacy requirements.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-16", name: "Developer-Provided Training", description: "Require the developer of the system, system component, or system service to provide training on the correct use and operation of the implemented security and privacy functions, controls, and mechanisms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SA-22", name: "Unsupported System Components", description: "Replace system components when support for the components is no longer available from the developer, vendor, or manufacturer, or provide alternative support.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SC",
    name: "System and Communications Protection",
    description: "Controls for protecting system and communications",
    icon: Wifi,
    controls: [
      { id: "SC-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system and communications protection policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; establish procedures to facilitate the implementation of the policy and associated controls.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-5", name: "Denial-of-Service Protection", description: "Protect against or limit the effects of denial-of-service attacks by employing security safeguards and configuring the system to fail safely if potential denial-of-service attacks are detected.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7", name: "Boundary Protection", description: "Monitor and control communications at the external managed interfaces to the system to manage external telecommunications connections at system boundaries.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(3)", name: "Boundary Protection - Access Points", description: "Limit external access to authorized external telecommunications connections at managed interfaces by restricting network access to individual system modules.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(4)", name: "Boundary Protection - External Connections", description: "Employ a managed interface with explicit deny-by-default and allow-by-exception policy at each external managed interface.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(5)", name: "Boundary Protection - Deny by Default Allow by Exception", description: "Deny network communications traffic by default and allow network communications traffic by exception.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(7)", name: "Boundary Protection - Split Tunneling", description: "Prevent the unauthorized split tunneling of encrypted sessions for remote access to the system.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(8)", name: "Boundary Protection - Route Traffic", description: "Route all inbound and outbound communications traffic through managed interfaces that are configured according to organization-defined security principles.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(12)", name: "Boundary Protection - Host-based Protection", description: "Implement host-based boundary protection mechanisms for each system component.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(13)", name: "Boundary Protection - Isolation of Security Tools", description: "Isolate security tools, mechanisms, and support components by physical and/or logical means from other system components and information.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(18)", name: "Boundary Protection - Fail Secure", description: "Fail securely in the event of an operational failure of a boundary protection device.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-7(21)", name: "Boundary Protection - Isolation of System Components", description: "Isolate system components supporting mission-essential services on physically or logically separate networks with managed interfaces.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-8", name: "Transmission Confidentiality and Integrity", description: "Protect the confidentiality and integrity of transmitted information by employing cryptographic mechanisms during transmission.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-8(1)", name: "Transmission Confidentiality and Integrity - Cryptographic or Alternate Physical", description: "Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of information or employ alternative physical safeguards.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-12", name: "Cryptographic Key Establishment and Management", description: "Establish and manage cryptographic keys when cryptography is employed within the system for various purposes including transmission protection and storage.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-13", name: "Use of Cryptography", description: "Employ cryptographic controls to protect information systems and the information processed, stored, and transmitted by those systems in accordance with applicable laws, executive orders, directives, policies, regulations, and standards.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-15", name: "Wireless Accessibility", description: "Disable wireless networking capabilities embedded or otherwise available in systems, system components, or system services prior to issuance and delivery unless specifically required for operational purposes.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-17", name: "Public Key Infrastructure Certificates", description: "Implement a certificate-based public key infrastructure to support digital signatures and identity authentication.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-18", name: "Mobile Code", description: "Define acceptable and unacceptable mobile code and mobile code technologies; establish usage restrictions and implementation guidance for mobile code and related services.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-19", name: "Voice and Video Communications", description: "Establish restrictions and implementation guidance on the use of voice and video communications for systems in accordance with organizational policies and procedures.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-20", name: "Secure Name/Address Resolution Service - DNSSEC", description: "Request and require the use of DNSSEC and implement DNSSEC validation on authoritative and recursive resolvers when the results of DNS queries are used for security purposes.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-21", name: "Secure Name/Address Resolution Service - Data Integrity", description: "Request and implement data origin authentication and data integrity verification mechanisms for internal name/address resolution queries and responses.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-22", name: "Architecture and Provisioning for Name/Address Resolution Service", description: "Ensure the security of the name/address resolution service for internal systems and applications by architecting and provisioning it to support resilience and redundancy.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-23", name: "Session Authenticity", description: "Implement mechanisms to detect and prevent the replay of sessions for network communications at the system level.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-28", name: "Protection of Information at Rest", description: "Protect the confidentiality and integrity of information at rest by employing cryptographic controls.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-28(1)", name: "Protection of Information at Rest - Cryptographic Controls", description: "Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of information at rest.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SC-39", name: "Process Isolation", description: "Maintain a separate execution domain for each executing process including separate address spaces and separate code execution environments.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SI",
    name: "System and Information Integrity",
    description: "Controls for system and information integrity",
    icon: Bug,
    controls: [
      { id: "SI-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a system and information integrity policy and procedures that address purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-2", name: "Flaw Remediation", description: "Identify, report, and correct system flaws in a timely manner using current threat and vulnerability information when available.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-2(2)", name: "Flaw Remediation - Automatic Updates", description: "Install security-relevant software and firmware updates automatically on system components.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-2(3)", name: "Flaw Remediation - Time Limit", description: "Install organization-defined critical security patches within an organization-defined time period of the release of the patches.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-3", name: "Malicious Code Protection", description: "Implement malicious code protection mechanisms at system entry and exit points to detect and eradicate malicious code.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-3(1)", name: "Malicious Code Protection - Central Management", description: "Centrally manage malicious code protection mechanisms and automatically update malicious code protection definitions.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-4", name: "System Monitoring", description: "Monitor the system to detect attacks and indicators of potential attacks; monitor unauthorized local, network, and remote connections.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-4(2)", name: "System Monitoring - Automated Monitoring", description: "Employ automated tools and mechanisms to support the monitoring of system events.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-4(4)", name: "System Monitoring - Inbound Anomalies", description: "Monitor system communications for inbound and outbound anomalies and indicators of compromise.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-4(5)", name: "System Monitoring - System-generated Alerts", description: "Alert organization-defined personnel or roles when an intrusion is detected.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-4(23)", name: "System Monitoring - Host-based Monitoring", description: "Implement host-based monitoring mechanisms to detect and report unauthorized changes to information system software and firmware.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-5", name: "Security Alerts, Advisories, and Directives", description: "Receive system security alerts, advisories, and directives from external organizations and disseminate security information to appropriate personnel.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-6", name: "Security Functionality Verification", description: "Verify the correct operation of security functions in accordance with specifications following installation, activation, reconfiguration, or patching.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-7", name: "Software, Firmware, and Information Integrity", description: "Monitor and maintain the integrity of information system software, firmware, and information through integrity verification tools or hash algorithms.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-7(1)", name: "Software, Firmware, and Information Integrity - Cryptographic Mechanisms", description: "Employ cryptographic mechanisms to detect unauthorized changes to information system software and information.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-7(7)", name: "Software, Firmware, and Information Integrity - Integration with Development", description: "Integrate software, firmware, and information integrity verification into an organization-defined system development and delivery process.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-10", name: "Information and Input Validation", description: "Check the validity of information inputs (syntax, semantics, internal consistency, timeliness, completeness).", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-11", name: "Error Handling", description: "Implement error handling in information systems that provides error messages that are informative but do not reveal unnecessary information to potential adversaries.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-12", name: "Information Handling and Retention", description: "Handle and retain information within the system and information output from the system in accordance with applicable federal laws, executive orders, directives, policies, regulations, standards, and operational requirements.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SI-16", name: "Memory Protection", description: "Implement controls to protect system memory from unauthorized code execution.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  },
  {
    id: "SR",
    name: "Supply Chain Risk Management",
    description: "Controls for managing supply chain risks",
    icon: Link,
    controls: [
      { id: "SR-1", name: "Policy and Procedures", description: "Develop, document, and disseminate a supply chain risk management policy and procedures that address purpose, scope, roles, responsibilities, management commitment, and compliance.", baseline: "low", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-2", name: "Supply Chain Risk Management Plan", description: "Develop a plan for managing supply chain risks associated with the development and procurement of information systems, system components, and system services.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-3", name: "Supply Chain Controls and Processes", description: "Establish a process to identify and address weaknesses or deficiencies in supply chain elements.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-3(1)", name: "Supply Chain Controls and Processes - Governance", description: "Establish a governance structure and mechanisms for supply chain risk management activities across the organization.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-3(2)", name: "Supply Chain Controls and Processes - Supplier Responsibility", description: "Require suppliers and contractors to implement supply chain risk management processes consistent with organizational supply chain risk management strategy.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-5", name: "Acquisition Strategies, Tools, and Methods", description: "Employ acquisition strategies, contract tools, clause options, and procurement methods to protect against supply chain risks associated with the development and procurement of systems.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-6", name: "Supplier Safeguards", description: "Employ contractual security safeguards and monitoring practices to ensure that suppliers and contractors providing systems, system components, or services comply with organizational security requirements.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-8", name: "Notification Agreements", description: "Require contractors and suppliers to notify the organization of any deficiencies discovered in systems or components provided, and provide timely notification of security updates and patches.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-10", name: "Inspection of Information Systems, Components, or Services", description: "Inspect and monitor systems, system components, and services for security and quality assurance before accepting delivery or use.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-11", name: "Component Authenticity", description: "Develop and implement anti-counterfeit policy and procedures for systems and components including detection, reporting, and remediation of counterfeit components.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-11(1)", name: "Component Authenticity - Detection and Documentation", description: "Employ technical and/or procedural means to detect and document counterfeit information system components.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
      { id: "SR-11(2)", name: "Component Authenticity - Anti-Tamper Technology", description: "Employ anti-tamper technologies and techniques for information system components.", baseline: "moderate", status: "not_started", evidenceStatus: "none", lastUpdated: null },
    ]
  }
];

export default function FedRAMPFramework() {
  const { toast } = useToast();
  const [controlFamilies, setControlFamilies] = useState<ControlFamily[]>(initialControlFamilies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [baselineFilter, setBaselineFilter] = useState<string>("all");
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("controls");
  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [selectedControlForEvidence, setSelectedControlForEvidence] = useState<Control | null>(null);

  const { data: companyProfiles } = useQuery<CompanyProfile[]>({
    queryKey: ['/api/company-profiles'],
  });

  // Fetch all evidence for the FedRAMP framework
  const { data: evidenceData } = useQuery<{ evidence: EvidenceFile[]; count: number }>({
    queryKey: ['/api/evidence/fedramp'],
    queryFn: async () => {
      const response = await fetch('/api/evidence?framework=fedramp', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch evidence');
      return response.json();
    },
  });

  // Get evidence files linked to a specific control
  const getControlEvidence = (controlId: string): EvidenceFile[] => {
    if (!evidenceData?.evidence) return [];
    return evidenceData.evidence.filter(file => 
      file.metadata?.tags?.includes(`control:${controlId}`)
    );
  };

  // Get available evidence not yet linked to the selected control
  const getAvailableEvidence = (): EvidenceFile[] => {
    if (!evidenceData?.evidence || !selectedControlForEvidence) return [];
    return evidenceData.evidence.filter(file => 
      !file.metadata?.tags?.includes(`control:${selectedControlForEvidence.id}`)
    );
  };

  // Mutation for linking evidence to controls
  const linkEvidenceMutation = useMutation({
    mutationFn: async ({ evidenceId, controlId, action }: { 
      evidenceId: string; 
      controlId: string; 
      action: 'add' | 'remove';
    }) => {
      return await apiRequest(`/api/evidence/${evidenceId}/controls`, {
        method: 'POST',
        body: JSON.stringify({ 
          controlIds: [controlId], 
          framework: 'fedramp',
          action 
        }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/evidence/fedramp'] });
      toast({
        title: variables.action === 'add' ? "Evidence Linked" : "Evidence Unlinked",
        description: `Evidence has been ${variables.action === 'add' ? 'linked to' : 'removed from'} the control`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update evidence",
        description: error.message || "Could not update evidence linking",
        variant: "destructive",
      });
    }
  });

  const allControls = useMemo(() => {
    return controlFamilies.flatMap(family => 
      family.controls.map(control => ({ ...control, familyId: family.id, familyName: family.name }))
    );
  }, [controlFamilies]);

  const filteredControls = useMemo(() => {
    return allControls.filter(control => {
      const matchesSearch = searchTerm === "" || 
        control.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || control.status === statusFilter;
      const matchesFamily = familyFilter === "all" || control.familyId === familyFilter;
      const matchesBaseline = baselineFilter === "all" || control.baseline === baselineFilter;
      
      return matchesSearch && matchesStatus && matchesFamily && matchesBaseline;
    });
  }, [allControls, searchTerm, statusFilter, familyFilter, baselineFilter]);

  const stats = useMemo(() => {
    const total = allControls.length;
    const implemented = allControls.filter(c => c.status === "implemented").length;
    const inProgress = allControls.filter(c => c.status === "in_progress").length;
    const notStarted = allControls.filter(c => c.status === "not_started").length;
    const notApplicable = allControls.filter(c => c.status === "not_applicable").length;
    const applicableTotal = total - notApplicable;
    const score = applicableTotal > 0 ? Math.round((implemented / applicableTotal) * 100) : 0;
    
    const lowBaseline = allControls.filter(c => c.baseline === "low").length;
    const moderateBaseline = allControls.filter(c => c.baseline === "moderate").length;
    const highBaseline = allControls.filter(c => c.baseline === "high").length;
    
    return { total, implemented, inProgress, notStarted, notApplicable, score, lowBaseline, moderateBaseline, highBaseline };
  }, [allControls]);

  const updateControlStatus = (controlId: string, newStatus: ControlStatus) => {
    setControlFamilies(families => 
      families.map(family => ({
        ...family,
        controls: family.controls.map(control => 
          control.id === controlId 
            ? { ...control, status: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
    toast({
      title: "Control Updated",
      description: `${controlId} status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const updateEvidenceStatus = (controlId: string, newStatus: EvidenceStatus) => {
    setControlFamilies(families => 
      families.map(family => ({
        ...family,
        controls: family.controls.map(control => 
          control.id === controlId 
            ? { ...control, evidenceStatus: newStatus, lastUpdated: new Date().toISOString() }
            : control
        )
      }))
    );
  };

  const handleGenerateDocument = (controlId: string, controlName: string) => {
    toast({
      title: "Generating Document",
      description: `Creating documentation for ${controlId}: ${controlName}`,
    });
  };

  const handleGenerateAllDocuments = () => {
    toast({
      title: "Generating All Documents",
      description: `Creating documentation for all ${stats.total} FedRAMP controls`,
    });
  };

  const getStatusBadge = (status: ControlStatus) => {
    switch (status) {
      case "implemented":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Implemented</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "not_started":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Not Started</Badge>;
      case "not_applicable":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><XCircle className="w-3 h-3 mr-1" />N/A</Badge>;
    }
  };

  const getBaselineBadge = (baseline: Baseline) => {
    switch (baseline) {
      case "low":
        return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">Low</Badge>;
      case "moderate":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">Moderate</Badge>;
      case "high":
        return <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">High</Badge>;
    }
  };

  const getEvidenceBadge = (status: EvidenceStatus) => {
    switch (status) {
      case "complete":
        return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400"><FileCheck className="w-3 h-3 mr-1" />Complete</Badge>;
      case "partial":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400"><FileText className="w-3 h-3 mr-1" />Partial</Badge>;
      case "none":
        return <Badge variant="outline" className="border-gray-400 text-gray-600 dark:text-gray-400"><FileText className="w-3 h-3 mr-1" />None</Badge>;
    }
  };

  const getFamilyStats = (family: ControlFamily) => {
    const total = family.controls.length;
    const implemented = family.controls.filter(c => c.status === "implemented").length;
    const inProgress = family.controls.filter(c => c.status === "in_progress").length;
    return { total, implemented, inProgress };
  };

  const filteredFamilies = useMemo(() => {
    if (familyFilter !== "all") {
      return controlFamilies.filter(f => f.id === familyFilter);
    }
    return controlFamilies;
  }, [controlFamilies, familyFilter]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">
              FedRAMP - Federal Risk and Authorization Management Program
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              NIST 800-53 based security controls for federal cloud services
            </p>
          </div>
        </div>
        <Button 
          onClick={handleGenerateAllDocuments}
          data-testid="button-generate-all-documents"
        >
          <Download className="h-4 w-4 mr-2" />
          Generate All Documents
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList data-testid="tabs-framework-sections">
            <TabsTrigger value="controls" data-testid="tab-controls">
              <Shield className="h-4 w-4 mr-2" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <TableIcon className="h-4 w-4 mr-2" />
              Template Data
            </TabsTrigger>
          </TabsList>

          {activeTab === "templates" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Company Profile:</span>
              <Select 
                value={selectedCompanyProfileId || ""} 
                onValueChange={(v) => setSelectedCompanyProfileId(v || null)}
              >
                <SelectTrigger className="w-[200px]" data-testid="select-company-profile">
                  <SelectValue placeholder="Select profile..." />
                </SelectTrigger>
                <SelectContent>
                  {companyProfiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="templates" className="space-y-4">
          <FrameworkSpreadsheet 
            framework="FedRAMP" 
            companyProfileId={selectedCompanyProfileId} 
          />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ChevronRight className="h-5 w-5" />
                Overall Compliance Progress
              </CardTitle>
              <CardDescription>
                Track your organization's FedRAMP implementation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Compliance Score</span>
                  <span className="text-2xl font-bold" data-testid="text-compliance-score">{stats.score}%</span>
                </div>
                <Progress value={stats.score} className="h-3" data-testid="progress-compliance" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-stat-implemented">
                  {stats.implemented}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Implemented</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-stat-in-progress">
                  {stats.inProgress}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">In Progress</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-400" data-testid="text-stat-not-started">
                  {stats.notStarted}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Not Started</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-stat-total">
                  {stats.total}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-500">Total Controls</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-xl font-bold text-green-700 dark:text-green-400" data-testid="text-baseline-low">
                  {stats.lowBaseline}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Low Baseline</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-baseline-moderate">
                  {stats.moderateBaseline}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">Moderate Baseline</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-xl font-bold text-red-700 dark:text-red-400" data-testid="text-baseline-high">
                  {stats.highBaseline}
                </div>
                <div className="text-xs text-red-600 dark:text-red-500">High Baseline</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search controls by ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-controls"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="not_applicable">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={familyFilter} onValueChange={setFamilyFilter}>
              <SelectTrigger data-testid="select-family-filter">
                <SelectValue placeholder="Filter by family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {controlFamilies.map(family => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.id} - {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={baselineFilter} onValueChange={setBaselineFilter}>
              <SelectTrigger data-testid="select-baseline-filter">
                <SelectValue placeholder="Filter by baseline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Baselines</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== "all" || familyFilter !== "all" || baselineFilter !== "all") && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredControls.length} of {stats.total} controls
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion 
        type="multiple" 
        value={expandedFamilies} 
        onValueChange={setExpandedFamilies}
        className="space-y-4"
      >
        {filteredFamilies.map(family => {
          const familyStats = getFamilyStats(family);
          const FamilyIcon = family.icon;
          const familyControls = (searchTerm || statusFilter !== "all" || baselineFilter !== "all")
            ? family.controls.filter(c => {
                const matchesSearch = searchTerm === "" || 
                  c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === "all" || c.status === statusFilter;
                const matchesBaseline = baselineFilter === "all" || c.baseline === baselineFilter;
                return matchesSearch && matchesStatus && matchesBaseline;
              })
            : family.controls;

          if (familyControls.length === 0) return null;

          return (
            <AccordionItem 
              key={family.id} 
              value={family.id}
              className="border rounded-lg"
              data-testid={`accordion-family-${family.id}`}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <FamilyIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{family.id} - {family.name}</div>
                      <div className="text-sm text-muted-foreground">{family.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="outline">{familyControls.length} controls</Badge>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {familyStats.implemented} done
                      </Badge>
                    </div>
                    <Progress 
                      value={(familyStats.implemented / familyStats.total) * 100} 
                      className="w-20 h-2 hidden sm:block"
                    />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 mt-2">
                  {familyControls.map(control => (
                    <Card key={control.id} className="border" data-testid={`card-control-${control.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start gap-2 mb-2">
                              <Badge variant="secondary" className="shrink-0">{control.id}</Badge>
                              {getBaselineBadge(control.baseline)}
                              <h4 className="font-medium text-sm">{control.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {control.description}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-3">
                            <Select 
                              value={control.status} 
                              onValueChange={(value) => updateControlStatus(control.id, value as ControlStatus)}
                            >
                              <SelectTrigger 
                                className="w-full sm:w-[160px]"
                                data-testid={`select-status-${control.id}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="implemented">Implemented</SelectItem>
                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select 
                              value={control.evidenceStatus} 
                              onValueChange={(value) => updateEvidenceStatus(control.id, value as EvidenceStatus)}
                            >
                              <SelectTrigger 
                                className="w-full sm:w-[140px]"
                                data-testid={`select-evidence-${control.id}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Evidence</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="complete">Complete</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateDocument(control.id, control.name)}
                              data-testid={`button-generate-${control.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Generate Doc</span>
                              <span className="sm:hidden">Generate</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedControlForEvidence(control);
                                setEvidenceDialogOpen(true);
                              }}
                              data-testid={`button-evidence-${control.id}`}
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Evidence
                              {getControlEvidence(control.id).length > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  {getControlEvidence(control.id).length}
                                </Badge>
                              )}
                            </Button>
                          </div>
                        </div>

                        {control.lastUpdated && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Last updated: {new Date(control.lastUpdated).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {filteredControls.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Controls Found</h3>
            <p className="text-muted-foreground text-sm">
              No controls match your current filter criteria. Try adjusting your search or filters.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setFamilyFilter("all");
                setBaselineFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>

      {/* Evidence Linking Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Manage Evidence for {selectedControlForEvidence?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedControlForEvidence?.name} - Link or unlink evidence files to this control
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Linked Evidence */}
            <div>
              <h4 className="text-sm font-medium mb-3">Linked Evidence</h4>
              {selectedControlForEvidence && getControlEvidence(selectedControlForEvidence.id).length > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {getControlEvidence(selectedControlForEvidence.id).map(evidence => (
                      <div 
                        key={evidence.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{evidence.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(evidence.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedControlForEvidence) {
                              linkEvidenceMutation.mutate({
                                evidenceId: evidence.id,
                                controlId: selectedControlForEvidence.id,
                                action: 'remove'
                              });
                            }
                          }}
                          disabled={linkEvidenceMutation.isPending}
                          data-testid={`button-unlink-${evidence.id}`}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No evidence linked to this control</p>
                </div>
              )}
            </div>

            {/* Available Evidence to Link */}
            <div>
              <h4 className="text-sm font-medium mb-3">Available Evidence to Link</h4>
              {getAvailableEvidence().length > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {getAvailableEvidence().map(evidence => (
                      <div 
                        key={evidence.id}
                        className="flex items-center justify-between p-3 border rounded-md hover-elevate cursor-pointer"
                        onClick={() => {
                          if (selectedControlForEvidence) {
                            linkEvidenceMutation.mutate({
                              evidenceId: evidence.id,
                              controlId: selectedControlForEvidence.id,
                              action: 'add'
                            });
                          }
                        }}
                        data-testid={`button-link-${evidence.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{evidence.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(evidence.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={linkEvidenceMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No additional evidence available to link</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
