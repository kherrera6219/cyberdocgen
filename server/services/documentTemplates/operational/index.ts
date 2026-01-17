import { OperationalCoreTemplates } from './core';
import { CertificationDocumentTemplates } from './certifications';
import { CertificationNoticeTemplates } from './notices';

export const OperationalTemplates = [
  ...OperationalCoreTemplates,
  ...CertificationDocumentTemplates,
  ...CertificationNoticeTemplates
];

export * from './core';
export * from './certifications';
export * from './notices';
