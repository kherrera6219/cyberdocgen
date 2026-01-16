/**
 * Framework Configuration and Types
 * Shared types for all compliance framework pages
 */

export type ControlStatus = "not_started" | "in_progress" | "implemented" | "not_applicable";
export type EvidenceStatus = "none" | "partial" | "complete";

export interface EvidenceFile {
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
    uploadedBy?: string;
  } | null;
}

export interface Control {
  id: string;
  controlId: string;
  title: string;
  description: string;
  category: string;
  status: ControlStatus;
  evidenceStatus: EvidenceStatus;
  evidence: EvidenceFile[];
  implementationNotes?: string;
  responsibleParty?: string;
  targetDate?: string;
  lastUpdated?: string;
}

export interface FrameworkConfig {
  /** Framework identifier (e.g., 'ISO27001', 'SOC2') */
  framework: string;
  
  /** Display name for the framework */
  displayName: string;
  
  /** Framework version or subtitle */
  version?: string;
  
  /** Description of the framework */
  description?: string;
  
  /** Control categories or families */
  categories: string[];
  
  /** Total number of controls in this framework */
  maxControls: number;
  
  /** Control ID prefixes or patterns */
  controlTypes?: string[];
  
  /** Color theme for the framework */
  themeColor?: string;
  
  /** Icon name for the framework */
  icon?: string;
}

export interface FrameworkStats {
  total: number;
  notStarted: number;
  inProgress: number;
  implemented: number;
  notApplicable: number;
  completionPercentage: number;
  evidenceComplete: number;
  evidencePartial: number;
  evidenceNone: number;
}

export interface FilterOptions {
  search: string;
  status: ControlStatus | "all";
  category: string | "all";
  evidenceStatus: EvidenceStatus | "all";
}
