const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'db', 'data.csv');
console.log('CSV path:', csvPath);
console.log('File exists:', fs.existsSync(csvPath));

if (fs.existsSync(csvPath)) {
  const content = fs.readFileSync(csvPath, 'utf8');
  console.log('Content length:', content.length);
  console.log('First 300 chars:');
  console.log(content.substring(0, 300));
}