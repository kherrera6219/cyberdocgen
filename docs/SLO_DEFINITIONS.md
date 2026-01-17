# Service Level Objectives (SLO) Definitions

## Overview

This document defines Service Level Objectives (SLOs) and their associated Service Level Indicators (SLIs) for CyberDocGen. These metrics ensure we maintain our reliability commitments to users.

## SLO Summary

| Service | Availability | Latency (p99) | Error Rate |
|---------|-------------|---------------|------------|
| Web Application | 99.9% | < 2s | < 0.1% |
| API Endpoints | 99.9% | < 500ms | < 0.1% |
| AI Services | 99.5% | < 30s | < 1% |
| Database | 99.99% | < 100ms | < 0.01% |

---

## Detailed SLOs

### 1. Web Application

**Target**: 99.9% availability (8.76 hours downtime/year)

#### SLIs
- **Availability**: Percentage of successful HTTP responses (2xx, 3xx) / total requests
- **Latency**: Time from request received to response sent
- **Error Rate**: Percentage of 5xx responses / total requests

#### Thresholds
| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Availability | > 99.9% | > 99.5% | < 99.5% |
| p50 Latency | < 200ms | < 500ms | > 500ms |
| p99 Latency | < 2s | < 5s | > 5s |
| Error Rate | < 0.1% | < 0.5% | > 0.5% |

#### Measurement
- Health endpoint: `GET /health`
- Synthetic monitoring every 60 seconds
- Real User Monitoring (RUM) for latency

---

### 2. API Endpoints

**Target**: 99.9% availability per endpoint

#### Critical Endpoints
| Endpoint | Latency SLO (p99) | Error Budget |
|----------|-------------------|--------------|
| `POST /api/auth/login` | < 500ms | 0.1% |
| `GET /api/documents` | < 300ms | 0.1% |
| `POST /api/documents` | < 1s | 0.1% |
| `GET /api/gap-analysis` | < 2s | 0.5% |
| `POST /api/ai/generate` | < 30s | 1% |

#### Measurement
- Per-endpoint latency histograms
- Error rate tracking by endpoint and status code
- API health: `GET /api/health`

---

### 3. AI Services

**Target**: 99.5% availability (43.8 hours downtime/year)

#### SLIs
- **Availability**: AI model responses successfully returned
- **Latency**: Time from AI request to complete response
- **Quality**: Content moderation pass rate

#### Thresholds
| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Availability | > 99.5% | > 99% | < 99% |
| p50 Latency | < 5s | < 15s | > 15s |
| p99 Latency | < 30s | < 60s | > 60s |
| Guardrail Pass Rate | > 99% | > 95% | < 95% |

#### Fallback Behavior
- Primary model failure → Fallback to secondary model
- All models fail → Return cached response or graceful degradation
- Timeout after 60 seconds → Return partial response with warning

---

### 4. Database

**Target**: 99.99% availability (52.6 minutes downtime/year)

#### SLIs
- **Connection Success**: Successful database connections / attempts
- **Query Latency**: Time to execute queries
- **Replication Lag**: Time delay for read replicas

#### Thresholds
| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Connection Success | > 99.99% | > 99.9% | < 99.9% |
| p50 Query Latency | < 10ms | < 50ms | > 50ms |
| p99 Query Latency | < 100ms | < 500ms | > 500ms |

---

## Error Budgets

### Monthly Error Budget Calculation

| Service | SLO | Error Budget (monthly) | Minutes Allowed |
|---------|-----|------------------------|-----------------|
| Web App | 99.9% | 0.1% | 43.2 min |
| API | 99.9% | 0.1% | 43.2 min |
| AI | 99.5% | 0.5% | 216 min |
| Database | 99.99% | 0.01% | 4.32 min |

### Error Budget Policy

1. **Budget Healthy (> 50% remaining)**: Normal development velocity
2. **Budget Warning (25-50% remaining)**: Increase monitoring, limit risky deployments
3. **Budget Critical (< 25% remaining)**: Freeze non-critical changes, focus on reliability
4. **Budget Exhausted (0%)**: All deployments require SRE approval

---

## Alerting

### Alert Tiers

| Tier | Response Time | Notification | Example |
|------|---------------|--------------|---------|
| P1 - Critical | 5 minutes | Page on-call | Complete service outage |
| P2 - High | 15 minutes | Slack + Email | API errors > 5% |
| P3 - Medium | 1 hour | Slack | Latency degradation |
| P4 - Low | 24 hours | Email | Approaching error budget |

### Alert Rules

```yaml
# API Error Rate Alert
- alert: HighAPIErrorRate
  expr: (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) > 0.01
  for: 2m
  labels:
    severity: P2
  annotations:
    summary: "API error rate above 1%"

# Latency Alert
- alert: HighAPILatency
  expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: P3
  annotations:
    summary: "p99 latency above 2 seconds"

# AI Service Alert
- alert: AIServiceDegraded
  expr: (sum(rate(ai_requests_failed[5m])) / sum(rate(ai_requests_total[5m]))) > 0.05
  for: 5m
  labels:
    severity: P2
  annotations:
    summary: "AI service error rate above 5%"
```

---

## Dashboards

### Key Metrics Dashboard

Display the following in real-time:
1. **Availability**: Current uptime percentage (last 30 days)
2. **Error Budget**: Remaining budget with trend
3. **Latency**: p50, p95, p99 over time
4. **Request Volume**: Requests per second
5. **Error Rate**: 5xx errors over time
6. **AI Health**: Model response times and success rates

---

## Review Process

- **Weekly**: Review SLI trends and error budget consumption
- **Monthly**: SLO review meeting with stakeholders
- **Quarterly**: Adjust SLO targets based on business needs
- **Post-Incident**: Review if SLOs need adjustment

---

**Document Owner**: SRE Team  
**Last Updated**: January 2026  
**Next Review**: April 2026
