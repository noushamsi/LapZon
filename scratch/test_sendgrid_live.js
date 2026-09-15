import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

console.log('SENDGRID_API_KEY present:', Boolean(env.SENDGRID_API_KEY));
console.log('SENDGRID_API_KEY valid prefix:', env.SENDGRID_API_KEY ? env.SENDGRID_API_KEY.startsWith('SG.') : false);
console.log('SENDGRID_FROM_EMAIL:', env.SENDGRID_FROM_EMAIL);
console.log('SENDGRID_FROM_NAME:', env.SENDGRID_FROM_NAME);

async function testSend() {
  const payload = {
    personalizations: [{ to: [{ email: env.SENDGRID_FROM_EMAIL }] }],
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME || 'LapZon Security' },
    subject: 'LapZon SendGrid Verification Test',
    content: [{ type: 'text/plain', value: 'This is a test email to verify SendGrid integration.' }]
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  console.log('SendGrid Response Status:', res.status, res.statusText);
  if (res.status !== 202) {
    const errBody = await res.text();
    console.log('SendGrid Error Body:', errBody);
  } else {
    console.log('SUCCESS! SendGrid returned 202 Accepted.');
  }
}

testSend().catch(e => console.error('Error:', e.message));
