# Supply Chain Security

## Overview

This document describes the software supply chain security measures implemented in CyberDocGen, aligned with SLSA Level 3 requirements.

---

## SLSA Compliance Level

**Current Level: SLSA Level 3**

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Build as code | ✅ | GitHub Actions workflows |
| Scripted build | ✅ | `npm run build` |
| Isolated build | ✅ | GitHub-hosted runners |
| Hermetic build | ✅ | package-lock.json |
| Provenance generated | ✅ | slsa-github-generator |
| Provenance non-falsifiable | ✅ | Signed by GitHub |
| Provenance dependencies complete | ✅ | CycloneDX SBOM |

---

## Build Provenance

### Provenance Generation
Every release build generates SLSA provenance attestation:

```yaml
# .github/workflows/generator-generic-ossf-slsa3-publish.yml
- Builds application artifacts
- Generates CycloneDX SBOM
- Creates cryptographically signed provenance
- Attaches to GitHub release
```

### Provenance Contents
- Builder identity (GitHub Actions)
- Build instructions (workflow reference)
- Source repository and commit
- Dependencies (via SBOM)
- Timestamp

### Verification
```bash
# Verify provenance of release artifact
slsa-verifier verify-artifact \
  --provenance-path cyberdocgen.intoto.jsonl \
  --source-uri github.com/kherrera6219/cyberdocgen \
  cyberdocgen-release.tar.gz
```

---

## Software Bill of Materials (SBOM)

### Format
- **Standard**: CycloneDX 1.5
- **Generated**: On every build in CI
- **Location**: `sbom.cdx.json` in release artifacts

### Contents
- Direct dependencies
- Transitive dependencies
- Version information
- License information
- Package URLs (purl)

### Generation
```bash
# Generate SBOM manually
npx @cyclonedx/cyclonedx-npm --output-file sbom.cdx.json
```

---

## Dependency Management

### Pinning Strategy
- `package-lock.json` committed to repository
- Exact versions used in production
- Lock file integrity verified in CI

### Vulnerability Scanning
```yaml
# In CI pipeline
- npm audit --audit-level=high
- Dependabot enabled for automated updates
- Snyk integration for continuous monitoring
```

### Approved Dependencies
- All new dependencies require security review
- License must be on approved list (see LICENSES_ALLOWED.md)
- Known vulnerabilities must be addressed before merge

---

## Artifact Integrity

### Build Artifacts
- Production bundles hashed (SHA256)
- Hashes included in provenance
- Immutable artifact storage

### Container Images (If Used)
- Signed with cosign
- Stored in private registry
- Scanned for vulnerabilities

---

## Source Control Security

### Branch Protection
- Main branch protected
- Required reviews: 1+
- Status checks must pass
- Force push disabled

### Commit Signing (Recommended)
```bash
# Configure git signing
git config --global commit.gpgsign true
git config --global user.signingkey <key-id>
```

GitHub shows "Verified" badge on signed commits.

---

## CI/CD Security

### Workflow Security
- Minimal permissions (`contents: read`)
- No secrets in workflow files
- Pinned action versions (SHA, not tags)
- Trusted GitHub-hosted runners

### Secret Management
- Secrets stored in GitHub Secrets
- Environment-scoped where needed
- Rotated on compromise

---

## Third-Party Code Review

### Evaluation Criteria
1. **Maintainer reputation**: Active maintenance, security response
2. **Dependency count**: Prefer minimal dependencies
3. **Security history**: Check CVE history
4. **License compatibility**: Must be approved
5. **Code quality**: TypeScript types, tests

### Approval Process
1. Developer proposes dependency in PR
2. Security review conducted
3. License verified
4. Added to dependency allowlist
5. Merged after approval

---

## Incident Response

### Compromised Dependency
1. **Identify**: CVE notification or vulnerability scan
2. **Assess**: Impact on CyberDocGen
3. **Mitigate**: Update, patch, or remove
4. **Notify**: If customer impact, notify affected users
5. **Document**: Post-incident report

### Build System Compromise
1. **Isolate**: Stop affected workflows
2. **Investigate**: Review logs, audit actions
3. **Remediate**: Rotate secrets, revoke tokens
4. **Verify**: Confirm clean state
5. **Resume**: Restore operations

---

**Document Owner**: Security Team  
**Last Updated**: January 2026  
**Review Schedule**: Quarterly
