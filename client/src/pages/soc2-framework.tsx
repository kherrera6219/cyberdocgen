import { FrameworkPage, FrameworkConfig } from '@/components/compliance/FrameworkPage';
import { soc2Controls } from '@/data/soc2Controls';

const soc2Config: FrameworkConfig = {
  name: 'SOC 2',
  displayName: 'SOC 2 Type II - Trust Service Criteria',
  description: 'Trust service criteria for service organizations',
  apiId: 'soc2',
  controlDomains: soc2Controls,
};

export default function SOC 2Framework() {
  return <FrameworkPage config=soc2Config />;
}
