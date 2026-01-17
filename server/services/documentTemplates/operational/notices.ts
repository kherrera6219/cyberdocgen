import { DocumentTemplate } from '../types';

export const CertificationNoticeTemplates: DocumentTemplate[] = [
  {
    id: 'cert-notices-001',
    title: 'Security Awareness Posters and Notices',
    description: 'Set of workplace posters and digital notices for security awareness',
    framework: 'General',
    category: 'notice',
    priority: 3,
    documentType: 'notice',
    required: false,
    templateContent: `# Security Awareness Notices

## NOTICE 1: CLEAN DESK POLICY
**REMINDER:** Please ensure sensitive documents are locked away when you leave your desk.
- Shred confidential papers
- Lock computer screen when away
- Clear whiteboards in meeting rooms

## NOTICE 2: PHISHING AWARENESS
**Think Before You Click!**
- Check the sender address
- Hover over links before clicking
- Don't download unexpected attachments
- Report suspicious emails to {{security_email}}

## NOTICE 3: PASSWORD SECURITY
**Protect Your Credentials**
- Never share your password
- Use a passphrase (e.g., "Correct-Horse-Battery-Staple")
- Don't reuse passwords across sites
- Enable MFA wherever possible

## NOTICE 4: VISITOR POLICY
**Escort Required**
- All visitors must sign in/out
- Visitors must wear a badge at all times
- Do not let visitors tailgated through secure doors
- Report unescorted strangers immediately

## NOTICE 5: DATA CLASSIFICATION
**Know Your Data**
- **Public:** Safe for general release
- **Internal:** Business use only
- **Confidential:** Sensitive business data (NDA required)
- **Restricted:** Highly sensitive (PII, credentials)

**Security Contact:** {{security_contact_name}}
**Emergency Phone:** {{emergency_phone}}
**Helpdesk:** {{helpdesk_contact}}`,
    templateVariables: {
      security_email: { type: 'text', label: 'Security Team Email', required: true },
      security_contact_name: { type: 'text', label: 'Security Contact Name', required: true },
      emergency_phone: { type: 'text', label: 'Emergency Phone Number', required: true },
      helpdesk_contact: { type: 'text', label: 'Helpdesk Contact', required: true }
    }
  }
];
