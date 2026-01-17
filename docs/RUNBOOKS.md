# Operational Runbooks

## Overview

This directory contains operational runbooks for incident response and common operational procedures for CyberDocGen.

---

## Runbook Index

| Runbook | Trigger | Severity |
|---------|---------|----------|
| [Service Outage](#service-outage) | Application unavailable | P1 |
| [High Error Rate](#high-error-rate) | >1% 5xx errors | P2 |
| [AI Service Degradation](#ai-service-degradation) | AI model failures | P2 |
| [Database Issues](#database-issues) | Connection/query failures | P1 |
| [High Latency](#high-latency) | p99 > SLO | P3 |
| [Rate Limiting Triggered](#rate-limiting) | Excessive rate limit hits | P3 |
| [Security Incident](#security-incident) | Threat detection alert | P1 |

---

## Service Outage

### Symptoms
- Health endpoint (`/health`) returns non-200
- Application unreachable
- Load balancer reports unhealthy

### Diagnosis

```bash
# Check application health
curl -sS https://your-app.repl.co/health | jq

# Check container/process status
# (Replit dashboard or `replit` CLI)

# Check recent logs for errors
# View Replit logs panel
```

### Resolution Steps

1. **Check if deployment in progress**
   - Wait for deployment to complete
   - Rollback if deployment failed

2. **Check database connectivity**
   ```bash
   curl -sS https://your-app.repl.co/api/health/database
   ```

3. **Check environment variables**
   - Verify all required secrets are set
   - Check for expired API keys

4. **Restart application**
   - Replit: Stop and restart the Repl
   - Or: Trigger new deployment

5. **Rollback if needed**
   - Deploy previous known-good version

### Escalation
- If not resolved in 15 minutes → Page engineering lead
- If data loss suspected → Notify security team

---

## High Error Rate

### Symptoms
- Error rate > 1% for 5+ minutes
- Increased 5xx responses
- User reports of failures

### Diagnosis

```bash
# Check error patterns in logs
# Look for stack traces, error messages

# Check circuit breaker status
curl -sS https://your-app.repl.co/api/health | jq '.circuitBreakers'

# Check external service health
curl -sS https://your-app.repl.co/api/ai/health
```

### Resolution Steps

1. **Identify error source**
   - Parse logs for error patterns
   - Check if specific endpoint or all endpoints

2. **If AI service errors**
   - Check circuit breaker status
   - Verify API keys are valid
   - Check rate limits on provider dashboards

3. **If database errors**
   - Check connection pool status
   - Verify database is accessible
   - Check for slow queries

4. **If validation errors**
   - Check for malformed client requests
   - Review recent code changes

### Escalation
- If caused by code bug → Create hotfix PR
- If external service → Monitor and wait/fallback

---

## AI Service Degradation

### Symptoms
- AI requests failing or timing out
- Circuit breaker in OPEN state
- Increased latency on AI endpoints

### Diagnosis

```bash
# Check AI health
curl -sS https://your-app.repl.co/api/ai/health | jq

# Check individual model status
# OpenAI: https://status.openai.com
# Anthropic: https://status.anthropic.com
# Google: https://status.cloud.google.com
```

### Resolution Steps

1. **Check provider status pages**
   - If provider outage, wait for resolution

2. **Verify API keys**
   - Check if keys expired or rate limited
   - Verify billing status on provider dashboards

3. **Circuit breaker intervention**
   - If stuck open, may need manual reset
   - Endpoint: `POST /api/admin/circuit-breaker/reset`

4. **Fallback to secondary model**
   - System should auto-fallback
   - Verify fallback is working

5. **Rate limit check**
   - If rate limited, reduce request volume
   - Consider upgrading API tier

### Escalation
- Extended outage (>30 min) → Notify users
- All models failing → Emergency maintenance page

---

## Database Issues

### Symptoms
- Connection timeouts
- Slow queries
- Data inconsistency

### Diagnosis

```bash
# Check database health endpoint
curl -sS https://your-app.repl.co/api/health/database

# Check connection pool (in logs)
# Look for "pool exhausted" or connection errors
```

### Resolution Steps

1. **Connection issues**
   - Check DATABASE_URL is correct
   - Verify Neon database is online
   - Check connection limits

2. **Slow queries**
   - Identify slow queries from logs
   - Check for missing indexes
   - Review recent schema changes

3. **Pool exhaustion**
   - May indicate connection leaks
   - Restart application to reset pool
   - Review connection handling code

### Escalation
- Data corruption → Stop writes, notify security
- Extended outage → Enable maintenance mode

---

## High Latency

### Symptoms
- p99 latency exceeds SLO (>2s web, >30s AI)
- User reports of slowness
- Timeouts

### Diagnosis

```bash
# Check current latency metrics
# View Replit metrics or logs

# Identify slow endpoints
# Look for endpoints with high p99 in logs
```

### Resolution Steps

1. **Identify bottleneck**
   - Database queries?
   - AI model calls?
   - External API calls?

2. **Database optimization**
   - Add indexes for slow queries
   - Optimize N+1 queries
   - Enable query caching

3. **AI latency**
   - Expected for complex generation
   - Verify not stuck (timeout should fire)
   - Consider async processing

4. **Resource constraints**
   - Check memory/CPU usage
   - Consider scaling up

### Escalation
- Sustained high latency → Investigate root cause
- Impacting users → Enable degraded mode

---

## Rate Limiting

### Symptoms
- High volume of 429 responses
- Rate limit alerts
- Potential abuse detection

### Diagnosis

```bash
# Check rate limit logs
# Look for IPs/users with high request counts

# Review rate limit configuration
# Check if thresholds appropriate
```

### Resolution Steps

1. **Identify source**
   - Single user/IP → Potential abuse
   - Broad → Organic traffic spike

2. **If abuse**
   - Block offending IP/user
   - Review for security implications
   - Update rate limit rules

3. **If legitimate traffic**
   - Consider raising limits temporarily
   - Add caching to reduce load
   - Scale infrastructure

### Escalation
- DDoS suspected → Enable DDoS protection mode
- Persistent abuse → Security team notification

---

## Security Incident

### Symptoms
- Threat detection alerts
- Unusual access patterns
- Authentication failures spike

### Diagnosis

```bash
# Review audit logs
curl -sS https://your-app.repl.co/api/audit-trail?limit=100 | jq

# Check threat detection logs
# Look for SQLi, XSS, injection patterns
```

### Resolution Steps

1. **Assess severity**
   - Is data at risk?
   - Are systems compromised?
   - User impact?

2. **Contain**
   - Block suspicious IPs
   - Revoke compromised sessions
   - Disable affected functionality if needed

3. **Investigate**
   - Review full audit trail
   - Identify attack vector
   - Determine scope of impact

4. **Remediate**
   - Patch vulnerability
   - Rotate affected credentials
   - Notify affected users if required

5. **Document**
   - Complete incident report
   - Update runbooks
   - Conduct post-mortem

### Escalation
- Data breach → Legal/compliance team immediately
- Active attack → Enable emergency lockdown

---

## Contacts

| Role | Contact |
|------|---------|
| On-Call Engineer | [Rotation schedule] |
| Engineering Lead | [Contact info] |
| Security Team | security@company.com |
| Executive (P1) | [Contact info] |

---

## Appendix: Useful Commands

```bash
# Application health
curl -sS https://your-app.repl.co/health | jq

# AI service health
curl -sS https://your-app.repl.co/api/ai/health | jq

# Database health
curl -sS https://your-app.repl.co/api/health/database | jq

# Recent audit logs
curl -sS "https://your-app.repl.co/api/audit-trail?limit=50" | jq

# Check specific user session
curl -sS "https://your-app.repl.co/api/admin/sessions/{userId}" | jq
```

---

**Document Owner**: SRE Team  
**Last Updated**: January 2026  
**Review Schedule**: Quarterly
