/* eslint-env node */
const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.cwd(), 'coverage_batch5.json');
if (!fs.existsSync(reportPath)) {
  console.error('Report not found');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const coverageMap = report.coverageMap;

const targetFiles = [
  'server/mcp/agentClient.ts',
  'server/mcp/initialize.ts',
  'server/mcp/integration.ts',
  'server/mcp/server.ts',
  'server/mcp/toolRegistry.ts'
];

console.log('File | Statements | Branches | Functions');
console.log('---|---|---|---');

targetFiles.forEach(file => {
  const normalizedTarget = file.replace(/\//g, path.sep).toLowerCase();
  const key = Object.keys(coverageMap).find(k => k.toLowerCase().endsWith(normalizedTarget));
  
  if (!key) {
    console.log(`${file} | NOT FOUND | - | -`);
    return;
  }

  const data = coverageMap[key];
  
  const calc = (map) => {
    if (!map) return "100.00";
    const values = Object.values(map);
    const total = values.length;
    if (total === 0) return "100.00";
    // For branches (b), v8 format is different, but for s and f it's simple
    const covered = values.filter(v => (Array.isArray(v) ? v[0] > 0 : v > 0)).length;
    return ((covered / total) * 100).toFixed(2);
  };

  const statements = calc(data.s);
  const branches = calc(data.b);
  const functions = calc(data.f);

  console.log(`${file} | ${statements}% | ${branches}% | ${functions}%`);
});
