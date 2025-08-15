
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export class AlertingService extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private metrics: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeDefaultRules();
    this.startMetricsCollection();
  }

  private initializeDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'error_rate > threshold',
        threshold: 5, // 5% error rate
        severity: 'high',
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        condition: 'avg_response_time > threshold',
        threshold: 2000, // 2 seconds
        severity: 'medium',
        enabled: true
      },
      {
        id: 'failed_ai_requests',
        name: 'Failed AI Requests',
        condition: 'ai_failure_rate > threshold',
        threshold: 10, // 10% failure rate
        severity: 'high',
        enabled: true
      },
      {
        id: 'database_connection_issues',
        name: 'Database Connection Issues',
        condition: 'db_connection_failures > threshold',
        threshold: 3,
        severity: 'critical',
        enabled: true
      },
      {
        id: 'security_incidents',
        name: 'Security Incidents',
        condition: 'security_events > threshold',
        threshold: 1,
        severity: 'critical',
        enabled: true
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  private startMetricsCollection() {
    setInterval(() => {
      this.evaluateRules();
    }, 30000); // Check every 30 seconds
  }

  updateMetric(key: string, value: number) {
    this.metrics.set(key, value);
    
    // Immediate evaluation for critical metrics
    if (['security_events', 'db_connection_failures'].includes(key)) {
      this.evaluateRules();
    }
  }

  private evaluateRules() {
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      let shouldAlert = false;
      const metricValue = this.getMetricValue(rule.condition);

      if (metricValue !== null && metricValue > rule.threshold) {
        shouldAlert = true;
      }

      if (shouldAlert) {
        this.createAlert(rule, metricValue);
      }
    }
  }

  private getMetricValue(condition: string): number | null {
    // Parse condition and get metric value
    if (condition.includes('error_rate')) {
      return this.metrics.get('error_rate') || 0;
    }
    if (condition.includes('avg_response_time')) {
      return this.metrics.get('avg_response_time') || 0;
    }
    if (condition.includes('ai_failure_rate')) {
      return this.metrics.get('ai_failure_rate') || 0;
    }
    if (condition.includes('db_connection_failures')) {
      return this.metrics.get('db_connection_failures') || 0;
    }
    if (condition.includes('security_events')) {
      return this.metrics.get('security_events') || 0;
    }
    return null;
  }

  private createAlert(rule: AlertRule, value: number) {
    const alertId = `${rule.id}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      title: rule.name,
      message: `${rule.name}: ${value} exceeds threshold of ${rule.threshold}`,
      severity: rule.severity,
      timestamp: new Date(),
      acknowledged: false,
      metadata: { value, threshold: rule.threshold }
    };

    this.alerts.set(alertId, alert);
    this.emit('alert', alert);
    
    logger.error('Alert triggered', {
      alertId,
      rule: rule.name,
      value,
      threshold: rule.threshold,
      severity: rule.severity
    });

    // Auto-escalate critical alerts
    if (rule.severity === 'critical') {
      this.escalateAlert(alert);
    }
  }

  private escalateAlert(alert: Alert) {
    logger.error('CRITICAL ALERT ESCALATED', {
      alertId: alert.id,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp
    });
    
    // In production, this would send notifications via email, SMS, Slack, etc.
    this.emit('critical-alert', alert);
  }

  acknowledgeAlert(alertId: string, userId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId, userId, alertTitle: alert.title });
    }
  }

  resolveAlert(alertId: string, userId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      logger.info('Alert resolved', { alertId, userId, alertTitle: alert.title });
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  getAlertMetrics() {
    const alerts = Array.from(this.alerts.values());
    return {
      total: alerts.length,
      active: alerts.filter(a => !a.resolvedAt).length,
      critical: alerts.filter(a => a.severity === 'critical' && !a.resolvedAt).length,
      high: alerts.filter(a => a.severity === 'high' && !a.resolvedAt).length,
      acknowledged: alerts.filter(a => a.acknowledged).length
    };
  }
}

export const alertingService = new AlertingService();
