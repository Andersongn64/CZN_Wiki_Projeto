const dataset = require('./src/services/dataset');
console.log('=== Testing Dataset Loading ===');
const builds = dataset.getBuilds();
console.log('Builds loaded:', builds.length);
builds.forEach((b, i) => console.log(`${i+1}. ${b.name} - characters: [${b.characters.join(', ')}] - tags: [${b.tags.join(', ')}]`));
console.log('\n=== Testing Search ===');
console.log('Search Tiphera:', dataset.searchBuilds('Tiphera').map(b => b.name));
console.log('Search Rin:', dataset.searchBuilds('Rin').map(b => b.name));
console.log('Search Support:', dataset.searchBuilds('Support').map(b => b.name));