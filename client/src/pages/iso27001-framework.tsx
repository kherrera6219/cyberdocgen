import { FrameworkPage, FrameworkConfig } from '@/components/compliance/FrameworkPage';
import { iso27001Controls } from '@/data/iso27001Controls';

const iso27001Config: FrameworkConfig = {
  name: 'ISO 27001',
  displayName: 'ISO 27001:2022 - Information Security Management',
  description: 'Comprehensive compliance framework implementation',
  apiId: 'iso27001',
  controlDomains: iso27001Controls,
};

export default function ISO27001Framework() {
  return <FrameworkPage config={iso27001Config} />;
}
