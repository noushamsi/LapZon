import http from 'http';

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length });
      });
    }).on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  const r1 = await check('http://localhost:8080/');
  const r2 = await check('http://127.0.0.1:8080/');
  const r3 = await check('http://localhost:8080/js/app.js');
  const r4 = await check('http://localhost:8080/api/products');
  console.log('localhost /:', r1);
  console.log('127.0.0.1 /:', r2);
  console.log('js/app.js:', r3);
  console.log('api/products:', r4);
}

run();
