# NIST SSDF Practice Mapping

## Secure Software Development Framework (SSDF) v1.1 Alignment

This document maps CyberDocGen's development practices to NIST Special Publication 800-218 Secure Software Development Framework.

---

## Practice Groups Overview

| Practice Group | CyberDocGen Coverage | Status |
|----------------|---------------------|--------|
| PO - Prepare Organization | 85% | ✅ Strong |
| PS - Protect Software | 90% | ✅ Strong |
| PW - Produce Well-Secured Software | 85% | ✅ Strong |
| RV - Respond to Vulnerabilities | 75% | ⚠️ Improving |

---

## PO: Prepare the Organization

### PO.1 - Define Security Requirements

| Task | Implementation | Evidence |
|------|----------------|----------|
| PO.1.1 - Security requirements from laws/regulations | SOC 2, ISO 27001, NIST 800-53 mapping | [SECURITY.md](./SECURITY.md) |
| PO.1.2 - Security requirements from customers | Multi-tenant isolation, MFA, encryption | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| PO.1.3 - Data classification | 4-tier classification implemented | Schema `dataClassification` field |

### PO.2 - Establish Roles and Responsibilities

| Task | Implementation | Evidence |
|------|----------------|----------|
| PO.2.1 - Define security roles | RBAC with admin/user/auditor roles | `shared/schema.ts` |
| PO.2.2 - Security training | Security checklist in PR template | `.github/PULL_REQUEST_TEMPLATE.md` |

### PO.3 - Implement Security Tooling

| Task | Implementation | Evidence |
|------|----------------|----------|
| PO.3.1 - SAST tools | ESLint security plugin, CodeQL | `eslint.config.js`, `ci.yml` |
| PO.3.2 - SCA tools | npm audit, Dependabot | `ci.yml` |
| PO.3.3 - Secret scanning | GitHub secret scanning enabled | Repository settings |

---

## PS: Protect the Software

### PS.1 - Protect Code from Unauthorized Access

| Task | Implementation | Evidence |
|------|----------------|----------|
| PS.1.1 - Version control access controls | GitHub branch protection | Repository settings |
| PS.1.2 - Commit signing | Recommended (not enforced) | CONTRIBUTING.md |

### PS.2 - Provide a Mechanism for Verifying Software Integrity

| Task | Implementation | Evidence |
|------|----------------|----------|
| PS.2.1 - Cryptographic hashes | SLSA provenance with SHA256 | `generator-generic-ossf-slsa3-publish.yml` |
| PS.2.2 - Digital signatures | SLSA Level 3 signing | GitHub OIDC |

### PS.3 - Archive and Protect Each Software Release

| Task | Implementation | Evidence |
|------|----------------|----------|
| PS.3.1 - Release archives | GitHub Releases with artifacts | Release workflow |
| PS.3.2 - SBOM generation | CycloneDX JSON | `ci.yml` |

---

## PW: Produce Well-Secured Software

### PW.1 - Design Secure Software

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.1.1 - Threat modeling | Architecture documentation | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| PW.1.2 - Security principles | Least privilege, defense in depth | Security middleware stack |

### PW.2 - Review Software Design

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.2.1 - Security design review | PR review process | PR template security checklist |

### PW.4 - Review Code

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.4.1 - Code review for security | Security checklist in PR | `.github/PULL_REQUEST_TEMPLATE.md` |
| PW.4.2 - Automated code analysis | ESLint security, CodeQL | `ci.yml` |

### PW.5 - Configure Compilation and Build

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.5.1 - Secure build configuration | TypeScript strict, linting | `tsconfig.json`, `eslint.config.js` |
| PW.5.2 - Build reproducibility | package-lock.json, npm ci | CI workflow |

### PW.6 - Configure Software Securely

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.6.1 - Secure defaults | Security middleware defaults | `server/middleware/security.ts` |
| PW.6.2 - Configuration documentation | Environment setup guide | [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) |

### PW.7 - Review and Test Code

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.7.1 - Security testing | 498 tests, security test cases | `tests/` directory |
| PW.7.2 - SAST/DAST | CodeQL, npm audit | `ci.yml` |

### PW.8 - Test Executable

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.8.1 - Dynamic testing | Integration tests | `tests/integration/` |
| PW.8.2 - Fuzz testing | Not implemented | Roadmap item |

### PW.9 - Configure Deployment Environment

| Task | Implementation | Evidence |
|------|----------------|----------|
| PW.9.1 - Secure deployment | HTTPS, security headers | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| PW.9.2 - Secrets management | Environment variables | `.env.example` |

---

## RV: Respond to Vulnerabilities

### RV.1 - Identify and Confirm Vulnerabilities

| Task | Implementation | Evidence |
|------|----------------|----------|
| RV.1.1 - Vulnerability monitoring | Dependabot, npm audit | GitHub Dependabot |
| RV.1.2 - Security advisories | GitHub Security Advisories | Repository settings |

### RV.2 - Assess Vulnerabilities

| Task | Implementation | Evidence |
|------|----------------|----------|
| RV.2.1 - Vulnerability prioritization | CVSS-based triage | [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) |
| RV.2.2 - Impact assessment | Per-component analysis | Security team process |

### RV.3 - Remediate Vulnerabilities

| Task | Implementation | Evidence |
|------|----------------|----------|
| RV.3.1 - Patch management | Monthly security updates | `todo.md` maintenance schedule |
| RV.3.2 - Verification | CI security gates | `ci.yml` |

---

## Security Acceptance Criteria Template

For each feature/PR, verify:

### Code Level
- [ ] Input validation using Zod schemas
- [ ] No hardcoded secrets or credentials
- [ ] Parameterized database queries (Drizzle ORM)
- [ ] Proper error handling without information leakage
- [ ] Audit logging for security-relevant actions

### Access Control
- [ ] Authentication required for protected routes
- [ ] Authorization checks before data access
- [ ] Multi-tenant isolation preserved
- [ ] Principle of least privilege applied

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] PII handling follows classification
- [ ] Data retention policies applied
- [ ] Secure transmission (HTTPS only)

### Testing
- [ ] Unit tests for security-critical code
- [ ] SAST scan passes (ESLint security)
- [ ] No high/critical vulnerabilities (npm audit)
- [ ] Security test cases included

---

**Document Owner**: Security Team  
**SSDF Version**: 1.1 (February 2022)  
**Last Updated**: January 2026
