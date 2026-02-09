import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { logger } from '../utils/logger';

// Setup OpenTelemetry
const sdk = new NodeSDK({
  // Service name can be set via OTEL_SERVICE_NAME env var
  traceExporter: new ConsoleSpanExporter(), // For demo purposes, we log to console. Replace with OTLP/Jaeger in prod.
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
