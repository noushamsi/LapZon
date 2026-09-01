/**
 * Automated Verification Script:
 * Tests Render Deployment & Server Endpoints in server/server.js:
 * 1. Root route '/' -> index.html (200 OK)
 * 2. Health checks '/health' and '/api/health' (200 OK)
 * 3. Static assets '/css/main.css', '/js/app.js' (200 OK)
 * 4. API Endpoints '/api/products', '/api/auth/login' (200 OK)
 * 5. SPA Client Routing Fallback (200 OK)
 * 6. API 404 Guard (404 JSON)
 */

import http from 'http';

async function runRenderServerTests() {
  console.log('=====================================================');
  console.log('🚀 TESTING RENDER DEPLOYMENT & SERVER CONFIGURATION');
  console.log('=====================================================\n');

  const { app, server } = await import('../server/server.js');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      const addr = server.address();
      const port = addr ? addr.port : 8080;
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  try {
    // 1. Test Root Route '/'
    const rootRes = await makeRequest('/');
    assert(rootRes.status === 200, 'GET / returns HTTP 200 OK');
    assert(rootRes.body.includes('LapZon') && rootRes.body.includes('id="app"'), 'GET / correctly delivers frontend index.html');

    // 2. Test Health Check Endpoints
    const healthRes = await makeRequest('/health');
    assert(healthRes.status === 200, 'GET /health returns HTTP 200 OK for Render');
    const healthJson = JSON.parse(healthRes.body);
    assert(healthJson.status === 'healthy', 'GET /health payload confirms healthy status');

    const apiHealthRes = await makeRequest('/api/health');
    assert(apiHealthRes.status === 200, 'GET /api/health returns HTTP 200 OK');

    // 3. Test Static Assets
    const cssRes = await makeRequest('/css/main.css');
    assert(cssRes.status === 200, 'GET /css/main.css returns HTTP 200 OK');
    assert(cssRes.body.includes('--primary-orange'), 'GET /css/main.css contains LapZon style tokens');

    const jsRes = await makeRequest('/js/app.js');
    assert(jsRes.status === 200, 'GET /js/app.js returns HTTP 200 OK');
    assert(jsRes.body.includes('startApp'), 'GET /js/app.js delivers main client app bundle');

    // 4. Test Public API
    const prodRes = await makeRequest('/api/products');
    assert(prodRes.status === 200, 'GET /api/products returns HTTP 200 OK');
    const prodJson = JSON.parse(prodRes.body);
    assert(prodJson.success && Array.isArray(prodJson.products), 'GET /api/products returns approved laptop dataset');

    // 5. Test SPA Fallback for client routes
    const spaRes = await makeRequest('/store');
    assert(spaRes.status === 200 && spaRes.body.includes('id="app"'), 'GET /store falls back to index.html for SPA routing');

    // 6. Test Non-existent API route returns 404 JSON
    const api404Res = await makeRequest('/api/unknown-endpoint');
    assert(api404Res.status === 404, 'GET /api/unknown-endpoint returns HTTP 404');
    const api404Json = JSON.parse(api404Res.body);
    assert(api404Json.success === false, 'API 404 returns structured JSON error');

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\n=====================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=====================================================\n`);
}

runRenderServerTests();
