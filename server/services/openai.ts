import OpenAI from "openai";
import { type CompanyProfile } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface DocumentTemplate {
  title: string;
  description: string;
  category: string;
  priority: number;
}

export const frameworkTemplates: Record<string, DocumentTemplate[]> = {
  "ISO27001": [
    { title: "Information Security Policy", description: "Main security governance document", category: "policy", priority: 1 },
    { title: "Risk Assessment Matrix", description: "Comprehensive risk analysis", category: "assessment", priority: 2 },
    { title: "Access Control Procedures", description: "User access management guidelines", category: "procedure", priority: 3 },
    { title: "Incident Response Plan", description: "Security incident handling procedures", category: "plan", priority: 4 },
    { title: "Business Continuity Plan", description: "Operational continuity procedures", category: "plan", priority: 5 },
    { title: "Asset Management Policy", description: "Information asset classification and handling", category: "policy", priority: 6 },
    { title: "Supplier Security Assessment", description: "Third-party security evaluation", category: "assessment", priority: 7 },
    { title: "Security Awareness Training", description: "Employee security education program", category: "training", priority: 8 },
    { title: "Vulnerability Management Procedure", description: "System vulnerability handling process", category: "procedure", priority: 9 },
    { title: "Data Classification Standard", description: "Information sensitivity classification", category: "standard", priority: 10 },
    { title: "Network Security Controls", description: "Network protection measures", category: "control", priority: 11 },
    { title: "Physical Security Policy", description: "Physical access and environment security", category: "policy", priority: 12 },
    { title: "Cryptography Policy", description: "Encryption and key management standards", category: "policy", priority: 13 },
    { title: "Security Monitoring Procedures", description: "Continuous security monitoring guidelines", category: "procedure", priority: 14 }
  ],
  "SOC2": [
    { title: "Security Controls Framework", description: "Comprehensive security control implementation", category: "framework", priority: 1 },
    { title: "Availability Controls", description: "System availability management procedures", category: "control", priority: 2 },
    { title: "Processing Integrity Controls", description: "Data processing accuracy measures", category: "control", priority: 3 },
    { title: "Confidentiality Controls", description: "Information confidentiality protection", category: "control", priority: 4 },
    { title: "Privacy Controls", description: "Personal information protection measures", category: "control", priority: 5 },
    { title: "Change Management Procedures", description: "System change control processes", category: "procedure", priority: 6 },
    { title: "Backup and Recovery Plan", description: "Data backup and system recovery procedures", category: "plan", priority: 7 },
    { title: "Vendor Management Policy", description: "Third-party service provider management", category: "policy", priority: 8 },
    { title: "User Access Review Process", description: "Periodic access rights validation", category: "process", priority: 9 },
    { title: "System Monitoring Controls", description: "Continuous system monitoring procedures", category: "control", priority: 10 },
    { title: "Data Retention Policy", description: "Information lifecycle management", category: "policy", priority: 11 },
    { title: "Security Testing Procedures", description: "Regular security assessment processes", category: "procedure", priority: 12 }
  ],
  "FedRAMP": [
    { title: "System Security Plan (SSP)", description: "Comprehensive security plan for federal systems", category: "plan", priority: 1 },
    { title: "Control Implementation Summary", description: "Federal security control implementation details", category: "summary", priority: 2 },
    { title: "Continuous Monitoring Plan", description: "Ongoing security monitoring strategy", category: "plan", priority: 3 },
    { title: "Incident Response Procedures", description: "Federal incident reporting and response", category: "procedure", priority: 4 },
    { title: "Configuration Management Plan", description: "System configuration control procedures", category: "plan", priority: 5 },
    { title: "Contingency Plan", description: "Emergency response and recovery procedures", category: "plan", priority: 6 },
    { title: "Risk Assessment Report", description: "Federal risk analysis and mitigation", category: "report", priority: 7 },
    { title: "Security Assessment Report", description: "Security control assessment results", category: "report", priority: 8 },
    { title: "Plan of Action and Milestones", description: "Security improvement roadmap", category: "plan", priority: 9 },
    { title: "Supply Chain Risk Management Plan", description: "Vendor and supply chain security procedures", category: "plan", priority: 10 },
    { title: "Personnel Security Procedures", description: "Staff security clearance and management", category: "procedure", priority: 11 },
    { title: "Physical and Environmental Protection", description: "Facility security measures", category: "protection", priority: 12 },
    { title: "System and Information Integrity", description: "Data and system integrity controls", category: "control", priority: 13 },
    { title: "Media Protection Procedures", description: "Removable media and storage security", category: "procedure", priority: 14 },
    { title: "Audit and Accountability Controls", description: "System auditing and logging procedures", category: "control", priority: 15 },
    { title: "Identification and Authentication", description: "User identity verification procedures", category: "procedure", priority: 16 },
    { title: "System and Communications Protection", description: "Network and communication security", category: "protection", priority: 17 },
    { title: "Maintenance Procedures", description: "System maintenance and support security", category: "procedure", priority: 18 }
  ],
  "NIST": [
    { title: "Cybersecurity Framework Implementation", description: "NIST CSF adoption and implementation guide", category: "framework", priority: 1 },
    { title: "Identify Function Controls", description: "Asset and risk identification procedures", category: "control", priority: 2 },
    { title: "Protect Function Controls", description: "Protective security measures implementation", category: "control", priority: 3 },
    { title: "Detect Function Controls", description: "Security event detection capabilities", category: "control", priority: 4 },
    { title: "Respond Function Controls", description: "Incident response and mitigation procedures", category: "control", priority: 5 },
    { title: "Recover Function Controls", description: "Recovery and restoration procedures", category: "control", priority: 6 },
    { title: "Asset Management Program", description: "Comprehensive asset inventory and management", category: "program", priority: 7 },
    { title: "Risk Management Strategy", description: "Enterprise risk assessment and management", category: "strategy", priority: 8 },
    { title: "Governance Framework", description: "Cybersecurity governance structure", category: "framework", priority: 9 },
    { title: "Supply Chain Risk Management", description: "Third-party cybersecurity risk management", category: "management", priority: 10 },
    { title: "Workforce Development Plan", description: "Cybersecurity skills and training program", category: "plan", priority: 11 },
    { title: "Technology Infrastructure Security", description: "Technical security architecture", category: "security", priority: 12 },
    { title: "Data Security and Privacy", description: "Information protection and privacy controls", category: "security", priority: 13 },
    { title: "Threat Intelligence Program", description: "Threat detection and intelligence sharing", category: "program", priority: 14 },
    { title: "Vulnerability Management", description: "Systematic vulnerability identification and remediation", category: "management", priority: 15 },
    { title: "Security Metrics and Reporting", description: "Performance measurement and reporting framework", category: "metrics", priority: 16 },
    { title: "Third-Party Risk Assessment", description: "Vendor cybersecurity evaluation procedures", category: "assessment", priority: 17 },
    { title: "Incident Recovery Procedures", description: "Post-incident recovery and lessons learned", category: "procedure", priority: 18 },
    { title: "Business Impact Analysis", description: "Critical function and process analysis", category: "analysis", priority: 19 },
    { title: "Cybersecurity Awareness Program", description: "Organization-wide security education", category: "program", priority: 20 },
    { title: "Identity and Access Management", description: "Comprehensive identity governance", category: "management", priority: 21 },
    { title: "Network Security Architecture", description: "Network segmentation and protection design", category: "architecture", priority: 22 },
    { title: "Cloud Security Framework", description: "Cloud service security implementation", category: "framework", priority: 23 }
  ]
};

export async function generateDocument(
  template: DocumentTemplate,
  companyProfile: CompanyProfile,
  framework: string
): Promise<string> {
  const systemPrompt = `You are a cybersecurity compliance expert specializing in ${framework}. Generate comprehensive, professional compliance documentation that meets industry standards and regulatory requirements.

The document should be:
- Detailed and actionable
- Specific to the company's profile and industry
- Compliant with ${framework} standards
- Professional in tone and structure
- Include specific implementation guidance
- Contain measurable objectives and controls

Company Profile Context:
- Company: ${companyProfile.companyName}
- Industry: ${companyProfile.industry}
- Size: ${companyProfile.companySize}
- Location: ${companyProfile.headquarters}
- Cloud Infrastructure: ${companyProfile.cloudInfrastructure.join(', ')}
- Data Classification: ${companyProfile.dataClassification}
- Business Applications: ${companyProfile.businessApplications}

Document Requirements:
- Title: ${template.title}
- Category: ${template.category}
- Framework: ${framework}

Generate a complete, professional document with sections including:
1. Purpose and Scope
2. Policy/Procedure Statement
3. Roles and Responsibilities
4. Implementation Guidelines
5. Compliance Requirements
6. Review and Update Procedures
7. Related Documents/References

Format the response as a structured document with clear headings and detailed content.`;

  const userPrompt = `Generate a comprehensive ${template.title} document for ${companyProfile.companyName}. 

This document should be tailored specifically for:
- A ${companyProfile.companySize} ${companyProfile.industry} company
- Using ${companyProfile.cloudInfrastructure.join(' and ')} infrastructure
- Handling ${companyProfile.dataClassification} data
- With the following business applications: ${companyProfile.businessApplications}

The document must comply with ${framework} standards and include specific, actionable guidance that ${companyProfile.companyName} can implement immediately.

Make the document practical and implementable, with specific controls, procedures, and measurable objectives that align with ${framework} requirements.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    logger.error("Error generating document:", error);
    throw new Error(`Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateComplianceDocuments(
  companyProfile: CompanyProfile,
  framework: string,
  onProgress?: (progress: number, current: string) => void
): Promise<string[]> {
  const templates = frameworkTemplates[framework];
  if (!templates) {
    throw new Error(`No templates found for framework: ${framework}`);
  }

  const documents: string[] = [];
  const total = templates.length;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const progress = Math.round(((i + 1) / total) * 100);
    
    if (onProgress) {
      onProgress(progress, template.title);
    }

    try {
      const content = await generateDocument(template, companyProfile, framework);
      documents.push(content);
      
      // Add small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Error generating ${template.title}:`, error);
      // Continue with other documents even if one fails
      documents.push(`Error generating ${template.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return documents;
}
