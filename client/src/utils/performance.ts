import { onLCP, onCLS, onINP, onTTFB, Metric } from "web-vitals";
import { logger } from "./logger";

/**
 * Real User Monitoring (RUM) for Core Web Vitals
 * 
 * Captures and logs key performance metrics to help identify bottlenecks
 * in real-world user scenarios.
 */

function sendToAnalytics(metric: Metric) {
  const payload = {
    eventType: `web-vitals:${metric.name}`,
    eventData: {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
    },
  };
  const body = JSON.stringify(payload);
  const endpoint = "/api/health/metrics";
  
  // Use sendBeacon if available for reliable background transmission
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
  } else {
    fetch(endpoint, {
      body,
      method: "POST",
      keepalive: true,
      credentials: "include",
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
