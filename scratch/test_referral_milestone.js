import http from 'http';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testReferralProgression() {
  const code = `LK-NEW-${Date.now()}`;
  console.log(`Testing Referral code: ${code}`);

  for (let i = 1; i <= 5; i++) {
    const res = await makeRequest('POST', '/api/referrals/register', {
      referrerCode: code,
      name: `User ${i}`,
      email: `user${i}@example.com`
    });
    console.log(`Step ${i}: Count = ${res.body.refInfo.count}/5, Reached = ${res.body.milestoneReached}`);
    if (i < 5 && res.body.milestoneReached) throw new Error('Reached too early!');
    if (i === 5 && (!res.body.milestoneReached || !res.body.couponCode)) throw new Error('Failed to unlock coupon on 5th referral!');
  }
  console.log('✅ Referral 0/5 -> 5/5 progression verified!');
}

testReferralProgression();
