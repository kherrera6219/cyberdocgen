/**
 * Bundle Size Governance Plugin for Vite
 * 
 * Enforces maximum chunk size limits during production builds.
 * Fails the build if any chunk exceeds the specified limit.
 */
import type { Plugin } from 'vite';
import type { OutputChunk } from 'rollup';

export interface BundleGovernanceOptions {
  /** Maximum chunk size in KB (default: 200) */
  maxChunkSize?: number;
  /** Whether to fail the build on violation (default: true in CI) */
  failOnViolation?: boolean;
  /** Chunks to exclude from size checks (by name pattern) */
  excludePatterns?: RegExp[];
  /** Maximum total bundle size in KB (default: 2000) */
  maxTotalSize?: number;
}

export function bundleGovernance(options: BundleGovernanceOptions = {}): Plugin {
  const {
    maxChunkSize = 200,
    failOnViolation = !!process.env.CI,
    excludePatterns = [/node_modules/, /vendor/],
    maxTotalSize = 2000,
  } = options;

  const maxChunkBytes = maxChunkSize * 1024;
  const maxTotalBytes = maxTotalSize * 1024;

  return {
    name: 'bundle-governance',
    apply: 'build',
    
    generateBundle(_, bundle) {
      const violations: string[] = [];
      let totalSize = 0;

      const chunks = Object.entries(bundle).filter(
        (entry): entry is [string, OutputChunk] => entry[1].type === 'chunk'
      );

      console.log('\n📦 Bundle Governance Report');
      console.log('═'.repeat(60));
      console.log(`Max chunk size: ${maxChunkSize}KB | Max total: ${maxTotalSize}KB`);
      console.log('─'.repeat(60));

      for (const [name, chunk] of chunks) {
        const sizeBytes = Buffer.byteLength(chunk.code, 'utf8');
        const sizeKB = sizeBytes / 1024;
        totalSize += sizeBytes;

        // Check if excluded
        const isExcluded = excludePatterns.some(pattern => pattern.test(name));
        
        if (sizeBytes > maxChunkBytes && !isExcluded) {
          violations.push(`${name}: ${sizeKB.toFixed(1)}KB (limit: ${maxChunkSize}KB)`);
          console.log(`❌ ${name.padEnd(40)} ${sizeKB.toFixed(1).padStart(8)}KB  OVER LIMIT`);
        } else if (sizeBytes > maxChunkBytes * 0.8 && !isExcluded) {
          console.log(`⚠️ ${name.padEnd(40)} ${sizeKB.toFixed(1).padStart(8)}KB  WARNING`);
        } else {
          console.log(`✅ ${name.padEnd(40)} ${sizeKB.toFixed(1).padStart(8)}KB`);
        }
      }

      const totalSizeKB = totalSize / 1024;
      console.log('─'.repeat(60));
      console.log(`Total bundle size: ${totalSizeKB.toFixed(1)}KB / ${maxTotalSize}KB`);

      if (totalSize > maxTotalBytes) {
        violations.push(`Total bundle: ${totalSizeKB.toFixed(1)}KB (limit: ${maxTotalSize}KB)`);
        console.log('❌ Total bundle size exceeds limit!');
      }

      if (violations.length > 0) {
        console.log('\n🚨 Bundle Size Violations:');
        violations.forEach(v => console.log(`   - ${v}`));

        if (failOnViolation) {
          throw new Error(
            `Bundle governance failed: ${violations.length} violation(s)\n` +
            violations.map(v => `  - ${v}`).join('\n')
          );
        }
      } else {
        console.log('\n✅ All chunks within size limits');
      }

      console.log('═'.repeat(60) + '\n');
    },
  };
}

export default bundleGovernance;
