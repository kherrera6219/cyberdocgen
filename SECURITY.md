# Security Policy

CyberDocGen contains enterprise compliance workflows, authentication flows, AI integrations, and document-handling paths. Treat security findings as sensitive.

## Supported Versions

| Version | Status |
| --- | --- |
| `main` | Supported |
| Older tags and historical snapshots | Not supported |

## Reporting A Vulnerability

Do not open a public GitHub issue for security vulnerabilities.

Report findings privately to the repository maintainers through a non-public channel:

- GitHub private vulnerability reporting or security advisories, if enabled for the repository
- The existing maintainer or customer support channel you already use for this project

If you are unsure which private route to use, start with the maintainer channel described in [SUPPORT.md](SUPPORT.md) and state that the report is security-sensitive.

## What To Include

Please include:

- A clear description of the issue and the affected component
- Reproduction steps or a proof of concept
- Expected impact, including auth, tenant-isolation, data-exposure, or RCE implications if relevant
- Version, branch, commit SHA, or deployment mode involved
- Any proposed remediation or containment notes if you have them

## Disclosure Expectations

- Please give maintainers reasonable time to investigate and remediate before public disclosure.
- Coordinate disclosure timing for issues that affect deployed cloud or desktop builds.
- Avoid publishing exploit details while a fix is in progress.

## Related Security Documentation

- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/SECURITY_PRODUCTION_REVIEW.md](docs/SECURITY_PRODUCTION_REVIEW.md)
- [docs/INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md)
- [docs/SUPPLY_CHAIN_SECURITY.md](docs/SUPPLY_CHAIN_SECURITY.md)
