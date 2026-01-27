import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

async function build() {
  console.log('Building backend server...');
  
  try {
    await esbuild.build({
      entryPoints: [path.join(root, 'server', 'index.ts')],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      external: [
        'better-sqlite3',
        'keytar',
        'bcrypt',
        'jsdom',
        'punycode',
        './vite.js',
        './vite'
      ],
      outfile: path.join(root, 'dist', 'index.cjs'),
    });
    console.log('Backend server build successful: dist/index.cjs');
  } catch (error) {
    console.error('Backend server build failed:', error);
    process.exit(1);
  }
}

build();
