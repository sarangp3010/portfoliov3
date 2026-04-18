/**
 * Client-side PDF generation using the browser's print API.
 * Each function opens a styled print window with professional layout.
 * The server provides data via /api/pdf/* endpoints.
 */

import { getResumeData, getPortfolioData } from '../api';

// ─── Shared styles ──────────────────────────────────────────────────────────
const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { margin: 2cm 2.2cm; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #1e293b;
    background: #fff;
  }
  h1 { font-size: 22pt; font-weight: 800; letter-spacing: -0.5px; }
  h2 { font-size: 13pt; font-weight: 700; color: #1e293b; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; margin: 18px 0 10px; }
  h3 { font-size: 11pt; font-weight: 600; color: #334155; }
  p  { color: #475569; }
  .accent { color: #6366f1; }
  .tag {
    display: inline-block;
    background: #ede9fe; color: #5b21b6;
    padding: 2px 8px; border-radius: 100px; font-size: 8.5pt; font-weight: 600;
    margin: 2px 2px;
  }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
  th { background: #f1f5f9; color: #334155; font-weight: 700; padding: 7px 12px; text-align: left; border: 1px solid #e2e8f0; }
  td { padding: 6px 12px; border: 1px solid #e2e8f0; color: #475569; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 14px 0; }
  .meta-row { display: flex; gap: 20px; flex-wrap: wrap; margin: 6px 0; font-size: 9.5pt; color: #64748b; }
  .meta-item::before { content: 'o '; color: #6366f1; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 100px; font-size: 8.5pt; font-weight: 600; }
  .badge-green  { background: #dcfce7; color: #15803d; }
  .badge-yellow { background: #fef9c3; color: #92400e; }
  .badge-red    { background: #fee2e2; color: #b91c1c; }
  .badge-purple { background: #ede9fe; color: #5b21b6; }
  .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #94a3b8; font-size: 8.5pt; display: flex; justify-content: space-between; }
  @media print { .no-print { display: none !important; } a { color: inherit; text-decoration: none; } }
`;

// ─── Open print window ───────────────────────────────────────────────────────
const printWindow = (title: string, html: string) => {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { console.warn('Please allow popups to generate PDFs'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${BASE_STYLES}</style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
};

// ─── Resume PDF ──────────────────────────────────────────────────────────────
export const downloadResumePDF = async () => {
  const r = await getResumeData();
  const d = r.data.data;
  const profile  = d.profile;
  const projects = d.projects ?? [];

  const skillsHTML = (profile?.skills    ?? []).map((s: string) => `<span class="tag">${s}</span>`).join('');
  const techHTML   = (profile?.techStack ?? []).map((s: string) => `<span class="tag">${s}</span>`).join('');

  const projectsHTML = projects.slice(0, 4).map((p: any) => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <h3>${p.title}</h3>
        <span style="font-size:8.5pt;color:#94a3b8;font-family:monospace;">
          ${p.githubUrl ? p.githubUrl.replace('https://github.com/','') : ''}
        </span>
      </div>
      <p style="margin:3px 0 6px;">${p.description}</p>
      <div>${(p.techStack ?? []).map((t: string) => `<span class="tag">${t}</span>`).join('')}</div>
    </div>
  `).join('');

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
      <div>
        <h1>${profile?.name ?? 'Developer'}</h1>
        <p class="accent" style="font-size:12pt;font-weight:600;margin-top:2px;">${profile?.title ?? 'Software Engineer'}</p>
        <div class="meta-row" style="margin-top:8px;">
          ${profile?.location ? `<span class="meta-item">${profile.location}</span>` : ''}
          ${profile?.email    ? `<span class="meta-item">${profile.email}</span>` : ''}
          ${profile?.phone    ? `<span class="meta-item">${profile.phone}</span>` : ''}
        </div>
        <div class="meta-row">
          ${profile?.githubUrl   ? `<span class="meta-item">${profile.githubUrl.replace('https://','')}</span>` : ''}
          ${profile?.linkedinUrl ? `<span class="meta-item">${profile.linkedinUrl.replace('https://','')}</span>` : ''}
          ${profile?.websiteUrl  ? `<span class="meta-item">${profile.websiteUrl.replace('https://','')}</span>` : ''}
        </div>
      </div>
      <div style="text-align:right;">
        ${profile?.available
          ? '<span class="badge badge-green">Available for Work</span>'
          : '<span class="badge badge-yellow">Not Available</span>'}
      </div>
    </div>
    <hr class="divider"/>

    <h2>Profile</h2>
    <p style="line-height:1.7;">${profile?.bio ?? ''}</p>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      ${[
        [`${profile?.yearsExp    ?? 0}+`, 'Years Experience'],
        [`${profile?.projectCount ?? 0}+`, 'Projects Shipped'],
        [`${profile?.clientCount  ?? 0}+`, 'Happy Clients'],
      ].map(([v, l]) => `
        <div style="text-align:center;">
          <p style="font-size:16pt;font-weight:800;color:#6366f1;">${v}</p>
          <p style="font-size:8.5pt;color:#94a3b8;">${l}</p>
        </div>
      `).join('')}
    </div>

    <h2>Skills &amp; Technology</h2>
    <div style="margin-bottom:10px;">
      <strong style="font-size:9.5pt;color:#334155;">Technical Skills:</strong><br/>${skillsHTML}
    </div>
    <div>
      <strong style="font-size:9.5pt;color:#334155;">Tech Stack:</strong><br/>${techHTML}
    </div>

    ${projects.length > 0 ? `<h2>Featured Projects</h2>${projectsHTML}` : ''}

    <div class="footer">
      <span>${profile?.name ?? ''} — ${profile?.title ?? ''}</span>
      <span>Generated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</span>
    </div>
  `;

  printWindow(`Resume — ${profile?.name ?? 'Developer'}`, html);
};

// ─── Portfolio PDF ───────────────────────────────────────────────────────────
export const downloadPortfolioPDF = async () => {
  const r = await getPortfolioData();
  const d = r.data.data;
  const profile  = d.profile;
  const projects = d.projects ?? [];
  const posts    = d.posts    ?? [];
  const services = d.services ?? [];

  const projectsHTML = projects.map((p: any) => `
    <tr>
      <td style="font-weight:600;color:#1e293b;">${p.title}</td>
      <td>${p.description}</td>
      <td>${(p.techStack ?? []).slice(0, 4).join(', ')}</td>
      <td>${p.githubUrl ? `<a href="${p.githubUrl}" style="color:#6366f1;">GitHub</a>` : '—'}</td>
    </tr>
  `).join('');

  const postsHTML = posts.map((p: any) => `
    <tr>
      <td style="font-weight:600;color:#1e293b;">${p.title}</td>
      <td>${(p.excerpt ?? '').slice(0, 80)}…</td>
      <td>${(p.tags ?? []).slice(0, 3).join(', ')}</td>
      <td style="font-weight:700;color:#6366f1;">${(p.views ?? 0).toLocaleString()}</td>
    </tr>
  `).join('');

  const servicesHTML = services.map((s: any) => `
    <tr>
      <td style="font-weight:600;color:#1e293b;">${s.title}</td>
      <td>${s.description}</td>
      <td style="font-weight:700;color:#6366f1;">${s.price}</td>
      <td>${s.popular ? '<span class="badge badge-purple">Popular</span>' : '—'}</td>
    </tr>
  `).join('');

  const html = `
    <div style="text-align:center;padding:30px 0 24px;border-bottom:2px solid #6366f1;margin-bottom:24px;">
      <p style="font-size:9pt;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6366f1;margin-bottom:8px;">Portfolio</p>
      <h1 style="font-size:28pt;">${profile?.name ?? 'Developer'}</h1>
      <p style="font-size:13pt;color:#6366f1;font-weight:600;margin-top:4px;">${profile?.title ?? 'Software Engineer'}</p>
      <p style="color:#94a3b8;margin-top:8px;font-size:9.5pt;">${profile?.email ?? ''} ${profile?.location ? `· ${profile.location}` : ''}</p>
      <p style="color:#94a3b8;font-size:8.5pt;margin-top:4px;">Generated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
    </div>

    <h2>About</h2>
    <p style="line-height:1.8;">${profile?.bio ?? ''}</p>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      ${[
        [`${profile?.yearsExp    ?? 0}+`, 'Experience'],
        [`${profile?.projectCount ?? 0}+`, 'Projects'],
        [`${profile?.clientCount  ?? 0}+`, 'Clients'],
        [(profile?.skills ?? []).length.toString(), 'Skills'],
      ].map(([v, l]) => `
        <div style="text-align:center;">
          <p style="font-size:15pt;font-weight:800;color:#6366f1;">${v}</p>
          <p style="font-size:8.5pt;color:#94a3b8;">${l}</p>
        </div>
      `).join('')}
    </div>

    ${projects.length > 0 ? `
    <h2>Portfolio Projects (${projects.length})</h2>
    <table>
      <thead><tr><th>Project</th><th>Description</th><th>Tech Stack</th><th>Links</th></tr></thead>
      <tbody>${projectsHTML}</tbody>
    </table>` : ''}

    ${posts.length > 0 ? `
    <h2>Blog Posts (${posts.length})</h2>
    <table>
      <thead><tr><th>Title</th><th>Excerpt</th><th>Tags</th><th>Views</th></tr></thead>
      <tbody>${postsHTML}</tbody>
    </table>` : ''}

    ${services.length > 0 ? `
    <h2>Services &amp; Pricing</h2>
    <table>
      <thead><tr><th>Service</th><th>Description</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>${servicesHTML}</tbody>
    </table>` : ''}

    <h2>Technologies</h2>
    <div>${(profile?.skills ?? []).map((s: string) => `<span class="tag">${s}</span>`).join('')}</div>

    <div class="footer">
      <span>${profile?.name ?? ''} — Portfolio Export</span>
      <span>${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</span>
    </div>
  `;

  printWindow(`Portfolio — ${profile?.name ?? 'Developer'}`, html);
};

// ─── Payment Receipt PDF ─────────────────────────────────────────────────────
export const downloadReceiptPDF = (payment: {
  id: string; amount: number; currency: string; status: string;
  type: string; description?: string; customerName?: string;
  customerEmail?: string; serviceName?: string; createdAt: string;
  stripeSessionId?: string;
}) => {
  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: (payment.currency ?? 'usd').toUpperCase() }).format(cents / 100);

  const html = `
    <div style="max-width:560px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #6366f1;">
        <div>
          <p style="font-size:9pt;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6366f1;">Payment Receipt</p>
          <h1 style="font-size:20pt;margin-top:4px;">Thank You!</h1>
        </div>
        <div style="text-align:right;">
          <p style="font-size:22pt;font-weight:800;color:#6366f1;">${fmt(payment.amount)}</p>
          <span class="badge ${payment.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}">${payment.status}</span>
        </div>
      </div>

      <table style="margin-bottom:20px;">
        <tbody>
          <tr><td style="font-weight:700;color:#334155;width:40%;">Receipt ID</td>   <td style="font-family:monospace;font-size:9pt;">${payment.id}</td></tr>
          <tr><td style="font-weight:700;color:#334155;">Date</td>                    <td>${new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
          <tr><td style="font-weight:700;color:#334155;">Customer</td>                <td>${payment.customerName ?? '—'}</td></tr>
          <tr><td style="font-weight:700;color:#334155;">Email</td>                   <td>${payment.customerEmail ?? '—'}</td></tr>
          <tr><td style="font-weight:700;color:#334155;">Description</td>             <td>${payment.description ?? '—'}</td></tr>
          <tr><td style="font-weight:700;color:#334155;">Service</td>                 <td>${payment.serviceName ?? payment.type}</td></tr>
          <tr><td style="font-weight:700;color:#334155;">Amount</td>                  <td style="font-weight:700;font-size:11pt;color:#6366f1;">${fmt(payment.amount)}</td></tr>
          ${payment.stripeSessionId ? `<tr><td style="font-weight:700;color:#334155;">Stripe Reference</td><td style="font-family:monospace;font-size:8pt;">${payment.stripeSessionId}</td></tr>` : ''}
        </tbody>
      </table>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;font-size:9.5pt;color:#64748b;">
          <span>Subtotal</span><span>${fmt(payment.amount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9.5pt;color:#64748b;margin:6px 0;">
          <span>Processing fee</span><span>$0.00</span>
        </div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:10px 0;" />
        <div style="display:flex;justify-content:space-between;font-size:12pt;font-weight:700;color:#1e293b;">
          <span>Total Paid</span><span style="color:#6366f1;">${fmt(payment.amount)}</span>
        </div>
      </div>

      <p style="text-align:center;color:#94a3b8;font-size:8.5pt;">
        This receipt was automatically generated. Please keep it for your records.
      </p>

      <div class="footer">
        <span>Payment Receipt</span>
        <span>${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</span>
      </div>
    </div>
  `;

  printWindow(`Receipt — ${payment.id.slice(0, 8)}`, html);
};

// ─── Analytics Report PDF ────────────────────────────────────────────────────
export const downloadAnalyticsReportPDF = async (days = 30) => {
  const { getAnalyticsReportData } = await import('../api');
  const r = await getAnalyticsReportData(days);
  const d = r.data.data;

  const topPagesHTML = (d.topPages ?? []).map((p: any) => `
    <tr>
      <td style="font-family:monospace;font-size:9pt;">${p.page}</td>
      <td style="text-align:right;font-weight:700;color:#6366f1;">${p.views.toLocaleString()}</td>
    </tr>
  `).join('');

  const dailyHTML = (d.dailyData ?? []).slice(-14).map((day: any) => `
    <tr>
      <td style="font-family:monospace;">${day.day}</td>
      <td style="text-align:right;">${day.visitors.toLocaleString()}</td>
      <td style="text-align:right;">${day.pageviews.toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #6366f1;">
      <div>
        <p style="font-size:9pt;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6366f1;">Analytics Report</p>
        <h1 style="font-size:22pt;margin-top:4px;">Last ${days} Days</h1>
      </div>
      <div style="text-align:right;">
        <p style="font-size:9.5pt;color:#64748b;">Generated</p>
        <p style="font-weight:600;">${new Date(d.generatedAt ?? Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>

    <h2>Key Metrics</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0 20px;">
      ${[
        ['Unique Visitors', d.visitors?.toLocaleString() ?? 0],
        ['Page Views',      d.pageViews?.toLocaleString() ?? 0],
        ['Inquiries',       d.inquiries?.toLocaleString() ?? 0],
        ['Avg Per Visitor', d.visitors > 0 ? (d.pageViews / d.visitors).toFixed(1) : 0],
      ].map(([label, val]) => `
        <div style="text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 10px;">
          <p style="font-size:16pt;font-weight:800;color:#6366f1;">${val}</p>
          <p style="font-size:8.5pt;color:#94a3b8;">${label}</p>
        </div>
      `).join('')}
    </div>

    ${topPagesHTML ? `
    <h2>Top Pages</h2>
    <table>
      <thead><tr><th>Page</th><th style="text-align:right;">Views</th></tr></thead>
      <tbody>${topPagesHTML}</tbody>
    </table>` : ''}

    ${dailyHTML ? `
    <h2>Daily Traffic (Last 14 Days)</h2>
    <table>
      <thead><tr><th>Date</th><th style="text-align:right;">Visitors</th><th style="text-align:right;">Page Views</th></tr></thead>
      <tbody>${dailyHTML}</tbody>
    </table>` : ''}

    <div class="footer">
      <span>Analytics Report — ${days}-day period</span>
      <span>${new Date(d.generatedAt ?? Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</span>
    </div>
  `;

  printWindow(`Analytics Report — ${days}d`, html);
};
