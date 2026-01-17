import { NIST80053Templates } from './core';
import { NIST80053ControlFamilyTemplatesPart1 } from './families_1';
import { NIST80053ControlFamilyTemplatesPart2 } from './families_2';
import { NIST80053ControlFamilyTemplatesPart3 } from './families_3';

export const NIST80053ControlFamilyTemplates = [
  ...NIST80053ControlFamilyTemplatesPart1,
  ...NIST80053ControlFamilyTemplatesPart2,
  ...NIST80053ControlFamilyTemplatesPart3
];

export const NISTTemplates = [
  ...NIST80053Templates,
  ...NIST80053ControlFamilyTemplates
];

export * from './core';
export * from './families_1';
export * from './families_2';
export * from './families_3';
