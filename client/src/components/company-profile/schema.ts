import { insertCompanyProfileSchema } from "@shared/schema";
import { z } from "zod";

// Enhanced form schema with all new fields
export const enhancedCompanyProfileSchema = insertCompanyProfileSchema.extend({
  // Key Personnel
  ceoName: z.string().optional(),
  cisoName: z.string().optional(),
  cisoEmail: z.string().email().optional().or(z.literal("")),
  securityOfficerName: z.string().optional(),
  securityOfficerEmail: z.string().email().optional().or(z.literal("")),
  complianceOfficerName: z.string().optional(),
  complianceOfficerEmail: z.string().email().optional().or(z.literal("")),
  itManagerName: z.string().optional(),
  itManagerEmail: z.string().email().optional().or(z.literal("")),
  legalCounselName: z.string().optional(),
  legalCounselEmail: z.string().email().optional().or(z.literal("")),

  // Framework configurations
  selectedFrameworks: z.array(z.string()).default([]),
  fedRampLevel: z.enum(["low", "moderate", "high"]).optional(),
  nistControlFamilies: z.array(z.string()).default([]),
  soc2TrustServices: z.array(z.string()).default([]),
});

export type CompanyProfileFormData = z.infer<typeof enhancedCompanyProfileSchema>;

// Framework and control family data
export const COMPLIANCE_FRAMEWORKS = [
  { id: "iso27001", name: "ISO 27001:2022", description: "International information security standard" },
  { id: "soc2", name: "SOC 2 Type II", description: "Trust service criteria for service organizations" },
  { id: "fedramp-low", name: "FedRAMP Low", description: "155+ controls for low-impact systems" },
  { id: "fedramp-moderate", name: "FedRAMP Moderate", description: "300+ controls for moderate-impact systems" },
  { id: "fedramp-high", name: "FedRAMP High", description: "421+ controls for high-impact systems" },
  { id: "nist-800-53", name: "NIST 800-53 Rev 5", description: "20 control families with 1000+ controls" },
];

export const NIST_CONTROL_FAMILIES = [
  { id: "AC", name: "Access Control", description: "Controls who can access systems and data" },
  { id: "AT", name: "Awareness and Training", description: "Security awareness and training programs" },
  { id: "AU", name: "Audit and Accountability", description: "Audit capabilities and accountability" },
  { id: "CA", name: "Assessment, Authorization, and Monitoring", description: "Security assessment and monitoring" },
  { id: "CM", name: "Configuration Management", description: "Configuration control and management" },
  { id: "CP", name: "Contingency Planning", description: "Business continuity and disaster recovery" },
  { id: "IA", name: "Identification and Authentication", description: "User and device identity verification" },
  { id: "IR", name: "Incident Response", description: "Security incident detection and response" },
  { id: "MA", name: "Maintenance", description: "System and tool maintenance requirements" },
  { id: "MP", name: "Media Protection", description: "Protection of organizational media" },
  { id: "PE", name: "Physical and Environmental Protection", description: "Physical security controls" },
  { id: "PL", name: "Planning", description: "Security planning policies and procedures" },
  { id: "PM", name: "Program Management", description: "Overall security program management" },
  { id: "PS", name: "Personnel Security", description: "Personnel protection and screening" },
  { id: "PT", name: "PII Processing and Transparency", description: "Privacy and PII protection" },
  { id: "RA", name: "Risk Assessment", description: "Risk assessment and vulnerability management" },
  { id: "SA", name: "System and Services Acquisition", description: "Security requirements for acquisitions" },
  { id: "SC", name: "System and Communications Protection", description: "System and communication security" },
  { id: "SI", name: "System and Information Integrity", description: "System and information integrity" },
  { id: "SR", name: "Supply Chain Risk Management", description: "Supply chain cybersecurity risks" },
];

export const SOC2_TRUST_SERVICES = [
  { id: "security", name: "Security", description: "Protection against unauthorized access" },
  { id: "availability", name: "Availability", description: "System accessibility for operation and use" },
  { id: "processing", name: "Processing Integrity", description: "System processing completeness and accuracy" },
  { id: "confidentiality", name: "Confidentiality", description: "Information designated as confidential" },
  { id: "privacy", name: "Privacy", description: "Personal information collection and processing" },
];
