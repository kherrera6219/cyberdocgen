import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
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
      banner: {
        js: 'const __importMetaUrl = "file://" + __filename;'
      },
      define: {
        'import.meta.url': '__importMetaUrl'
      },
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

    // Copy PGlite WASM binaries to dist/ so they can be resolved relative to the bundled index.cjs
    const pgliteDistDir = path.join(root, 'node_modules', '@electric-sql', 'pglite', 'dist');
    const targetDistDir = path.join(root, 'dist');
    if (fs.existsSync(pgliteDistDir)) {
      const files = fs.readdirSync(pgliteDistDir);
      for (const file of files) {
        if (file.endsWith('.wasm') || file.endsWith('.data')) {
          fs.copyFileSync(path.join(pgliteDistDir, file), path.join(targetDistDir, file));
          console.log(`Copied PGlite asset to dist: ${file}`);
        }
        // Copy extension tarballs (e.g. vector.tar.gz) to project root.
        // PGlite resolves extensions via new URL("../vector.tar.gz", bundleUrl)
        // which from dist/index.cjs resolves to the project root (dist/../).
        if (file.endsWith('.tar.gz')) {
          fs.copyFileSync(path.join(pgliteDistDir, file), path.join(root, file));
          console.log(`Copied PGlite extension tarball to root: ${file}`);
        }
      }
    }

    const sqliteMigrationsSource = path.join(root, 'server', 'migrations', 'sqlite');
    const sqliteMigrationsTarget = path.join(root, 'dist', 'migrations', 'sqlite');
    if (fs.existsSync(sqliteMigrationsSource)) {
      fs.mkdirSync(path.dirname(sqliteMigrationsTarget), { recursive: true });
      fs.cpSync(sqliteMigrationsSource, sqliteMigrationsTarget, { recursive: true });
      console.log('Copied SQLite migrations to dist/migrations/sqlite');
    } else {
      console.warn('SQLite migrations folder not found, skipping copy step');
    }

    // Copy PGlite migrations for local/desktop mode
    const pgliteMigrationsSource = path.join(root, 'server', 'migrations', 'pglite');
    const pgliteMigrationsTarget = path.join(root, 'dist', 'migrations', 'pglite');
    if (fs.existsSync(pgliteMigrationsSource)) {
      fs.mkdirSync(pgliteMigrationsTarget, { recursive: true });
      fs.cpSync(pgliteMigrationsSource, pgliteMigrationsTarget, { recursive: true });
      console.log('Copied PGlite migrations to dist/migrations/pglite');
    } else {
      console.warn('PGlite migrations folder not found, skipping copy step');
    }

    console.log('Backend server build successful: dist/index.cjs');
  } catch (error) {
    console.error('Backend server build failed:', error);
    process.exit(1);
  }
}

build();
