/**
 * AI Document Generation Benchmark Script
 * 
 * Measures API latency and throughput for critical endpoints.
 * Uses autocannon for load testing.
 * 
 * Usage:
 *   npx ts-node scripts/benchmark-ai.ts
 *   npx ts-node scripts/benchmark-ai.ts --endpoint /api/ai/analyze
 */

import autocannon from 'autocannon';
import { finished } from 'stream/promises';

interface BenchmarkResult {
  endpoint: string;
  latency: {
    p50: number;
    p90: number;
    p99: number;
    mean: number;
  };
  requests: {
    total: number;
    average: number;
    errors: number;
  };
  throughput: {
    average: number;
    total: number;
  };
}

const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:5000';

// Endpoints to benchmark
const ENDPOINTS = [
  { method: 'GET', path: '/health', body: null },
  { method: 'GET', path: '/api/documents', body: null },
  { method: 'POST', path: '/api/ai/analyze', body: JSON.stringify({
    documentId: 'test-doc-123',
    analysisType: 'compliance'
  })},
  { method: 'POST', path: '/api/gap-analysis', body: JSON.stringify({
    frameworkIds: ['iso27001'],
    scope: 'full'
  })},
];

async function runBenchmark(
  endpoint: { method: string; path: string; body: string | null },
  duration: number = 10
): Promise<BenchmarkResult> {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url: `${BASE_URL}${endpoint.path}`,
      method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      duration,
      connections: 10,
      pipelining: 1,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: endpoint.body || undefined,
    });

    autocannon.track(instance, { renderProgressBar: process.stdout.isTTY ?? false });

    instance.on('done', (result) => {
      resolve({
        endpoint: endpoint.path,
        latency: {
          p50: result.latency.p50,
          p90: result.latency.p90,
          p99: result.latency.p99,
          mean: result.latency.mean,
        },
        requests: {
          total: result.requests.total,
          average: result.requests.average,
          errors: result.errors,
        },
        throughput: {
          average: result.throughput.average,
          total: result.throughput.total,
        },
      });
    });

    instance.on('error', reject);
  });
}

function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main() {
  console.log('========================================');
  console.log('CyberDocGen AI Performance Benchmark');
  console.log('========================================\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Connections: 10 | Duration: 10s per endpoint\n`);

  // Optional: filter to specific endpoint
  const targetEndpoint = process.argv.find(arg => arg.startsWith('--endpoint='));
  const filteredEndpoints = targetEndpoint
    ? ENDPOINTS.filter(e => e.path.includes(targetEndpoint.split('=')[1]))
    : ENDPOINTS;

  if (filteredEndpoints.length === 0) {
    console.error('No matching endpoints found');
    process.exit(1);
  }

  const results: BenchmarkResult[] = [];

  for (const endpoint of filteredEndpoints) {
    console.log(`\nBenchmarking: ${endpoint.method} ${endpoint.path}`);
    console.log('─'.repeat(50));

    try {
      const result = await runBenchmark(endpoint);
      results.push(result);

      console.log(`  Latency (p50): ${formatLatency(result.latency.p50)}`);
      console.log(`  Latency (p90): ${formatLatency(result.latency.p90)}`);
      console.log(`  Latency (p99): ${formatLatency(result.latency.p99)}`);
      console.log(`  Requests/sec:  ${result.requests.average.toFixed(2)}`);
      console.log(`  Total reqs:    ${result.requests.total}`);
      console.log(`  Errors:        ${result.requests.errors}`);
    } catch (error) {
      console.error(`  Failed to benchmark: ${error}`);
    }
  }

  // Summary table
  console.log('\n\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  console.log('| Endpoint'.padEnd(30) + '| p50'.padEnd(12) + '| p99'.padEnd(12) + '| RPS'.padEnd(10) + '|');
  console.log('|' + '-'.repeat(29) + '|' + '-'.repeat(11) + '|' + '-'.repeat(11) + '|' + '-'.repeat(9) + '|');

  for (const result of results) {
    const endpoint = result.endpoint.padEnd(28);
    const p50 = formatLatency(result.latency.p50).padEnd(10);
    const p99 = formatLatency(result.latency.p99).padEnd(10);
    const rps = result.requests.average.toFixed(1).padEnd(8);
    console.log(`| ${endpoint}| ${p50}| ${p99}| ${rps}|`);
  }

  // Save results to file
  const outputPath = `benchmark-results-${Date.now()}.json`;
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results,
  }, null, 2));

  console.log(`\nResults saved to: ${outputPath}`);

  // Calculate performance grade
  const avgP99 = results.reduce((sum, r) => sum + r.latency.p99, 0) / results.length;
  const totalErrors = results.reduce((sum, r) => sum + r.requests.errors, 0);

  console.log('\n========================================');
  console.log('PERFORMANCE GRADE');
  console.log('========================================');

  if (avgP99 < 100 && totalErrors === 0) {
    console.log('Grade: A (Excellent) ✅');
  } else if (avgP99 < 500 && totalErrors < 10) {
    console.log('Grade: B (Good) ✅');
  } else if (avgP99 < 1000) {
    console.log('Grade: C (Acceptable) ⚠️');
  } else {
    console.log('Grade: D (Needs Improvement) ❌');
  }

  console.log(`Average p99 latency: ${formatLatency(avgP99)}`);
  console.log(`Total errors: ${totalErrors}`);
}

main().catch(console.error);
