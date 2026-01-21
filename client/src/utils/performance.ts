import { onLCP, onCLS, onINP, onTTFB, Metric } from "web-vitals";
import { logger } from "./logger";

/**
 * Real User Monitoring (RUM) for Core Web Vitals
 * 
 * Captures and logs key performance metrics to help identify bottlenecks
 * in real-world user scenarios.
 */

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify(metric);
  
  // Use sendBeacon if available for reliable background transmission
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/monitoring/metrics", body);
  } else {
    fetch("/api/monitoring/metrics", {
      body,
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => logger.error("[RUM] Failed to send metrics:", err));
  }
}

export function initRUM() {
  if (import.meta.env.DEV) {
    const logMetric = (metric: Metric) => {
      logger.info(`[RUM] ${metric.name}: ${Math.round(metric.value * 100) / 100}`);
    };
    
    onLCP(logMetric);
    onCLS(logMetric);
    onINP(logMetric);
    onTTFB(logMetric);
  } else {
    onLCP(sendToAnalytics);
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }
}
