import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function removeSeo(filePath) {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Remove import statements specifically for SEO (accounting for newlines, etc)
    content = content.replace(/import\s*\{\s*SEO\s*\}\s*from\s*['"][^'"]+['"];?\r?\n?/g, '');

    // 2. Remove multi-line <SEO ... />
    content = content.replace(/<SEO\s*[\s\S]*?\/>\r?\n?/g, '');

    // 3. Remove <SEO />
    content = content.replace(/<SEO\s*\/>\r?\n?/g, '');

    // 4. Ensure no empty <SEO></SEO> if we had it
    content = content.replace(/<SEO[^>]*>[\s\S]*?<\/SEO>\r?\n?/g, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`Cleaned: ${filePath}`);
    }
}

const targetDir = path.join(process.cwd(), '..', 'src');
console.log(`Scanning: ${targetDir}`);
walkDir(targetDir, removeSeo);
console.log('SEO removal complete.');
