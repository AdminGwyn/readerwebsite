const fs = require('fs');
const content = fs.readFileSync('extracted_full_text.md', 'utf8');

// Remove base64 images
const cleaned = content.replace(/!\[\]\(data:image\/[^;]+;base64,[^)]+\)/g, '');

fs.writeFileSync('cleaned_text.txt', cleaned);
console.log('Cleaned text saved to cleaned_text.txt');
