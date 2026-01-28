# CyberDocGen Full Review Report

Generated: 2026-01-27 20:27:07

## Artifacts produced
- FILE_STRUCTURE_MAP.txt (full tree listing)
- FULL_FILE_INVENTORY.csv (per-file metadata)
- FILE_STATS_SUMMARY.txt (counts + largest files)
- DIRECTORY_STATS.txt (top-level dir sizes & file counts)
- LARGE_FILES.txt (top 100 by size)
- DOCS_INDEX.md (markdown titles index)
- CODE_TODO_INDEX.txt (TODO/FIXME/XXX/HACK index)

## File statistics (from FILE_STATS_SUMMARY.txt)
Total files: 84007
Text files: 79117
Binary files: 4890

By extension (top 50):
  .js: 30486
  .ts: 17750
  .map: 15314
  : 5899
  .json: 2792
  .mjs: 2566
  .md: 2458
  .mts: 1838
  .cjs: 906
  .cts: 659
  .tsx: 477
  .yml: 225
  .dll: 149
  .nsh: 141
  .ps1: 124
  .exe: 124
  .eslintrc: 120
  .pak: 116
  .cmd: 116
  .nycrc: 97
  .manifest: 90
  .txt: 87
  .png: 85
  .css: 85
  .py: 77
  .nlf: 75
  .yaml: 73
  .dylib: 64
  .flow: 62
  .editorconfig: 58
  .bmp: 44
  .node: 42
  .ico: 39
  .npmignore: 37
  .cpp: 36
  .html: 35
  .snap: 32
  .scss: 31
  .tlog: 28
  .jst: 28
  .sh: 26
  .svg: 23
  .xml: 22
  .pyc: 21
  .h: 18
  .gypi: 16
  .proto: 16
  .tsbuildinfo: 15
  .sample: 14
  .markdown: 13

Binary vs text:
  False: 79117
  True: 4890

Largest files (top 50):
  359785708\tdist\packaging\win-unpacked\resources\app.asar
  213583872\tnode_modules\electron\dist\electron.exe
  213583872\tdist\packaging\win-unpacked\CyberDocGen.exe
  147691064\tdist\packaging\CyberDocGen-Setup-2.0.1.exe
  25619968\tdist\packaging\win-unpacked\dxcompiler.dll
  25619968\tnode_modules\electron\dist\dxcompiler.dll
  24661504\tnode_modules\app-builder-bin\win\x64\app-builder.exe
  24145252\tdist\index.js
  23674880\tnode_modules\app-builder-bin\win\arm64\app-builder.exe
  23361024\tnode_modules\app-builder-bin\win\ia32\app-builder.exe
  19576768\tnode_modules\app-builder-bin\mac\app-builder_amd64
  19508690\tnode_modules\app-builder-bin\mac\app-builder_arm64
  18284544\tnode_modules\app-builder-bin\linux\loong64\app-builder
  18116608\tnode_modules\app-builder-bin\linux\x64\app-builder
  17891328\tnode_modules\app-builder-bin\linux\riscv64\app-builder
  17629184\tnode_modules\app-builder-bin\linux\arm64\app-builder
  17170432\tnode_modules\app-builder-bin\linux\arm\app-builder
  16969728\tnode_modules\app-builder-bin\linux\ia32\app-builder
  16036057\tdist\packaging\win-unpacked\resources\app.asar.unpacked\dist\index.cjs
  16036057\tdist\index.cjs
  15981304\tdist\packaging\win-unpacked\LICENSES.chromium.html
  15981304\tnode_modules\electron\dist\LICENSES.chromium.html
  11365376\tnode_modules\@esbuild\win32-x64\esbuild.exe
  11365376\tnode_modules\esbuild\lib\downloaded-@esbuild-win32-x64-esbuild.exe
  10822192\tnode_modules\electron\dist\icudtl.dat
  10822192\tdist\packaging\win-unpacked\icudtl.dat
  10617344\tnode_modules\vite\node_modules\@esbuild\win32-x64\esbuild.exe
  10617344\tnode_modules\drizzle-kit\node_modules\@esbuild\win32-x64\esbuild.exe
  9550848\tnode_modules\@esbuild-kit\core-utils\node_modules\@esbuild\win32-x64\esbuild.exe
  9389807\tnode_modules\better-sqlite3\deps\sqlite3\sqlite3.c
  9389807\tdist\packaging\win-unpacked\resources\app.asar.unpacked\node_modules\better-sqlite3\deps\sqlite3\sqlite3.c
  9112572\tnode_modules\typescript\lib\typescript.js
  9011712\tnode_modules\lightningcss-win32-x64-msvc\lightningcss.win32-x64-msvc.node
  8798770\t.git\objects\pack\pack-99657377c1e525c7fe946dcc36fefbef14ac278a.pack
  8589312\tnode_modules\electron-winstaller\vendor\Setup.pdb
  8010240\tdist\packaging\win-unpacked\libGLESv2.dll
  8010240\tnode_modules\electron\dist\libGLESv2.dll
  7037131\tnode_modules\react-icons\gi\index.js
  6945096\tnode_modules\react-icons\gi\index.mjs
  6375943\tdist\packaging\win-unpacked\resources.pak
  6375943\tnode_modules\electron\dist\resources.pak
  6213092\tnode_modules\typescript\lib\_tsc.js
  6055026\tFILE_STRUCTURE_MAP.txt
  5912218\tnode_modules\react-icons\pi\index.js
  5663588\tnode_modules\react-icons\pi\index.mjs
  5636505\t.git\objects\f4\d893fee5eb697425614b6e91cb114860d90933
  5635384\t.cache\winCodeSign\820610231.7z
  5635384\t.cache\winCodeSign\380537751.7z
  5635384\t.cache\winCodeSign\088924095.7z
  5635384\t.cache\winCodeSign\236137575.7z

## Top-level directory size & file count (DIRECTORY_STATS.txt)
Bytes\tFiles\tFolder
1328801850\t77955\tnode_modules
935637457\t318\tdist
149705002\t759\t.cache
64472660\t4213\t.git
8972762\t50\tdevelopment-archive
7135259\t39\t.
6081257\t6\tattached_assets
1996455\t249\tclient
1879089\t182\tserver
765186\t26\tstories
704467\t104\ttests
516595\t1\tplaywright-report
399210\t34\tdocs
200977\t2\tbuild
100979\t18\tscripts
100209\t3\tshared
27682\t3\telectron
14854\t7\t.github
3385\t6\tk8s
3244\t4\tpublic
1324\t3\t.storybook
1267\t18\t.husky
1114\t1\taws
816\t1\tazure
719\t1\tgcp
167\t1\tmonitoring
73\t1\t.claude
70\t1\t.vscode
45\t1\ttest-results

## Largest files (top 50)
359785708\tdist\packaging\win-unpacked\resources\app.asar
213583872\tnode_modules\electron\dist\electron.exe
213583872\tdist\packaging\win-unpacked\CyberDocGen.exe
147691064\tdist\packaging\CyberDocGen-Setup-2.0.1.exe
25619968\tdist\packaging\win-unpacked\dxcompiler.dll
25619968\tnode_modules\electron\dist\dxcompiler.dll
24661504\tnode_modules\app-builder-bin\win\x64\app-builder.exe
24145252\tdist\index.js
23674880\tnode_modules\app-builder-bin\win\arm64\app-builder.exe
23361024\tnode_modules\app-builder-bin\win\ia32\app-builder.exe
19576768\tnode_modules\app-builder-bin\mac\app-builder_amd64
19508690\tnode_modules\app-builder-bin\mac\app-builder_arm64
18284544\tnode_modules\app-builder-bin\linux\loong64\app-builder
18116608\tnode_modules\app-builder-bin\linux\x64\app-builder
17891328\tnode_modules\app-builder-bin\linux\riscv64\app-builder
17629184\tnode_modules\app-builder-bin\linux\arm64\app-builder
17170432\tnode_modules\app-builder-bin\linux\arm\app-builder
16969728\tnode_modules\app-builder-bin\linux\ia32\app-builder
16036057\tdist\packaging\win-unpacked\resources\app.asar.unpacked\dist\index.cjs
16036057\tdist\index.cjs
15981304\tdist\packaging\win-unpacked\LICENSES.chromium.html
15981304\tnode_modules\electron\dist\LICENSES.chromium.html
11365376\tnode_modules\@esbuild\win32-x64\esbuild.exe
11365376\tnode_modules\esbuild\lib\downloaded-@esbuild-win32-x64-esbuild.exe
10822192\tnode_modules\electron\dist\icudtl.dat
10822192\tdist\packaging\win-unpacked\icudtl.dat
10617344\tnode_modules\vite\node_modules\@esbuild\win32-x64\esbuild.exe
10617344\tnode_modules\drizzle-kit\node_modules\@esbuild\win32-x64\esbuild.exe
9550848\tnode_modules\@esbuild-kit\core-utils\node_modules\@esbuild\win32-x64\esbuild.exe
9389807\tnode_modules\better-sqlite3\deps\sqlite3\sqlite3.c
9389807\tdist\packaging\win-unpacked\resources\app.asar.unpacked\node_modules\better-sqlite3\deps\sqlite3\sqlite3.c
9112572\tnode_modules\typescript\lib\typescript.js
9011712\tnode_modules\lightningcss-win32-x64-msvc\lightningcss.win32-x64-msvc.node
8798770\t.git\objects\pack\pack-99657377c1e525c7fe946dcc36fefbef14ac278a.pack
8589312\tnode_modules\electron-winstaller\vendor\Setup.pdb
8010240\tdist\packaging\win-unpacked\libGLESv2.dll
8010240\tnode_modules\electron\dist\libGLESv2.dll
7037131\tnode_modules\react-icons\gi\index.js
6945096\tnode_modules\react-icons\gi\index.mjs
6375943\tdist\packaging\win-unpacked\resources.pak
6375943\tnode_modules\electron\dist\resources.pak
6213092\tnode_modules\typescript\lib\_tsc.js
6055026\tFILE_STRUCTURE_MAP.txt
5912218\tnode_modules\react-icons\pi\index.js
5663588\tnode_modules\react-icons\pi\index.mjs
5636505\t.git\objects\f4\d893fee5eb697425614b6e91cb114860d90933
5635384\t.cache\winCodeSign\820610231.7z
5635384\t.cache\winCodeSign\380537751.7z
5635384\t.cache\winCodeSign\088924095.7z
5635384\t.cache\winCodeSign\236137575.7z

## TODO/FIXME/XXX/HACK index summary
Total TODO-like markers: 5433
Top folders with TODO markers:
- C: 5433

## Documentation index
See DOCS_INDEX.md for all markdown files and their titles.

## Notes on review methodology
- Full recursive inventory generated across all folders (including node_modules and build artifacts).
- Text vs binary classification used extension heuristics with binary detection for unknown extensions.
- Line counts computed for text files <= 1MB; larger files are noted as skipped for line counts.
- TODO index generated via ripgrep across entire repo.

## Next manual review areas (optional)
- Review extremely large code files in server/services for maintainability and testability.
- Validate docs consistency (auth provider, licensing references) against code.
- Spot-check auto-generated or vendor files in node_modules for licensing/security if required.
