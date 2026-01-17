export * from './baselines';

import { FedRAMPStandardTemplates } from './standards';
import { FedRAMPPlanTemplates } from './plans';

export const FedRAMPCoreTemplates = [
  ...FedRAMPStandardTemplates,
  ...FedRAMPPlanTemplates
];

import { FedRAMPAttachmentPolicies } from './attachments/policies';
import { FedRAMPAttachmentPlans } from './attachments/plans';
import { FedRAMPAttachmentAssessments } from './attachments/assessments';
import { FedRAMPAttachmentWorkbooks } from './attachments/workbooks';

export const FedRAMPAttachmentTemplates = [
  ...FedRAMPAttachmentPolicies,
  ...FedRAMPAttachmentPlans,
  ...FedRAMPAttachmentAssessments,
  ...FedRAMPAttachmentWorkbooks
];

export * from './standards';
export * from './plans';
export * from './attachments';
