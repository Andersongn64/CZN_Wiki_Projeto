const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function testAPI() {
  try {
    console.log('Testing API on port 3001...');

    const allBuilds = await makeRequest('/api/builds');
    console.log('All builds count:', Array.isArray(allBuilds) ? allBuilds.length : 'not array');
    if (Array.isArray(allBuilds) && allBuilds.length > 0) {
      console.log('First build:', allBuilds[0]);
    }

    const tipheraBuilds = await makeRequest('/api/builds?q=Tiphera');
    console.log('Search Tiphera count:', Array.isArray(tipheraBuilds) ? tipheraBuilds.length : 'not array');
    if (Array.isArray(tipheraBuilds)) {
      tipheraBuilds.forEach(build => console.log('-', build.name, 'characters:', build.characters.join(', ')));
    }

    const rinBuilds = await makeRequest('/api/builds?q=Rin');
    console.log('Search Rin count:', Array.isArray(rinBuilds) ? rinBuilds.length : 'not array');
    if (Array.isArray(rinBuilds)) {
      rinBuilds.forEach(build => console.log('-', build.name, 'characters:', build.characters.join(', ')));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();