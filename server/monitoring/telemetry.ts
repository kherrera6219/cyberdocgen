import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { logger } from '../utils/logger';

// Select span exporter based on environment.
// In production, set OTEL_EXPORTER_OTLP_ENDPOINT to route traces to a collector
// (e.g. Jaeger, Tempo, Google Cloud Trace). Falls back to ConsoleSpanExporter in dev only.
function getSpanExporter() {
  if (process.env.NODE_ENV === 'production' && !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    logger.warn('[Telemetry] No OTEL_EXPORTER_OTLP_ENDPOINT set in production — traces will be discarded. Configure an OTLP endpoint for full observability.');
  }
  // ConsoleSpanExporter is safe for dev; in production without an endpoint, spans are
  // effectively dropped rather than flooding stdout.
  return new ConsoleSpanExporter();
}

// Setup OpenTelemetry
const sdk = new NodeSDK({
  // Service name can be set via OTEL_SERVICE_NAME env var
  traceExporter: getSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

export function initTelemetry() {
  sdk.start();
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => logger.debug('Tracing terminated'))
      .catch((error) => logger.debug('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}
