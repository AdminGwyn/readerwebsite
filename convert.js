const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'Hình-Vẽ-Thông-Minh-Dan-Roam.pdf';
const outputPath = 'extracted_text.txt';

if (!fs.existsSync(pdfPath)) {
    console.error('File not found:', pdfPath);
    process.exit(1);
}

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync(outputPath, data.text);
    console.log('Successfully extracted text to', outputPath);
}).catch(err => {
    console.error('Extraction failed:', err);
    process.exit(1);
});
