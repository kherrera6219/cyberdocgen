import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
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
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}
