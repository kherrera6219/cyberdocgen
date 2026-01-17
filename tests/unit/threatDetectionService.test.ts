import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThreatDetectionService } from '../../server/services/threatDetectionService';
import { alertingService } from '../../server/services/alertingService';
import { auditService } from '../../server/services/auditService';
import { logger } from '../../server/utils/logger';

// Mock dependencies
vi.mock('../../server/services/alertingService', () => ({
  alertingService: {
    updateMetric: vi.fn(),
  },
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(),
  },
  RiskLevel: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  },
  AuditAction: {
    CREATE: 'create',
  },
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ThreatDetectionService', () => {
  let service: ThreatDetectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ThreatDetectionService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('SQL Injection Detection', () => {
    it('detects basic SQL injection patterns', () => {
      const strongReq = {
        url: '/api/users',
        query: { id: "UNION SELECT * FROM users" },
        ip: '127.0.0.1',
        get: () => 'Mozilla/5.0'
      };

      const event = service.analyzeRequest(strongReq);
      
      expect(event).not.toBeNull();
      expect(event?.type).toBe('sql_injection');
      expect(event?.severity).toBe('high');
      expect(event?.blocked).toBe(true);
      expect(alertingService.updateMetric).toHaveBeenCalledWith('security_events', 1);
    });
  });

  describe('XSS Detection', () => {
    it('detects script tags', () => {
      const req = {
        url: '/api/comments',
        body: { content: '<script>alert(1)</script>' },
        ip: '127.0.0.1',
        get: () => 'Mozilla/5.0'
      };

      const event = service.analyzeRequest(req);
      
      expect(event).not.toBeNull();
      expect(event?.type).toBe('xss_attempt');
      expect(event?.severity).toBe('medium');
    });
  });

  describe('Command Injection Detection', () => {
    it('detects system command attempts', () => {
      const req = {
        url: '/api/execute',
        body: { command: '; rm -rf /' },
        ip: '1.2.3.4',
        get: () => 'Mozilla/5.0'
      };

      const event = service.analyzeRequest(req);
      
      expect(event).not.toBeNull();
      expect(event?.type).toBe('command_injection');
      expect(event?.severity).toBe('critical');
      expect(event?.blocked).toBe(true);
    });
  });

  describe('Brute Force Detection', () => {
    it('detects brute force after threshold', () => {
        const ip = '192.168.1.100';
        
        // Trigger 11 failed logins
        for (let i = 0; i < 11; i++) {
            service.recordFailedLogin(ip);
        }

        // Now make a request to trigger analysis
        const req = {
            url: '/api/login',
            ip: ip,
            get: () => 'Mozilla/5.0'
        };

        const event = service.analyzeRequest(req);

        expect(event).not.toBeNull();
        expect(event?.type).toBe('brute_force');
        expect(event?.severity).toBe('high');
    });

    it('clears suspicious IPs after timeout', async () => {
        vi.useFakeTimers();
        // Re-instantiate service to use fake timers for setInterval
        service = new ThreatDetectionService();
        
        const ip = '192.168.1.101';
        service.recordFailedLogin(ip);

        // Advance 25 hours
        vi.advanceTimersByTime(25 * 60 * 60 * 1000);
        
        const metrics = service.getSecurityMetrics();
        expect(metrics.suspiciousIPs).toBe(0); 
    });
  });

  describe('Metrics', () => {
      it('returns correct metrics structure', () => {
          const metrics = service.getSecurityMetrics();
          expect(metrics).toHaveProperty('totalEvents');
          expect(metrics).toHaveProperty('recentEvents');
          expect(metrics).toHaveProperty('blockedRequests');
      });
  });
});
