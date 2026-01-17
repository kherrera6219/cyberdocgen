# Alerting Rules Configuration

## Overview

This document defines the alerting rules for CyberDocGen, specifying thresholds, notification channels, and escalation procedures for operational and security alerts.

---

## Alert Severity Levels

| Severity | Response Time | Example |
|----------|---------------|---------|
| **P1 - Critical** | 5 minutes | Service down, data breach |
| **P2 - High** | 15 minutes | AI services degraded, auth failures spike |
| **P3 - Medium** | 1 hour | Elevated error rate, high latency |
| **P4 - Low** | 24 hours | Disk space warning, non-critical bugs |

---

## Availability Alerts

### Service Health

```yaml
- name: ServiceDown
  severity: P1
  condition: health_check_failures >= 3 in 2 minutes
  description: Health endpoint returning non-200
  notification: PagerDuty, Slack #incidents
  
- name: HighErrorRate
  severity: P2
  condition: error_rate_5xx > 1% for 5 minutes
  description: Error rate exceeds 1% threshold
  notification: Slack #alerts, Email on-call
  
- name: ElevatedErrorRate
  severity: P3
  condition: error_rate_5xx > 0.5% for 10 minutes
  description: Error rate elevated above baseline
  notification: Slack #alerts
```

### External Dependencies

```yaml
- name: AIServiceDown
  severity: P2
  condition: ai_availability < 99% for 5 minutes
  description: AI provider (OpenAI/Anthropic/Google) unavailable
  notification: Slack #alerts
  
- name: DatabaseConnectionFailure
  severity: P1
  condition: database_connection_errors > 0 for 1 minute
  description: Cannot connect to PostgreSQL
  notification: PagerDuty, Slack #incidents
  
- name: CircuitBreakerOpen
  severity: P2
  condition: circuit_breaker_state == "OPEN"
  description: Circuit breaker tripped for external service
  notification: Slack #alerts
```

---

## Latency Alerts

```yaml
- name: HighAPILatency
  severity: P3
  condition: api_p99_latency > 2000ms for 5 minutes
  description: API response time exceeds SLO (2s p99)
  notification: Slack #alerts
  
- name: CriticalAPILatency
  severity: P2
  condition: api_p99_latency > 5000ms for 2 minutes
  description: API response time critically high
  notification: Slack #alerts, Email on-call
  
- name: AILatencyHigh
  severity: P3
  condition: ai_generation_p99 > 30000ms for 5 minutes
  description: AI generation exceeds 30s SLO
  notification: Slack #alerts
```

---

## Security Alerts

```yaml
- name: AuthenticationFailureSpike
  severity: P2
  condition: auth_failures > 50 per minute from single IP
  description: Potential brute force attack
  notification: Slack #security, Security team email

- name: SecurityThreatDetected
  severity: P1
  condition: threat_detection_triggered == true
  description: Security threat blocked by WAF/detection
  notification: PagerDuty, Slack #security
  
- name: CSRFViolation
  severity: P2
  condition: csrf_failures > 10 per minute
  description: Multiple CSRF token failures
  notification: Slack #security

- name: RateLimitExceeded
  severity: P3
  condition: rate_limit_429 > 100 in 5 minutes
  description: Significant rate limiting being applied
  notification: Slack #alerts

- name: PromptInjectionAttempt
  severity: P2
  condition: prompt_injection_blocked > 5 per hour
  description: Multiple prompt injection attempts detected
  notification: Slack #security
```

---

## Resource Alerts

```yaml
- name: HighMemoryUsage
  severity: P3
  condition: memory_usage > 85% for 10 minutes
  description: Memory utilization high
  notification: Slack #alerts

- name: HighCPUUsage
  severity: P3
  condition: cpu_usage > 80% for 10 minutes
  description: CPU utilization high
  notification: Slack #alerts

- name: DiskSpaceLow
  severity: P2
  condition: disk_usage > 90%
  description: Disk space running low
  notification: Slack #alerts, Email on-call
```

---

## Error Budget Alerts

```yaml
- name: ErrorBudgetBurnRate
  severity: P2
  condition: error_budget_consumed > 50% in 1 day
  description: Burning error budget too fast
  notification: Slack #sre, Email engineering lead

- name: ErrorBudgetExhausted
  severity: P1
  condition: error_budget_remaining < 10%
  description: Error budget nearly exhausted
  notification: PagerDuty, Slack #sre
  action: Freeze non-critical deploys
```

---

## Notification Channels

| Channel | Use Case | Escalation |
|---------|----------|------------|
| **Slack #alerts** | All P3+ alerts | Default |
| **Slack #security** | Security-specific | Security team |
| **Slack #incidents** | Active incidents | All responders |
| **Email on-call** | P2+ after hours | On-call engineer |
| **PagerDuty** | P1 only | Immediate page |

---

## Escalation Matrix

| Time Without Ack | Action |
|-----------------|--------|
| 5 minutes | Re-notify primary on-call |
| 15 minutes | Escalate to secondary on-call |
| 30 minutes | Escalate to engineering lead |
| 1 hour | Escalate to VP Engineering |

---

## Alert Suppression

### Maintenance Windows
- Alerts suppressed during scheduled maintenance
- Require explicit maintenance mode activation
- Auto-resume after window

### Known Issues
- Alerts can be silenced with linked issue
- Maximum silence duration: 7 days
- Requires justification

---

## Alert Testing

### Regular Testing
- Monthly alert fire drill
- Verify notification delivery
- Update contact info

### New Alert Validation
- Test in staging first
- Verify threshold accuracy
- Confirm notification routing

---

**Document Owner**: SRE Team  
**Last Updated**: January 2026  
**Review Schedule**: Quarterly
