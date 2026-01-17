# Chaos Testing Framework

## Overview

This document describes the chaos testing approach for CyberDocGen, enabling proactive identification of system weaknesses through controlled failure injection.

---

## Chaos Testing Principles

1. **Start small**: Test in staging first
2. **Define steady state**: Know what "normal" looks like
3. **Hypothesize**: Predict system behavior under stress
4. **Run experiments**: Inject controlled failures
5. **Verify and learn**: Compare results to hypothesis
6. **Minimize blast radius**: Scope experiments carefully

---

## Test Categories

### 1. External Service Failures

| Test | Method | Expected Behavior |
|------|--------|-------------------|
| OpenAI API unavailable | Mock 503 response | Fallback to Claude/Gemini |
| All AI providers down | Mock all 503s | Graceful error, cached responses |
| Database connection lost | Kill connection | Circuit breaker opens, queued retry |
| Cloud storage timeout | Inject latency | Request timeout, error message |

### 2. Resource Exhaustion

| Test | Method | Expected Behavior |
|------|--------|-------------------|
| Memory pressure | Allocate large arrays | Graceful degradation |
| CPU saturation | Compute-heavy loops | Request queuing, no crash |
| Connection pool exhaustion | Hold connections | Backpressure, retry logic |
| Disk full | Fill temp directory | Logged error, no data loss |

### 3. Network Issues

| Test | Method | Expected Behavior |
|------|--------|-------------------|
| High latency | TC netem delay injection | Timeouts fire correctly |
| Packet loss | Drop random packets | Retry logic activates |
| DNS failure | Block DNS resolution | Cached DNS, error handling |
| Partial response | Truncate responses | Proper error message |

### 4. Security Chaos

| Test | Method | Expected Behavior |
|------|--------|-------------------|
| Invalid session flood | Send bad sessions | Rate limiting activates |
| CSRF bypass attempt | Remove CSRF token | Request rejected |
| Injection attacks | SQLi/XSS payloads | Input validation blocks |

---

## Test Implementation

### Using Vitest for Chaos Tests

```typescript
// tests/chaos/ai-service-failure.test.ts
import { describe, it, expect, vi } from 'vitest';
import { aiOrchestrator } from '@server/services/aiOrchestrator';

describe('Chaos: AI Service Failures', () => {
  it('should fallback when primary provider fails', async () => {
    // Mock OpenAI failure
    vi.mock('@server/utils/openai', () => ({
      generateCompletion: vi.fn().mockRejectedValue(new Error('Service unavailable'))
    }));
    
    const result = await aiOrchestrator.generate({
      prompt: 'Test prompt',
      fallbackEnabled: true
    });
    
    // Should succeed with fallback
    expect(result.success).toBe(true);
    expect(result.provider).not.toBe('openai');
  });

  it('should return cached response when all providers fail', async () => {
    // Mock all providers failing
    // ...setup mocks...
    
    const result = await aiOrchestrator.generate({
      prompt: 'Test prompt',
      useCache: true
    });
    
    expect(result.fromCache).toBe(true);
  });
});
```

### Circuit Breaker Testing

```typescript
// tests/chaos/circuit-breaker.test.ts
import { CircuitBreaker } from '@server/utils/circuitBreaker';

describe('Chaos: Circuit Breaker', () => {
  it('should open after threshold failures', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000
    });
    
    // Cause failures
    for (let i = 0; i < 3; i++) {
      await breaker.execute(() => Promise.reject(new Error('fail')));
    }
    
    expect(breaker.getState()).toBe('OPEN');
  });

  it('should attempt recovery after timeout', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 100 // Short for testing
    });
    
    // Open the circuit
    // ...
    
    // Wait for recovery
    await new Promise(r => setTimeout(r, 150));
    
    expect(breaker.getState()).toBe('HALF_OPEN');
  });
});
```

---

## Staging Environment Tests

### Prerequisites
- Isolated staging environment
- Monitoring active
- Rollback capability ready

### Execution Checklist

```markdown
## Pre-Chaos
- [ ] Verify staging is isolated
- [ ] Baseline metrics captured
- [ ] Team notified of test window
- [ ] Rollback tested

## During Chaos
- [ ] Monitor error rates
- [ ] Verify alerts fire
- [ ] Check user experience
- [ ] Log all observations

## Post-Chaos
- [ ] Restore normal operation
- [ ] Analyze results
- [ ] Document learnings
- [ ] Create action items
```

---

## Chaos Test Schedule

| Frequency | Tests | Environment |
|-----------|-------|-------------|
| Per PR | Mock-based unit chaos tests | CI |
| Weekly | Dependency failure scenarios | Staging |
| Monthly | Full chaos game day | Staging |
| Quarterly | Extended reliability test | Staging |

---

## Runbook Integration

Each chaos test should have a corresponding runbook entry:

| Test | Runbook Reference |
|------|-------------------|
| AI service failure | [AI Service Degradation](RUNBOOKS.md#ai-service-degradation) |
| Database issues | [Database Issues](RUNBOOKS.md#database-issues) |
| High error rate | [High Error Rate](RUNBOOKS.md#high-error-rate) |

---

## Success Criteria

A system passes chaos testing when:

1. **No data loss** under any failure condition
2. **Graceful degradation** instead of crashes
3. **Alerts fire** within expected timeframes
4. **Recovery** happens automatically or per runbook
5. **User experience** remains acceptable

---

## Tools

| Tool | Purpose | Integration |
|------|---------|-------------|
| Vitest | Mock-based chaos tests | CI pipeline |
| toxiproxy | Network failure injection | Staging |
| chaos-monkey (if K8s) | Pod termination | Production (carefully) |
| Custom scripts | Specific failure scenarios | On-demand |

---

## Example Game Day

### Scenario: AI Provider Outage

**Duration**: 1 hour  
**Participants**: Engineering, SRE, Support

**Timeline**:
| Time | Action |
|------|--------|
| 0:00 | Inject OpenAI API failure |
| 0:05 | Verify fallback activates |
| 0:10 | Inject Anthropic failure |
| 0:15 | Verify final fallback (Gemini) |
| 0:20 | Inject all providers failure |
| 0:25 | Verify graceful error messages |
| 0:30 | Restore OpenAI |
| 0:35 | Verify recovery |
| 0:45 | Debrief and document |

---

**Document Owner**: SRE Team  
**Last Updated**: January 2026  
**Review Schedule**: Quarterly
