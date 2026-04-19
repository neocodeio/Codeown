
import fs from 'fs';
const content = fs.readFileSync('schema.json', 'utf8');
const data = JSON.parse(content);
const postsTable = data.definitions.posts;
if (postsTable) {
    console.log('Posts Table Properties:', Object.keys(postsTable.properties));
} else {
    console.log('Posts table not found in schema');
}
