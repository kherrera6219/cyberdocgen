import { FrameworkPage, FrameworkConfig } from '@/components/compliance/FrameworkPage';
import { nistControls } from '@/data/nistControls';

const nistConfig: FrameworkConfig = {
  name: 'NIST',
  displayName: 'NIST CSF - Cybersecurity Framework',
  description: 'NIST Cybersecurity Framework implementation',
  apiId: 'nist',
  controlDomains: nistControls,
};

export default function NISTFramework() {
  return <FrameworkPage config=nistConfig />;
}
