# Definition of Done Checklist

## Overview

All features, bug fixes, and changes must meet this Definition of Done before being considered complete and ready for release.

---

## Code Quality

- [ ] Code follows TypeScript strict mode (no `any` types without justification)
- [ ] ESLint passes with zero warnings
- [ ] Prettier formatting applied
- [ ] No console.log statements (use logger)
- [ ] No TODO comments without linked issue
- [ ] Functions are < 50 lines (or documented exception)
- [ ] Cyclomatic complexity < 10 per function

---

## Testing

- [ ] Unit tests written for new functionality
- [ ] Unit test coverage ≥ 80% for changed files
- [ ] Integration tests for API endpoints
- [ ] All existing tests pass
- [ ] Edge cases identified and tested
- [ ] Error scenarios tested

---

## Security

- [ ] Input validation using Zod schemas
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF token required for state-changing operations
- [ ] Authorization checks implemented
- [ ] Sensitive data encrypted/redacted in logs
- [ ] No secrets in code (environment variables only)
- [ ] Security review for high-risk changes

---

## Documentation

- [ ] Code comments for complex logic
- [ ] JSDoc for public functions/classes
- [ ] API endpoint documented (OpenAPI annotations)
- [ ] README updated if feature impacts usage
- [ ] Changelog entry added
- [ ] User-facing changes documented

---

## Performance

- [ ] Database queries optimized (no N+1)
- [ ] API responses < 200ms (non-AI operations)
- [ ] No memory leaks identified
- [ ] Pagination for list endpoints
- [ ] Caching considered where appropriate

---

## Accessibility (Frontend)

- [ ] Keyboard navigation works
- [ ] ARIA labels for interactive elements
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Screen reader tested
- [ ] Focus management correct

---

## Review Process

- [ ] Self-reviewed before PR
- [ ] PR description explains changes
- [ ] Linked to issue/ticket
- [ ] Screenshots for UI changes
- [ ] At least one peer review approval
- [ ] CI pipeline passes

---

## Deployment Readiness

- [ ] Environment variables documented if new
- [ ] Database migrations tested
- [ ] Rollback plan identified
- [ ] Feature flag if gradual rollout needed
- [ ] Monitoring/alerts configured for new endpoints

---

## AI-Specific (If Applicable)

- [ ] Prompt injection tests pass
- [ ] PII handling verified
- [ ] Output moderation enabled
- [ ] Token usage within limits
- [ ] Fallback behavior tested
- [ ] Cost estimation reviewed

---

**Document Owner**: Engineering Team  
**Last Updated**: January 2026  
**Review Schedule**: Quarterly
