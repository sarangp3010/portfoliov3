export interface InquiryData {
  name: string;
  email: string;
  subject: string;
  message: string;
  serviceType?: string;
}

export const adminEmailTemplate = (d: InquiryData) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Inquiry</title></head>
<body style="margin:0;padding:0;background:#080c14;font-family:'Segoe UI',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%);border-radius:20px 20px 0 0;padding:48px;text-align:center;">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:16px;text-align:center;vertical-align:middle;font-size:24px;">📬</td></tr></table>
  <p style="margin:0 0 6px;color:rgba(255,255,255,0.65);font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Portfolio Notification</p>
  <h1 style="margin:0 0 8px;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">New Inquiry Received</h1>
  <p style="margin:0;color:rgba(255,255,255,0.75);font-size:15px;">Someone reached out through your contact form</p>
</td></tr>

<!-- Body -->
<tr><td style="background:#0f1629;padding:40px 48px;">
  <!-- Sender Card -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2035;border-radius:14px;border:1px solid #2a3a5c;margin-bottom:28px;">
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 20px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">From</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid #2a3a5c;color:#64748b;font-size:13px;width:100px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #2a3a5c;color:#e2e8f0;font-size:14px;font-weight:600;">${d.name}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #2a3a5c;color:#64748b;font-size:13px;">Email</td><td style="padding:10px 0;border-bottom:1px solid #2a3a5c;"><a href="mailto:${d.email}" style="color:#818cf8;font-size:14px;font-weight:600;text-decoration:none;">${d.email}</a></td></tr>
      ${d.serviceType ? `<tr><td style="padding:10px 0;border-bottom:1px solid #2a3a5c;color:#64748b;font-size:13px;">Service</td><td style="padding:10px 0;border-bottom:1px solid #2a3a5c;"><span style="background:#4f46e5;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;">${d.serviceType}</span></td></tr>` : ''}
      <tr><td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;padding-top:14px;">Subject</td><td style="padding:10px 0;color:#e2e8f0;font-size:14px;font-weight:600;padding-top:14px;">${d.subject}</td></tr>
    </table>
  </td></tr></table>

  <!-- Message -->
  <p style="margin:0 0 12px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Message</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2035;border-radius:14px;border:1px solid #2a3a5c;border-left:4px solid #4f46e5;margin-bottom:32px;">
  <tr><td style="padding:24px 32px;">
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.85;white-space:pre-wrap;">${d.message}</p>
  </td></tr></table>

  <!-- Reply Button -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="mailto:${d.email}?subject=Re: ${encodeURIComponent(d.subject)}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;">
      Reply to ${d.name} →
    </a>
  </td></tr></table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#080c14;border-radius:0 0 20px 20px;padding:24px 48px;text-align:center;border-top:1px solid #1a2035;">
  <p style="margin:0;color:#334155;font-size:12px;line-height:1.7;">Portfolio contact notification · <span style="color:#4f46e5;">yourname.dev</span></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

export const confirmationEmailTemplate = (d: InquiryData) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Got Your Message</title></head>
<body style="margin:0;padding:0;background:#080c14;font-family:'Segoe UI',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%);border-radius:20px 20px 0 0;padding:48px;text-align:center;">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;text-align:center;vertical-align:middle;color:#fff;font-size:28px;font-weight:900;">✓</td></tr></table>
  <h1 style="margin:0 0 8px;color:#fff;font-size:28px;font-weight:800;">Message Received!</h1>
  <p style="margin:0;color:rgba(255,255,255,0.8);font-size:16px;">Thanks for reaching out, ${d.name.split(' ')[0]} — I'll be in touch soon.</p>
</td></tr>

<!-- Body -->
<tr><td style="background:#0f1629;padding:40px 48px;">
  <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.8;">
    I've received your message and will review it shortly. I typically respond within <strong style="color:#e2e8f0;">24–48 hours</strong> on business days.
  </p>

  <!-- Summary -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2035;border-radius:14px;border:1px solid #2a3a5c;margin-bottom:32px;">
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 16px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Your Message</p>
    <p style="margin:0 0 8px;"><span style="color:#64748b;font-size:13px;">Subject: </span><span style="color:#e2e8f0;font-weight:600;font-size:14px;">${d.subject}</span></p>
    <div style="background:#0f1629;border-radius:10px;border-left:3px solid #4f46e5;padding:16px 20px;margin-top:16px;">
      <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;font-style:italic;">"${d.message.length > 200 ? d.message.slice(0, 200) + '…' : d.message}"</p>
    </div>
  </td></tr></table>

  <!-- Steps -->
  <p style="margin:0 0 16px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">What Happens Next</p>
  ${[['📋','Review',"I'll read your message and understand your requirements."],['💬','Respond',"I'll reply to this email with my thoughts or follow-up questions."],['🤝','Connect',"If it's a good fit, we'll schedule a call to discuss next steps."]].map(([icon,title,desc],i)=>`
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
    <td style="width:44px;vertical-align:top;padding-top:2px;">
      <div style="width:36px;height:36px;background:#1a2035;border:1px solid #2a3a5c;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">${icon}</div>
    </td>
    <td style="padding-left:14px;vertical-align:top;">
      <p style="margin:0 0 3px;color:#e2e8f0;font-weight:600;font-size:14px;">${title}</p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">${desc}</p>
    </td>
  </tr></table>`).join('')}

  <p style="margin:28px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
    In the meantime, check out my work on
    <a href="https://github.com/yourname" style="color:#818cf8;text-decoration:none;font-weight:600;">GitHub</a> or
    <a href="https://linkedin.com/in/yourname" style="color:#818cf8;text-decoration:none;font-weight:600;">LinkedIn</a>.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#080c14;border-radius:0 0 20px 20px;padding:28px 48px;text-align:center;border-top:1px solid #1a2035;">
  <p style="margin:0 0 4px;color:#e2e8f0;font-weight:700;font-size:16px;">Your Name</p>
  <p style="margin:0 0 12px;color:#4f46e5;font-size:13px;">Full-Stack Software Engineer</p>
  <p style="margin:0;color:#334155;font-size:12px;">hello@yourname.dev · yourname.dev</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
