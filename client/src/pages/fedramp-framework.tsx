import { FrameworkPage, FrameworkConfig } from '@/components/compliance/FrameworkPage';
import { fedrampControls } from '@/data/fedrampControls';

const fedrampConfig: FrameworkConfig = {
  name: 'FedRAMP',
  displayName: 'FedRAMP - Federal Risk and Authorization Management Program',
  description: 'Federal cloud security compliance framework',
  apiId: 'fedramp',
  controlDomains: fedrampControls,
};

export default function FedRAMPFramework() {
  return <FrameworkPage config=fedrampConfig />;
}
