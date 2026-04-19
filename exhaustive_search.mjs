
import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('backend/src', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('language')) {
            console.log(`FOUND in ${filePath}`);
        }
    }
});
