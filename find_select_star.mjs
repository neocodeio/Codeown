
import fs from 'fs';
const content = fs.readFileSync('backend/src/controllers/posts.controller.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('select("*')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
});
