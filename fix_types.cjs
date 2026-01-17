
const fs = require('fs');

const files = [
    'c:\\software\\cyberdocgen\\server\\routes\\ai.ts',
    'c:\\software\\cyberdocgen\\server\\routes\\analytics.ts'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace "async (req: any, res)" with "async (req, res)"
        // Also handle "async (req: any, res: any)" just in case
        let newContent = content.replace(/async\s*\(\s*req\s*:\s*any\s*,\s*res\s*(?::\s*any)?\s*\)/g, 'async (req, res)');
        
        // Also replace "(req: any, res)" if it appears without async (unlikely in routes but possible)
        // newContent = newContent.replace(/\(\s*req\s*:\s*any\s*,\s*res\s*(?::\s*any)?\s*\)\s*=>/g, '(req, res) =>');
        
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log(`Updated ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});
