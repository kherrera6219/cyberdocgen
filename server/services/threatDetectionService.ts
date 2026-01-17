
import { logger } from '../utils/logger';
import { alertingService } from './alertingService';
import { auditService, RiskLevel, AuditAction } from './auditService';

interface ThreatPattern {
  id: string;
  name: string;
  pattern: RegExp | ((data: any) => boolean);
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  blocked: boolean;
}

export class ThreatDetectionService {
  private patterns: Map<string, ThreatPattern> = new Map();
  private suspiciousIPs = new Map<string, { attempts: number; lastAttempt: Date }>();
  private rateLimitViolations = new Map<string, number>();
  private securityEvents: SecurityEvent[] = [];

  constructor() {
    this.initializeThreatPatterns();
    this.startCleanupTasks();
  }

  private initializeThreatPatterns() {
    const patterns: ThreatPattern[] = [
      {
        id: 'sql_injection',
        name: 'SQL Injection Attempt',
        pattern: /(\bselect\b.*\bfrom\b|\bunion\b.*\bselect\b|\binsert\b.*\binto\b|\bdelete\b.*\bfrom\b|\bdrop\b.*\btable\b)/i,
        severity: 'high',
        description: 'Potential SQL injection attack detected'
      },
      {
        id: 'xss_attempt',
        name: 'Cross-Site Scripting',
        pattern: /<script[^>]*>.*?<\/script>/gi,
        severity: 'medium',
        description: 'Potential XSS attack detected'
      },
      {
        id: 'path_traversal',
        name: 'Path Traversal',
        pattern: new RegExp('(\\.\\.[\\\\/]){2,}'),
        severity: 'high',
        description: 'Directory traversal attempt detected'
      },
      {
        id: 'command_injection',
        name: 'Command Injection',
        pattern: /(;\s*rm\s+-rf|;\s*cat\s+\/etc\/passwd|;\s*wget\s+|;\s*curl\s+)/i,
        severity: 'critical',
        description: 'Command injection attempt detected'
      },
      {
        id: 'excessive_requests',
        name: 'Excessive Requests',
        pattern: (data: any) => {
          const ip = data.ip;
          const current = this.rateLimitViolations.get(ip) || 0;
          return current > 100; // 100+ violations in window
        },
        severity: 'medium',
        description: 'Excessive request rate from IP'
      }
    ];

    patterns.forEach(pattern => this.patterns.set(pattern.id, pattern));
  }

  analyzeRequest(req: any): SecurityEvent | null {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || '';
    const url = req.url;
    const body = req.body ? JSON.stringify(req.body) : '';
    const query = req.query ? JSON.stringify(req.query) : '';

    // Analyze all patterns
    for (const [patternId, pattern] of Array.from(this.patterns.entries())) {
      let isMatch = false;
      const testData = `${url} ${body} ${query}`;

      if (pattern.pattern instanceof RegExp) {
        isMatch = pattern.pattern.test(testData);
      } else if (typeof pattern.pattern === 'function') {
        isMatch = pattern.pattern({ ip, userAgent, url, body, query });
      }

      if (isMatch) {
        return this.createSecurityEvent(pattern, {
          ip,
          userAgent,
          url,
          body: body.substring(0, 200),
          query
        });
      }
    }

    // Check for brute force attempts
    if (this.isBruteForceAttempt(ip)) {
      return this.createSecurityEvent({
        id: 'brute_force',
        name: 'Brute Force Attack',
        pattern: () => true,
        severity: 'high',
        description: 'Brute force attack detected'
      }, { ip, attempts: this.suspiciousIPs.get(ip)?.attempts });
    }

    return null;
  }

  recordFailedLogin(ip: string) {
    const current = this.suspiciousIPs.get(ip) || { attempts: 0, lastAttempt: new Date() };
    current.attempts++;
    current.lastAttempt = new Date();
    this.suspiciousIPs.set(ip, current);

    // Alert on multiple failed attempts
    if (current.attempts > 5) {
      alertingService.updateMetric('security_events', 1);
    }
  }

  recordRateLimitViolation(ip: string) {
    const current = this.rateLimitViolations.get(ip) || 0;
    this.rateLimitViolations.set(ip, current + 1);
  }

  private isBruteForceAttempt(ip: string): boolean {
    const attempts = this.suspiciousIPs.get(ip);
    if (!attempts) return false;

    // Consider brute force if more than 10 attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return attempts.attempts > 10 && attempts.lastAttempt > fifteenMinutesAgo;
  }

  private createSecurityEvent(pattern: ThreatPattern, metadata: Record<string, any>): SecurityEvent {
    const event: SecurityEvent = {
      id: `${pattern.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: pattern.id,
      severity: pattern.severity,
      source: metadata.ip || 'unknown',
      description: pattern.description,
      metadata,
      timestamp: new Date(),
      blocked: pattern.severity === 'critical' || pattern.severity === 'high'
    };

    this.securityEvents.push(event);
    
    // Log security event
    logger.error('Security threat detected', {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      source: event.source,
      description: event.description,
      blocked: event.blocked
    });

    // Audit log
    auditService.logAuditEvent({
      userId: 'system',
      action: AuditAction.CREATE,
      resourceType: 'security_event',
      resourceId: event.id,
      ipAddress: metadata.ip || '127.0.0.1',
      riskLevel: this.severityToRiskLevel(event.severity),
      additionalContext: {
        threatType: event.type,
        blocked: event.blocked,
        ...metadata
      }
    });

    // Update alerting metrics
    alertingService.updateMetric('security_events', 1);

    return event;
  }

  private severityToRiskLevel(severity: string): RiskLevel {
    switch (severity) {
      case 'critical': return RiskLevel.CRITICAL;
      case 'high': return RiskLevel.HIGH;
      case 'medium': return RiskLevel.MEDIUM;
      default: return RiskLevel.LOW;
    }
  }

  shouldBlockRequest(event: SecurityEvent): boolean {
    return event.blocked;
  }

  getRecentSecurityEvents(limit = 100): SecurityEvent[] {
    return this.securityEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getSecurityMetrics() {
    const events = this.securityEvents;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => e.timestamp > last24Hours);

    return {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      blockedRequests: events.filter(e => e.blocked).length,
      criticalThreats: recentEvents.filter(e => e.severity === 'critical').length,
      suspiciousIPs: this.suspiciousIPs.size,
      topThreatTypes: this.getTopThreatTypes(recentEvents)
    };
  }

  private getTopThreatTypes(events: SecurityEvent[]): Array<{ type: string; count: number }> {
    const counts = new Map<string, number>();
    events.forEach(event => {
      counts.set(event.type, (counts.get(event.type) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private startCleanupTasks() {
    // Clean up old security events (keep last 30 days)
    setInterval(() => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      this.securityEvents = this.securityEvents.filter(e => e.timestamp > thirtyDaysAgo);
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    // Clean up old suspicious IPs (reset after 24 hours of inactivity)
    setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      for (const [ip, data] of Array.from(this.suspiciousIPs.entries())) {
        if (data.lastAttempt < oneDayAgo) {
          this.suspiciousIPs.delete(ip);
        }
      }
    }, 60 * 60 * 1000); // Hourly cleanup
  }
}

export const threatDetectionService = new ThreatDetectionService();
