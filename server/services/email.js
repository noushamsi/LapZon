/**
 * LapZon Transactional Email & OTP Notification Service (SMTP / Nodemailer)
 * Replaces SendGrid with direct SMTP transport (smtp.gmail.com / custom SMTP).
 * 
 * Benefits of SMTP via Gmail MX:
 * - 100% SPF, DKIM, and DMARC alignment with @gmail.com senders
 * - Bypasses 3rd party relay spam filtering, landing directly in the Primary Inbox
 * - Supports both OTP codes and full transactional notifications
 * 
 * Notifications Supported:
 * 0. Email OTP Verification Code (Customer)
 * 1. Account Created / Welcome Email (Customer)
 * 2. Successful Login Email (Customer)
 * 3. Successful Order Email (Customer)
 * 4. Admin New Order Notification (Admin)
 * 5. Admin Order Confirmation (Customer)
 */

import '../config/env.js';
import nodemailer from 'nodemailer';

let cachedTransporter = null;
let lastTransporterConfigKey = '';

/**
 * Creates or returns the cached Nodemailer transporter based on current process.env.
 */
export function getTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'false' ? false : (port === 465 || process.env.SMTP_SECURE === 'true');
  const user = (process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

  const configKey = `${host}:${port}:${secure}:${user}:${pass ? 'has-pass' : 'no-pass'}`;
  if (cachedTransporter && lastTransporterConfigKey === configKey) {
    return cachedTransporter;
  }

  if (!user || !pass) {
    return null;
  }

  const transportOptions = host.toLowerCase().includes('gmail')
    ? {
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 6000,
        socketTimeout: 10000,
        family: 4
      }
    : {
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 6000,
        socketTimeout: 10000,
        family: 4,
        tls: {
          rejectUnauthorized: false
        }
      };

  cachedTransporter = nodemailer.createTransport(transportOptions);
  lastTransporterConfigKey = configKey;
  return cachedTransporter;
}

/**
 * Verifies the SMTP connection and credentials.
 */
export async function verifySmtpConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials incomplete in .env. Please configure SMTP_USER and SMTP_PASS.'
    };
  }

  try {
    await transporter.verify();
    return { success: true, message: 'SMTP connection established and credentials verified!' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getEmailFooterHtml(fromEmail) {
  return `
      <!-- CAN-SPAM & Transactional Compliance Footer -->
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
        <p style="margin: 0 0 4px; font-weight: 700; color: #475569;">LapZon E-Commerce • Official Notification</p>
        <p style="margin: 0 0 4px;">MG Road, Bengaluru, Karnataka 560001, India • Support Helpline: +91 8123019785</p>
        <p style="margin: 0 0 4px;">Direct Support: <a href="mailto:${fromEmail}" style="color: #ea580c; text-decoration: none;">${fromEmail}</a></p>
        <p style="margin: 6px 0 0; color: #94a3b8; font-size: 10px;">This automated transactional message was sent to notify you regarding your LapZon account or purchase.</p>
      </div>
  `;
}

function getEmailFooterText(fromEmail) {
  return `

------------------------------------------------------------
LapZon E-Commerce • Official Notification
MG Road, Bengaluru, Karnataka 560001, India • Helpline: +91 8123019785
Direct Support: ${fromEmail}
This transactional message was sent to notify you regarding your LapZon account or purchase.`;
}

/**
 * Core SMTP email dispatch function
 */
export async function sendEmail({ to, subject, text, html }) {
  const cleanTo = String(to || '').trim().toLowerCase();
  if (!cleanTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
    console.warn(`[Email Service (SMTP)] Skipped sending email: invalid or missing recipient "${to}"`);
    return { success: false, error: 'Invalid recipient email' };
  }

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const fromName = (process.env.SMTP_FROM_NAME || 'LapZon Team').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

  if (!pass) {
    console.warn(`[Email Service (SMTP)] ⚠️ Delivery skipped: SMTP_PASS is not set in .env. Enter your 16-character Google App Password in .env to dispatch live emails via SMTP.`);
    return { 
      success: false, 
      error: 'SMTP_PASS not configured in .env. Please enter your Gmail App Password.' 
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[Email Service (SMTP)] Could not create SMTP transport. Please check SMTP_USER and SMTP_PASS.`);
    return { success: false, error: 'SMTP transporter unavailable' };
  }

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    replyTo: `"${fromName}" <${fromEmail}>`,
    to: cleanTo,
    subject: subject || 'LapZon Notification',
    text: text || '',
    html: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`,
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      'X-Entity-Ref-ID': `lapzon-smtp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service (SMTP)] ✓ Dispatched "${subject}" to ${cleanTo} via SMTP (Message-ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (err) {
    console.error(`[Email Service (SMTP)] Delivery failed to ${cleanTo}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 0. Email OTP Verification Code
 * Sent to the customer when email verification or OTP authentication is requested.
 */
export async function sendEmailOtp({ to, otp, name }) {
  const cleanTo = String(to || '').trim().toLowerCase();
  if (!cleanTo) return { success: false, error: 'Recipient email required' };

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = name || 'Valued Customer';
  const cleanOtp = String(otp || '').trim();
  const subject = 'Your LapZon verification code';

  const text = `Hello ${customerName},

Your LapZon verification code is ${cleanOtp}.

This code expires in 60 seconds.

If you did not request this code, you can ignore this email.

Thank you,
LapZon Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 26px 30px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        Lap<span style="color: #ea580c;">Zon</span>
      </h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Security & Account Verification</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px; font-weight: 700;">Hello ${customerName},</h2>
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
        Your LapZon verification code is:
      </p>

      <!-- Highlighted OTP Code Block -->
      <div style="background: #f8fafc; border: 2px dashed #ea580c; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; display: block; margin-bottom: 8px;">Verification Code</span>
        <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', Courier, monospace; display: block;">${cleanOtp}</span>
      </div>

      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #78350f;">
        ⏰ <strong>Code Expiry:</strong> This code expires in <strong>60 seconds</strong>.
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
        If you did not request this code, you can ignore this email.
      </p>

      <p style="font-size: 14px; color: #64748b; margin: 20px 0 0;">
        Thank you,<br/>
        <strong style="color: #1e293b;">LapZon Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: cleanTo,
    subject,
    text,
    html
  });
}

/**
 * Administrator Password Reset Verification Code Email
 * Dispatches a high-security OTP to verified store administrators.
 */
export async function sendAdminPasswordResetOtp({ to, otp, name }) {
  const cleanTo = String(to || '').trim().toLowerCase();
  if (!cleanTo) return { success: false, error: 'Recipient email required' };

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const adminName = name || 'Administrator';
  const cleanOtp = String(otp || '').trim();
  const subject = 'LapZon Admin - Password Reset Verification Code';

  const text = `Hello ${adminName},

You requested a password reset for your LapZon Administrator account (${cleanTo}).

Your Admin Verification Code is: ${cleanOtp}

This security code expires in 60 seconds.

If you did not request a password reset, please secure your account immediately or contact support.

LapZon Security Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
    <div style="background: linear-gradient(135deg, #090e17 0%, #1e293b 100%); padding: 28px 30px; text-align: left; border-bottom: 2px solid #ff6b00;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        Lap<span style="color: #ff6b00;">Zon</span> <span style="font-size: 14px; background: rgba(255,107,0,0.2); color: #ffedd5; border: 1px solid #ff6b00; padding: 2px 8px; border-radius: 6px; margin-left: 8px; vertical-align: middle;">ADMIN SECURITY</span>
      </h1>
      <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Administrator Password Reset Request</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px; font-weight: 700;">Hello ${adminName},</h2>
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
        We received a request to reset the password for your administrator account (<strong style="color: #0f172a;">${cleanTo}</strong>).
      </p>

      <!-- Highlighted Admin OTP Code Block -->
      <div style="background: #fff7ed; border: 2px dashed #ea580c; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #ea580c; font-weight: 800; display: block; margin-bottom: 8px;">Admin Verification Code</span>
        <span style="font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', Courier, monospace; display: block;">${cleanOtp}</span>
      </div>

      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #991b1b;">
        🔒 <strong>Security Notice:</strong> This code is valid for <strong>60 seconds</strong>. Never share this code with anyone, including LapZon staff.
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
        If you did not initiate this password reset, please ignore this email and ensure your account credentials remain secure.
      </p>

      <p style="font-size: 14px; color: #64748b; margin: 20px 0 0;">
        Regards,<br/>
        <strong style="color: #1e293b;">LapZon Security Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: cleanTo,
    subject,
    text,
    html
  });
}

/**
 * Customer Password Reset Verification Code Email
 * Dispatches a 6-digit OTP to verified customer accounts.
 */
export async function sendCustomerPasswordResetOtp({ to, otp, name }) {
  const cleanTo = String(to || '').trim().toLowerCase();
  if (!cleanTo) return { success: false, error: 'Recipient email required' };

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = name || 'Customer';
  const cleanOtp = String(otp || '').trim();
  const subject = 'LapZon - Password Reset Verification Code';

  const text = `Hello ${customerName},

You requested a password reset for your LapZon account (${cleanTo}).

Your Verification Code is: ${cleanOtp}

This code expires in 60 seconds.

If you did not request a password reset, please ignore this email or contact support.

LapZon Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px 30px; text-align: left; border-bottom: 2px solid #ea580c;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        Lap<span style="color: #ea580c;">Zon</span>
      </h1>
      <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Security & Password Recovery</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px; font-weight: 700;">Hello ${customerName},</h2>
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
        We received a request to reset the password for your LapZon account (<strong style="color: #0f172a;">${cleanTo}</strong>).
      </p>

      <!-- Highlighted Customer OTP Code Block -->
      <div style="background: #fff7ed; border: 2px dashed #ea580c; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #ea580c; font-weight: 800; display: block; margin-bottom: 8px;">Verification Code</span>
        <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: 'Courier New', Courier, monospace; display: block;">${cleanOtp}</span>
      </div>

      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #78350f;">
        ⏰ <strong>Code Expiry:</strong> This code is valid for <strong>60 seconds</strong>. Never share your verification code with anyone.
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">
        If you did not request a password reset, you can safely ignore this email. Your existing password will remain unchanged.
      </p>

      <p style="font-size: 14px; color: #64748b; margin: 20px 0 0;">
        Regards,<br/>
        <strong style="color: #1e293b;">LapZon Security Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: cleanTo,
    subject,
    text,
    html
  });
}

/**
 * 1. Account Created / Welcome Email
 * Sent to the customer immediately after successful registration.
 */
export async function sendAccountCreatedEmail(user) {
  if (!user || !user.email) return { success: false };

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = user.name || 'Valued Member';
  const customerEmail = user.email;
  const customerPhone = user.phone || 'Not provided';
  const region = user.country === 'AE' ? 'United Arab Emirates (AED)' : 'India (INR)';
  const subject = 'Welcome to LapZon - Account Created Successfully';

  const text = `Hello ${customerName},

Welcome to LapZon! Your account has been successfully created.

Account Details:
- Name: ${customerName}
- Registered Email: ${customerEmail}
- Mobile Number: ${customerPhone}
- Store Region: ${region}

You can now log in, explore our top laptops, and enjoy special member offers.

Thank you for joining LapZon!
LapZon Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 26px 30px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        Lap<span style="color: #ea580c;">Zon</span>
      </h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Welcome to Your Premium Laptop Destination</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px;">
        <h2 style="font-size: 18px; color: #15803d; margin: 0 0 4px; font-weight: 700;">🎉 Welcome, ${customerName}!</h2>
        <p style="font-size: 14px; color: #166534; margin: 0;">
          Your LapZon account has been <strong>successfully created</strong> and is now active.
        </p>
      </div>

      <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
        You are now ready to explore our wide collection of cutting-edge ultrabooks, gaming powerhouses, and professional laptops with verified brand warranties.
      </p>

      <table style="width: 100%; font-size: 14px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
        <tr><td style="padding: 5px 0; color: #64748b; width: 140px;">Registered Email:</td><td><strong>${customerEmail}</strong></td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Mobile Number:</td><td><strong>${customerPhone}</strong></td></tr>
        <tr><td style="padding: 5px 0; color: #64748b;">Store Region:</td><td><strong>${region}</strong></td></tr>
      </table>

      <div style="background: #f1f5f9; border-left: 4px solid #ea580c; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #475569;">
        🔒 <strong>Security Tip:</strong> Never share your password with anyone. LapZon will never ask for your password via email or message.
      </div>

      <p style="font-size: 14px; color: #64748b; margin: 24px 0 0;">
        Happy Shopping,<br/>
        <strong style="color: #1e293b;">The LapZon Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html
  });
}

/**
 * 2. Successful Login Email
 * Sent to the customer immediately after successful login.
 */
export async function sendLoginSuccessEmail(user) {
  if (!user || !user.email) return { success: false };

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = user.name || 'Customer';
  const subject = 'LapZon Login Successful';

  const text = `Hello ${customerName},
Your LapZon account has been successfully logged in.
If this wasn't you, please secure your account.
Thank you, LapZon Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px 28px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        Lap<span style="color: #ea580c;">Zon</span>
      </h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Security & Account Notification</p>
    </div>
    <div style="padding: 28px; line-height: 1.6;">
      <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 16px;">Hello ${customerName},</h2>
      <p style="font-size: 15px; color: #334155; margin: 0 0 16px;">
        Your LapZon account has been <strong>successfully logged in</strong>.
      </p>
      <div style="background: #f1f5f9; border-left: 4px solid #ea580c; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #475569;">
        🔒 If this wasn't you, please secure your account immediately or contact support.
      </div>
      <p style="font-size: 14px; color: #64748b; margin: 24px 0 0;">
        Thank you,<br/>
        <strong style="color: #1e293b;">LapZon Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
}

/**
 * Helper to format products in plain text and HTML
 */
function formatProducts(items, currencySymbol = '₹') {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      text: 'No products listed',
      html: '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #94a3b8;">No products</td></tr>'
    };
  }

  const textLines = items.map((it, idx) => {
    const qty = it.quantity || 1;
    const price = it.price ? `${currencySymbol}${Number(it.price).toLocaleString()}` : '';
    return `${idx + 1}. ${it.name} (Qty: ${qty}) - ${price}`;
  });

  const htmlRows = items.map((it) => {
    const qty = it.quantity || 1;
    const price = it.price ? `${currencySymbol}${Number(it.price).toLocaleString()}` : '';
    const lineTotal = it.price ? `${currencySymbol}${(Number(it.price) * qty).toLocaleString()}` : '';
    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 14px; color: #1e293b; font-weight: 600;">${it.name || 'Laptop'}</td>
        <td style="padding: 10px 8px; font-size: 14px; color: #475569; text-align: center;">${qty}</td>
        <td style="padding: 10px 8px; font-size: 14px; color: #475569; text-align: right;">${price}</td>
        <td style="padding: 10px 8px; font-size: 14px; color: #0f172a; text-align: right; font-weight: 700;">${lineTotal}</td>
      </tr>
    `;
  }).join('');

  return {
    text: textLines.join('\n'),
    html: htmlRows
  };
}

/**
 * 3. Successful Order Email (Customer)
 * Sent to the customer when an order is placed.
 */
export async function sendCustomerOrderEmail(order) {
  if (!order) return { success: false };

  const customerEmail = (order.customer && order.customer.email) || order.userEmail || order.email;
  if (!customerEmail) {
    console.warn(`[Email Service (SMTP)] sendCustomerOrderEmail skipped: missing customer email on order #${order.orderId || order.id}`);
    return { success: false, error: 'Missing customer email' };
  }

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = (order.customer && (order.customer.fullName || order.customer.name)) || 'Valued Customer';
  const orderId = order.orderId || order.id || 'N/A';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString();
  const paymentMethod = order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'Cash on Delivery';
  const currencySymbol = (order.pricing?.currency === 'AED' || (order.customer && order.customer.country === 'AE')) ? 'AED ' : '₹';
  const totalAmountNum = Number(order.pricing?.totalAmount ?? order.pricing?.total ?? 0);
  const totalAmount = `${currencySymbol}${totalAmountNum.toLocaleString()}`;
  const totalQty = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

  const address = (order.customer && order.customer.address)
    || (order.customer && [order.customer.houseNo, order.customer.street, order.customer.city, order.customer.state, order.customer.pinCode].filter(Boolean).join(', '))
    || 'Provided at checkout';

  const expectedDelivery = order.tracking?.expectedDate 
    ? order.tracking.expectedDate 
    : 'Estimated 2-4 business days';

  const productsFormatted = formatProducts(order.items, currencySymbol);
  const subject = `LapZon Order Confirmed - #${orderId}`;

  const text = `Hello ${customerName},

Your order has been successfully confirmed.

Order ID: #${orderId}
Order Date: ${orderDate}
Payment Method: ${paymentMethod}
Total Items: ${totalQty}
Total Amount: ${totalAmount}
Expected Delivery: ${expectedDelivery}

Delivery Address:
${address}

Ordered Products:
${productsFormatted.text}

We are preparing your package and will notify you when it ships.

Thank you for choosing LapZon!
LapZon Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px 28px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">
        Lap<span style="color: #ea580c;">Zon</span>
      </h1>
      <p style="color: #38bdf8; margin: 4px 0 0; font-size: 14px; font-weight: 600;">✓ Order Confirmed</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #166534; margin: 0 0 4px; font-weight: 700;">Hello ${customerName},</h2>
        <p style="font-size: 14px; color: #15803d; margin: 0;">
          Your order has been successfully confirmed.
        </p>
      </div>

      <table style="width: 100%; font-size: 13px; color: #475569; margin-bottom: 24px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0;"><strong>Order ID:</strong> #${orderId}</td>
          <td style="padding: 6px 0; text-align: right;"><strong>Date:</strong> ${orderDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><strong>Payment:</strong> ${paymentMethod}</td>
          <td style="padding: 6px 0; text-align: right;"><strong>Expected Delivery:</strong> ${expectedDelivery}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 6px 0;"><strong>Delivery Address:</strong> ${address}</td>
        </tr>
      </table>

      <h3 style="font-size: 15px; color: #0f172a; margin: 0 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Ordered Products</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productsFormatted.html}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 12px 8px; font-size: 15px; font-weight: 700; text-align: right; color: #0f172a;">Total Amount:</td>
            <td style="padding: 12px 8px; font-size: 16px; font-weight: 800; text-align: right; color: #ea580c;">${totalAmount}</td>
          </tr>
        </tfoot>
      </table>

      <p style="font-size: 14px; color: #64748b; margin: 24px 0 0;">
        Thank you for shopping with us!<br/>
        <strong style="color: #1e293b;">LapZon Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html
  });
}

/**
 * 4. Admin Order Notification
 * Sent to the configured admin email whenever a customer places an order.
 */
export async function sendAdminNewOrderEmail(order) {
  if (!order) return { success: false };

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.SMTP_FROM_EMAIL || 'noushamsi09@gmail.com').trim();
  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = (order.customer && (order.customer.fullName || order.customer.name)) || 'Customer';
  const customerEmail = (order.customer && order.customer.email) || order.userEmail || 'Not provided';
  const customerPhone = (order.customer && order.customer.phone) || 'Not provided';
  const orderId = order.orderId || order.id || 'N/A';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString();
  const paymentMethod = order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'Cash on Delivery';
  const currencySymbol = (order.pricing?.currency === 'AED' || (order.customer && order.customer.country === 'AE')) ? 'AED ' : '₹';
  const totalAmountNum = Number(order.pricing?.totalAmount ?? order.pricing?.total ?? 0);
  const totalAmount = `${currencySymbol}${totalAmountNum.toLocaleString()}`;
  const address = (order.customer && order.customer.address)
    || (order.customer && [order.customer.houseNo, order.customer.street, order.customer.city, order.customer.state, order.customer.pinCode].filter(Boolean).join(', '))
    || 'Provided at checkout';

  const productsFormatted = formatProducts(order.items, currencySymbol);
  const subject = `New Order Received - #${orderId}`;

  const text = `Hello Admin,

A new customer order has been placed on LapZon.

Order ID: #${orderId}
Order Date: ${orderDate}
Customer Name: ${customerName}
Customer Email: ${customerEmail}
Customer Phone: ${customerPhone}

Total Amount: ${totalAmount}
Payment Method: ${paymentMethod}

Delivery Address:
${address}

Ordered Products:
${productsFormatted.text}

Please log in to the Admin Dashboard to review and accept/confirm this order.
LapZon Automated System${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 24px 28px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">
        Lap<span style="color: #ea580c;">Zon</span> <span style="font-size: 14px; font-weight: 500; color: #cbd5e1;">Admin Notification</span>
      </h1>
      <p style="color: #fbbf24; margin: 4px 0 0; font-size: 14px; font-weight: 600;">🔔 New Order Received - #${orderId}</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <table style="width: 100%; font-size: 14px; color: #334155; margin-bottom: 20px; border-collapse: collapse;">
        <tr><td style="padding: 6px 0;"><strong>Customer Name:</strong></td><td>${customerName}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Customer Email:</strong></td><td><a href="mailto:${customerEmail}" style="color: #2563eb;">${customerEmail}</a></td></tr>
        <tr><td style="padding: 6px 0;"><strong>Customer Phone:</strong></td><td>${customerPhone}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Order ID:</strong></td><td>#${orderId}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Order Date:</strong></td><td>${orderDate}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Payment Method:</strong></td><td>${paymentMethod}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Total Amount:</strong></td><td style="font-weight: 800; color: #ea580c;">${totalAmount}</td></tr>
        <tr><td style="padding: 6px 0; vertical-align: top;"><strong>Delivery Address:</strong></td><td>${address}</td></tr>
      </table>

      <h3 style="font-size: 15px; color: #0f172a; margin: 16px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Ordered Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productsFormatted.html}
        </tbody>
      </table>

      <div style="background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; margin-top: 20px;">
        <span style="font-size: 13px; color: #64748b;">Manage this order in the LapZon Admin Dashboard</span>
      </div>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: adminEmail,
    subject,
    text,
    html
  });
}

/**
 * 5. Admin Order Confirmation
 * Sent to the customer when the admin accepts/confirms their order from the Admin Dashboard.
 */
export async function sendAdminOrderAcceptedEmail(order) {
  if (!order) return { success: false };

  const customerEmail = (order.customer && order.customer.email) || order.userEmail || order.email;
  if (!customerEmail) {
    console.warn(`[Email Service (SMTP)] sendAdminOrderAcceptedEmail skipped: missing customer email on order #${order.orderId || order.id}`);
    return { success: false, error: 'Missing customer email' };
  }

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = (order.customer && (order.customer.fullName || order.customer.name)) || 'Valued Customer';
  const orderId = order.orderId || order.id || 'N/A';
  const currencySymbol = (order.pricing?.currency === 'AED' || (order.customer && order.customer.country === 'AE')) ? 'AED ' : '₹';
  const totalAmountNum = Number(order.pricing?.totalAmount ?? order.pricing?.total ?? 0);
  const totalAmount = `${currencySymbol}${totalAmountNum.toLocaleString()}`;
  const expectedDelivery = order.tracking?.expectedDate 
    ? order.tracking.expectedDate 
    : 'Estimated 2-4 business days';

  const productsFormatted = formatProducts(order.items, currencySymbol);
  const subject = `LapZon Order Accepted - #${orderId}`;

  const text = `Hello ${customerName},

Great news! The admin has confirmed/accepted your order.

Order ID: #${orderId}
Total Amount: ${totalAmount}
Expected Delivery: ${expectedDelivery}

Ordered Items:
${productsFormatted.text}

Your order is now being processed and packaged for delivery. You can track live updates directly in your LapZon account.

Thank you for choosing LapZon!
LapZon Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 24px 28px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">
        Lap<span style="color: #fef08a;">Zon</span>
      </h1>
      <p style="color: #ffffff; margin: 4px 0 0; font-size: 15px; font-weight: 700;">✓ Order Accepted & Confirmed by Admin</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
        <h2 style="font-size: 17px; color: #065f46; margin: 0 0 6px; font-weight: 700;">Hello ${customerName},</h2>
        <p style="font-size: 15px; color: #047857; margin: 0; font-weight: 500;">
          The admin has <strong>confirmed/accepted your order</strong>!
        </p>
      </div>

      <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
        Your order <strong>#${orderId}</strong> has moved to the processing stage and is being packed.
      </p>

      <table style="width: 100%; font-size: 14px; color: #334155; margin-bottom: 20px;">
        <tr><td style="padding: 6px 0;"><strong>Order ID:</strong></td><td>#${orderId}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Total Amount:</strong></td><td style="font-weight: 800; color: #ea580c;">${totalAmount}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Expected Delivery:</strong></td><td>${expectedDelivery}</td></tr>
      </table>

      <h3 style="font-size: 15px; color: #0f172a; margin: 16px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Ordered Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productsFormatted.html}
        </tbody>
      </table>

      <p style="font-size: 14px; color: #64748b; margin: 24px 0 0;">
        Thank you for your order,<br/>
        <strong style="color: #1e293b;">LapZon Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html
  });
}

/**
 * 6. Order Delivered Notification
 * Sent to the customer when the admin marks their order as Delivered.
 */
export async function sendCustomerOrderDeliveredEmail(order) {
  if (!order) return { success: false };

  const customerEmail = (order.customer && order.customer.email) || order.userEmail || order.email;
  if (!customerEmail) {
    console.warn(`[Email Service (SMTP)] sendCustomerOrderDeliveredEmail skipped: missing customer email on order #${order.orderId || order.id}`);
    return { success: false, error: 'Missing customer email' };
  }

  const fromEmail = (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noushamsi09@gmail.com').trim();
  const customerName = (order.customer && (order.customer.fullName || order.customer.name)) || order.userName || 'Valued Customer';
  const orderId = order.orderId || order.id || 'N/A';
  const currencySymbol = (order.pricing?.currency === 'AED' || order.currency === 'AED' || (order.customer && order.customer.country === 'AE')) ? 'AED ' : '₹';
  const totalAmountNum = Number(order.pricing?.totalAmount ?? order.pricing?.total ?? order.total ?? 0);
  const totalAmount = `${currencySymbol}${totalAmountNum.toLocaleString()}`;
  const deliveredDate = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  const paymentMethod = order.paymentMethod ? String(order.paymentMethod).toUpperCase() : (order.payment?.method || 'Cash on Delivery (COD)');
  const address = (order.customer && order.customer.address)
    || (order.customer && [order.customer.houseNo, order.customer.street, order.customer.city, order.customer.state, order.customer.pinCode].filter(Boolean).join(', '))
    || (order.shippingAddress && [order.shippingAddress.flat, order.shippingAddress.area, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', '))
    || 'Registered Address';

  const productsFormatted = formatProducts(order.items, currencySymbol);
  const subject = `LapZon Order Delivered - #${orderId}`;

  const text = `Hello ${customerName},

Great news! Your LapZon order #${orderId} has been successfully delivered!

Order ID: #${orderId}
Delivered Date: ${deliveredDate}
Total Amount: ${totalAmount}
Payment Method: ${paymentMethod}
Delivery Address: ${address}

Delivered Items:
${productsFormatted.text}

We hope you enjoy your new laptop! If you have any questions or require warranty support, our team is always here to assist you.

Thank you for shopping with LapZon!
LapZon Team${getEmailFooterText(fromEmail)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 28px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">
        Lap<span style="color: #fef08a;">Zon</span>
      </h1>
      <p style="color: #ffffff; margin: 4px 0 0; font-size: 15px; font-weight: 700;">🎉 Order Delivered Successfully</p>
    </div>

    <div style="padding: 28px; line-height: 1.6;">
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
        <h2 style="font-size: 17px; color: #065f46; margin: 0 0 6px; font-weight: 700;">Hello ${customerName},</h2>
        <p style="font-size: 15px; color: #047857; margin: 0; font-weight: 600;">
          Your order <strong>#${orderId}</strong> has been successfully delivered!
        </p>
      </div>

      <table style="width: 100%; font-size: 14px; color: #334155; margin-bottom: 20px; border-collapse: collapse;">
        <tr><td style="padding: 6px 0;"><strong>Order ID:</strong></td><td>#${orderId}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Delivered On:</strong></td><td>${deliveredDate}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Total Amount:</strong></td><td style="font-weight: 800; color: #ea580c;">${totalAmount}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Payment Method:</strong></td><td>${paymentMethod}</td></tr>
        <tr><td style="padding: 6px 0; vertical-align: top;"><strong>Delivered Address:</strong></td><td>${address}</td></tr>
      </table>

      <h3 style="font-size: 15px; color: #0f172a; margin: 16px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Delivered Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; font-size: 12px; text-transform: uppercase; color: #64748b;">
            <th style="padding: 8px; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productsFormatted.html}
        </tbody>
      </table>

      <div style="background: #f0fdf4; border: 1px dashed #86efac; border-radius: 8px; padding: 14px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">
          ⭐ We hope you love your new laptop! You can share your review directly on LapZon.
        </p>
      </div>

      <p style="font-size: 14px; color: #64748b; margin: 24px 0 0;">
        Thank you for choosing LapZon,<br/>
        <strong style="color: #1e293b;">LapZon Team</strong>
      </p>

      ${getEmailFooterHtml(fromEmail)}
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html
  });
}

