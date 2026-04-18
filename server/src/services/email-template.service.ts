/**
 * email-template.service.ts
 *
 * Single source of truth for all outgoing emails.
 * Loads templates from the database; falls back to hardcoded defaults
 * so the system works even before templates are seeded.
 */

import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

// ─── Variable substitution ────────────────────────────────────────────────────

export function renderTemplate(
  html: string,
  vars: Record<string, string | number | undefined>
): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

export function renderSubject(
  subject: string,
  vars: Record<string, string | number | undefined>
): string {
  return renderTemplate(subject, vars);
}

// ─── Load template from DB with fallback ─────────────────────────────────────

export async function getTemplate(key: string): Promise<{ subject: string; html: string } | null> {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { key } });
    if (tpl) return { subject: tpl.subject, html: tpl.html };
  } catch (err) {
    logger.warn(`[email-template] DB lookup failed for "${key}":`, err);
  }
  // Return hardcoded fallback
  const fallback = FALLBACK_TEMPLATES[key];
  return fallback ?? null;
}

// ─── Render + return final subject/html ──────────────────────────────────────

export async function renderEmail(
  key: string,
  vars: Record<string, string | number | undefined>
): Promise<{ subject: string; html: string } | null> {
  const tpl = await getTemplate(key);
  if (!tpl) {
    logger.warn(`[email-template] No template found for key: "${key}"`);
    return null;
  }
  return {
    subject: renderSubject(tpl.subject, vars),
    html: renderTemplate(tpl.html, vars),
  };
}

// ─── Fallback hardcoded templates (used when DB is empty) ────────────────────
// These mirror exactly what gets seeded into the DB

const BASE_STYLE = `
  body{margin:0;padding:0;background:#080c14;font-family:'Segoe UI',system-ui,sans-serif;}
  .wrap{max-width:600px;margin:0 auto;padding:40px 20px;}
  .header{background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:20px 20px 0 0;padding:48px;text-align:center;}
  .body{background:#0f1629;padding:40px 48px;}
  .footer{background:#080c14;border-radius:0 0 20px 20px;padding:24px 48px;text-align:center;border-top:1px solid #1a2035;}
  h1{margin:0 0 8px;color:#fff;font-size:26px;font-weight:800;}
  p{margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.75;}
  .card{background:#1a2035;border-radius:14px;border:1px solid #2a3a5c;padding:28px 32px;margin-bottom:24px;}
  .label{color:#64748b;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;}
  .value{color:#e2e8f0;font-size:14px;font-weight:600;}
  .btn{display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;}
  .footer-text{color:#334155;font-size:12px;}
`;

function wrap(headerContent: string, bodyContent: string, footerText = ''): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_STYLE}</style></head>
<body><div class="wrap">
  <div class="header">${headerContent}</div>
  <div class="body">${bodyContent}</div>
  <div class="footer"><p class="footer-text">${footerText || '© Portfolio Platform'}</p></div>
</div></body></html>`;
}

export const FALLBACK_TEMPLATES: Record<string, { subject: string; html: string }> = {

  inquiry_received: {
    subject: 'New Inquiry from {{name}}: {{subject}}',
    html: wrap(
      `<h1>📬 New Inquiry</h1><p style="color:rgba(255,255,255,0.8)">Someone reached out through your portfolio</p>`,
      `<div class="card">
        <p class="label">From</p>
        <p class="value">{{name}} &lt;<a href="mailto:{{email}}" style="color:#818cf8">{{email}}</a>&gt;</p>
        <p class="label" style="margin-top:16px">Subject</p>
        <p class="value">{{subject}}</p>
        {{#service}}<p class="label" style="margin-top:16px">Service Interest</p><p class="value">{{service}}</p>{{/service}}
      </div>
      <p class="label">Message</p>
      <div class="card" style="border-left:4px solid #4f46e5">
        <p style="color:#cbd5e1;white-space:pre-wrap">{{message}}</p>
      </div>
      <p style="text-align:center"><a class="btn" href="mailto:{{email}}?subject=Re: {{subject}}">Reply to {{name}} →</a></p>`,
      'Portfolio inquiry notification'
    ),
  },

  inquiry_confirmation: {
    subject: 'Got your message, {{name}} — I\'ll be in touch soon!',
    html: wrap(
      `<div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff">✓</div>
       <h1>Message Received!</h1><p style="color:rgba(255,255,255,0.8)">Thanks for reaching out, {{name}} — I'll be in touch soon.</p>`,
      `<p>I've received your message and will review it shortly. I typically respond within <strong style="color:#e2e8f0">24–48 hours</strong> on business days.</p>
       <div class="card">
         <p class="label">Your Message</p>
         <p class="value">Subject: {{subject}}</p>
         <div style="background:#0f1629;border-radius:10px;border-left:3px solid #4f46e5;padding:16px 20px;margin-top:12px">
           <p style="color:#64748b;font-style:italic">"{{preview}}"</p>
         </div>
       </div>`,
      'You are receiving this because you submitted a contact form.'
    ),
  },

  payment_success: {
    subject: 'Payment Confirmed — {{service}}',
    html: wrap(
      `<div style="width:64px;height:64px;background:rgba(52,211,153,0.2);border-radius:50%;margin:0 auto 20px;text-align:center;line-height:64px;font-size:28px">✅</div>
       <h1>Payment Confirmed!</h1><p style="color:rgba(255,255,255,0.8)">Your payment has been received and processed.</p>`,
      `<p>Hi {{name}}, thank you for your payment. Here are the details:</p>
       <div class="card">
         <table width="100%" cellpadding="0" cellspacing="0">
           <tr><td class="label" style="padding:8px 0;width:120px">Service</td><td class="value" style="padding:8px 0">{{service}}</td></tr>
           <tr><td class="label" style="padding:8px 0;border-top:1px solid #2a3a5c">Amount</td><td class="value" style="padding:8px 0;border-top:1px solid #2a3a5c;color:#4ade80;font-size:20px">{{amount}}</td></tr>
           <tr><td class="label" style="padding:8px 0;border-top:1px solid #2a3a5c">Date</td><td class="value" style="padding:8px 0;border-top:1px solid #2a3a5c">{{date}}</td></tr>
         </table>
       </div>
       <p>I'll review your order and be in touch within <strong style="color:#e2e8f0">24 hours</strong> to get started.</p>`,
      'You are receiving this because you made a purchase.'
    ),
  },

  payment_failed: {
    subject: 'Payment Issue — Action Required',
    html: wrap(
      `<div style="width:64px;height:64px;background:rgba(248,113,113,0.2);border-radius:50%;margin:0 auto 20px;text-align:center;line-height:64px;font-size:28px">⚠️</div>
       <h1 style="color:#fca5a5">Payment Failed</h1><p style="color:rgba(255,255,255,0.8)">Unfortunately your payment could not be processed.</p>`,
      `<p>Hi {{name}}, your payment for <strong style="color:#e2e8f0">{{service}}</strong> on {{date}} was unsuccessful.</p>
       <div class="card">
         <p class="label">What to do next</p>
         <p>Please check your card details and try again, or use a different payment method.</p>
       </div>
       <p style="text-align:center"><a class="btn" href="{{portal_url}}/services">Try Again →</a></p>`,
      'You are receiving this because a payment attempt was made.'
    ),
  },

  payment_receipt: {
    subject: 'Receipt for {{service}} — {{amount}}',
    html: wrap(
      `<h1>🧾 Payment Receipt</h1><p style="color:rgba(255,255,255,0.8)">Thank you for your purchase.</p>`,
      `<p>Hi {{name}}, here is your official receipt.</p>
       <div class="card">
         <p class="label">Receipt Details</p>
         <table width="100%" cellpadding="0" cellspacing="0">
           <tr><td class="label" style="padding:8px 0;width:140px">Receipt No.</td><td class="value" style="padding:8px 0">{{receipt_id}}</td></tr>
           <tr><td class="label" style="padding:8px 0;border-top:1px solid #2a3a5c">Service</td><td class="value" style="padding:8px 0;border-top:1px solid #2a3a5c">{{service}}</td></tr>
           <tr><td class="label" style="padding:8px 0;border-top:1px solid #2a3a5c">Amount</td><td class="value" style="padding:8px 0;border-top:1px solid #2a3a5c;color:#4ade80">{{amount}}</td></tr>
           <tr><td class="label" style="padding:8px 0;border-top:1px solid #2a3a5c">Date</td><td class="value" style="padding:8px 0;border-top:1px solid #2a3a5c">{{date}}</td></tr>
         </table>
       </div>
       <p>Keep this email for your records.</p>`,
      'Official payment receipt from Portfolio Platform'
    ),
  },

  welcome: {
    subject: 'Welcome to the Customer Portal, {{name}}!',
    html: wrap(
      `<div style="width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#06b6d4);border-radius:16px;margin:0 auto 20px;text-align:center;line-height:56px;font-size:24px">⚡</div>
       <h1>Welcome, {{name}}!</h1><p style="color:rgba(255,255,255,0.8)">Your account has been created successfully.</p>`,
      `<p>You can now access your customer portal to:</p>
       <div class="card">
         <p>💼 Browse and purchase service plans</p>
         <p>💳 View payment history and receipts</p>
         <p>💬 Send messages to the developer</p>
         <p style="margin-bottom:0">👤 Manage your account settings</p>
       </div>
       <p style="text-align:center"><a class="btn" href="{{portal_url}}/dashboard">Open Your Dashboard →</a></p>`,
      'You are receiving this because you created an account.'
    ),
  },

  contact_message: {
    subject: 'New Customer Message from {{name}}',
    html: wrap(
      `<h1>💬 Customer Message</h1><p style="color:rgba(255,255,255,0.8)">A customer sent you a message through the portal.</p>`,
      `<div class="card">
         <p class="label">From</p>
         <p class="value">{{name}} &lt;<a href="mailto:{{email}}" style="color:#818cf8">{{email}}</a>&gt;</p>
         <p class="label" style="margin-top:16px">Message</p>
         <p style="color:#cbd5e1;white-space:pre-wrap">{{message}}</p>
       </div>`,
      'Customer portal notification'
    ),
  },

  admin_reply: {
    subject: 'Response to your message',
    html: wrap(
      `<h1>📩 You've Got a Reply</h1><p style="color:rgba(255,255,255,0.8)">The developer has responded to your message.</p>`,
      `<p>Hi {{name}},</p>
       <div class="card" style="border-left:4px solid #4f46e5">
         <p style="color:#cbd5e1;white-space:pre-wrap">{{reply}}</p>
       </div>
       <p style="text-align:center"><a class="btn" href="{{portal_url}}/contact-admin">Reply Back →</a></p>`,
      'You are receiving this because you sent a message through the customer portal.'
    ),
  },
};
