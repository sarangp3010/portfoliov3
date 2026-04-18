import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../types/index.js';
import { getServicePlans } from '../services/payment.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Build rich platform context ─────────────────────────────────────────────

async function buildPlatformContext(customerId?: string): Promise<string> {
  const [profile, projects, services, plans, testimonials, recentPosts] = await Promise.all([
    prisma.profile.findFirst(),
    prisma.project.findMany({ orderBy: [{ featured: 'desc' }, { order: 'asc' }], take: 12 }),
    prisma.service.findMany({ orderBy: { order: 'asc' } }),
    getServicePlans(),
    prisma.testimonial.findMany({ where: { featured: true }, orderBy: { order: 'asc' }, take: 4 }),
    prisma.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => []),
  ]);

  let ctx = '# PLATFORM KNOWLEDGE BASE\n\n';

  // ── Developer Profile ──────────────────────────────────────────────────────
  if (profile) {
    ctx += '## Developer Profile\n';
    ctx += `**Name:** ${profile.name}\n`;
    ctx += `**Title:** ${profile.title}\n`;
    ctx += `**Short Bio:** ${profile.bioShort}\n`;
    ctx += `**Full Bio:** ${profile.bio}\n`;
    ctx += `**Location:** ${profile.location ?? 'Not specified'}\n`;
    ctx += `**Years of Experience:** ${profile.yearsExp}+\n`;
    ctx += `**Projects Shipped:** ${profile.projectCount}+\n`;
    ctx += `**Happy Clients:** ${profile.clientCount}+\n`;
    ctx += `**Available for Work:** ${profile.available ? 'Yes — currently accepting new projects' : 'Not currently available'}\n`;
    ctx += `**Skills:** ${(profile.skills as string[]).join(', ')}\n`;
    ctx += `**Tech Stack:** ${(profile.techStack as string[]).join(', ')}\n`;

    // External links — include actual URLs so the AI can share them
    const links: string[] = [];
    if (profile.githubUrl)   links.push(`GitHub: ${profile.githubUrl}`);
    if (profile.linkedinUrl) links.push(`LinkedIn: ${profile.linkedinUrl}`);
    if (profile.twitterUrl)  links.push(`Twitter/X: ${profile.twitterUrl}`);
    if (profile.websiteUrl)  links.push(`Website: ${profile.websiteUrl}`);
    if (links.length > 0) ctx += `**External Links:**\n${links.map(l => `  - ${l}`).join('\n')}\n`;
    ctx += '\n';
  }

  // ── Portfolio Projects ─────────────────────────────────────────────────────
  if (projects.length > 0) {
    ctx += '## Portfolio Projects\n';
    ctx += `Total projects: ${projects.length}\n\n`;
    for (const p of projects) {
      ctx += `### ${p.title}${p.featured ? ' ⭐ (Featured)' : ''}\n`;
      ctx += `**Description:** ${p.description}\n`;
      if (p.longDesc) ctx += `**Details:** ${p.longDesc}\n`;
      ctx += `**Technologies:** ${(p.techStack as string[]).join(', ')}\n`;
      if (p.githubUrl) ctx += `**GitHub:** ${p.githubUrl}\n`;
      if (p.liveUrl)   ctx += `**Live Demo:** ${p.liveUrl}\n`;
      ctx += '\n';
    }
  }

  // ── Services ───────────────────────────────────────────────────────────────
  if (services.length > 0) {
    ctx += '## Services Offered\n';
    for (const s of services) {
      ctx += `### ${s.title} (${s.tier} tier)\n`;
      ctx += `**Description:** ${s.description}\n`;
      ctx += `**Price:** ${s.price}${s.priceNote ? ` ${s.priceNote}` : ''}\n`;
      ctx += `**Features:** ${(s.features as string[]).join(' | ')}\n`;
      if (s.ctaLabel) ctx += `**CTA:** ${s.ctaLabel}\n`;
      ctx += '\n';
    }
  }

  // ── Pricing Plans ──────────────────────────────────────────────────────────
  if (plans.length > 0) {
    ctx += '## Direct Purchase Pricing Plans\n';
    ctx += 'These plans can be purchased instantly via Stripe checkout:\n\n';
    for (const p of plans) {
      ctx += `### ${p.name}${p.popular ? ' 🔥 (Most Popular)' : ''}\n`;
      ctx += `**Price:** ${fmt(p.price)}\n`;
      ctx += `**Description:** ${p.description}\n`;
      ctx += `**What\'s included:** ${p.features.join(', ')}\n`;
      ctx += '\n';
    }
  }

  // ── Testimonials ───────────────────────────────────────────────────────────
  if (testimonials.length > 0) {
    ctx += '## Client Testimonials\n';
    for (const t of testimonials) {
      ctx += `- "${t.content}" — **${t.name}**, ${t.role} at ${t.company}\n`;
    }
    ctx += '\n';
  }

  // ── Blog ───────────────────────────────────────────────────────────────────
  if (recentPosts.length > 0) {
    ctx += '## Recent Blog Posts\n';
    for (const post of recentPosts) {
      ctx += `- **${post.title}** — ${post.excerpt ?? post.content?.slice(0, 120) ?? ''}\n`;
    }
    ctx += '\n';
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  ctx += '## Site Navigation\n';
  ctx += '- Home/Profile: / (developer intro, skills, featured projects)\n';
  ctx += '- Services & Pricing: /services (service packages, pricing plans, inquiry form)\n';
  ctx += '- Blog: /blog (technical articles and insights)\n';
  ctx += '- Testimonials: /testimonials (client reviews)\n';
  ctx += '- Resume: /resume (full work history and CV download)\n';
  ctx += '- Customer Portal: customer portal (manage purchases, payments, contact admin)\n\n';

  ctx += '## How to Hire / Purchase\n';
  ctx += '1. Browse services at /services\n';
  ctx += '2. Click "Pay Now" on any plan for instant checkout via Stripe\n';
  ctx += '3. Or click "Get a Quote" to fill in the inquiry form first\n';
  ctx += '4. After purchase, manage everything in the Customer Portal\n\n';

  ctx += '## Contact\n';
  ctx += '- Inquiry form on /services page\n';
  ctx += '- "Contact Admin" section in the Customer Portal\n\n';

  // ── Customer Account Context ───────────────────────────────────────────────
  if (customerId) {
    try {
      const [customer, payments, allServices] = await Promise.all([
        prisma.customer.findUnique({ where: { id: customerId } }),
        prisma.payment.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.service.findMany({ orderBy: { order: 'asc' } }),
      ]);

      if (customer) {
        ctx += '## Authenticated Customer Account\n';
        ctx += `**Name:** ${customer.name}\n`;
        ctx += `**Email:** ${customer.email}\n`;
        ctx += `**Account Status:** ${customer.isActive ? 'Active' : 'Inactive'}\n`;
        ctx += `**Member Since:** ${new Date(customer.createdAt).toLocaleDateString()}\n\n`;
      }

      const completed = payments.filter(p => p.status === 'COMPLETED');
      const pending   = payments.filter(p => p.status === 'PENDING');

      if (completed.length > 0) {
        ctx += "## Customer's Purchased Services\n";
        const totalSpent = completed.reduce((s, p) => s + p.amount, 0);
        ctx += `**Total spent:** ${fmt(totalSpent)} across ${completed.length} payment(s)\n\n`;
        for (const p of completed) {
          ctx += `- **${p.serviceName ?? p.description ?? 'Service'}** — ${fmt(p.amount)}`;
          ctx += ` (${new Date(p.createdAt).toLocaleDateString()})\n`;
          // Match with service details if possible
          const match = allServices.find(s => s.id === p.serviceId || s.title === p.serviceName);
          if (match) {
            ctx += `  Features: ${(match.features as string[]).slice(0, 3).join(', ')}\n`;
          }
        }
        ctx += '\n';
      } else {
        ctx += "## Customer Purchases\nNo completed purchases yet.\n\n";
      }

      if (pending.length > 0) {
        ctx += `## Pending Payments\n${pending.length} payment(s) pending.\n\n`;
      }
    } catch { /* silently skip */ }
  }

  return ctx;
}

// ─── Generate contextual follow-up suggestions ───────────────────────────────

function generateSuggestions(message: string, reply: string, context: string): string[] {
  const lower = (message + ' ' + reply).toLowerCase();
  const suggestions: string[] = [];

  if (/project|portfolio|work|built|created/.test(lower) && suggestions.length < 3) {
    suggestions.push('Show me your best projects');
    suggestions.push('What technologies do you use?');
  }
  if (/service|hire|work with|help|build/.test(lower) && suggestions.length < 3) {
    suggestions.push('What are your prices?');
    suggestions.push('How do I get started?');
  }
  if (/tech|stack|language|framework|backend|frontend/.test(lower) && suggestions.length < 3) {
    suggestions.push('Tell me about your backend experience');
    suggestions.push('Show me projects using this tech');
  }
  if (/price|cost|plan|pay/.test(lower) && suggestions.length < 3) {
    suggestions.push('What does the Starter plan include?');
    suggestions.push('How do I purchase a plan?');
  }
  if (/github|linkedin|contact|profile|social/.test(lower) && suggestions.length < 3) {
    suggestions.push('What projects are on GitHub?');
    suggestions.push('How can I hire you?');
  }

  // Always offer a useful next step
  if (suggestions.length === 0) {
    suggestions.push('What services do you offer?');
    suggestions.push('Show me featured projects');
    suggestions.push('What technologies do you work with?');
  }

  return suggestions.slice(0, 3);
}

// ─── OpenAI call ──────────────────────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const apiKey = config.openai?.apiKey;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // keep more history for exploratory conversations
    { role: 'user', content: userMessage },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai?.model ?? 'gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `OpenAI error ${res.status}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content?.trim() ?? 'I could not generate a response.';
}

// ─── Rich rule-based fallback ─────────────────────────────────────────────────

function fallbackResponse(message: string, ctx: string): string {
  const lower = message.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|sup|yo|howdy|greetings|good\s*(morning|afternoon|evening))/.test(lower)) {
    const name = ctx.match(/\*\*Name:\*\* (.+)/)?.[1] ?? 'the developer';
    const title = ctx.match(/\*\*Title:\*\* (.+)/)?.[1] ?? 'Full-Stack Developer';
    return `Hi! 👋 I'm the portfolio assistant for **${name}**, a **${title}**.\n\nI can help you explore:\n- 💼 **Services & Pricing** — what's available and how to hire\n- 🗂 **Portfolio Projects** — what's been built and what tech was used\n- 🛠 **Skills & Technologies** — languages, frameworks, tools\n- 🔗 **External Profiles** — GitHub, LinkedIn, and more\n\nWhat would you like to know?`;
  }

  // Projects
  if (/project|portfolio|work|built|created|showcase|show me/.test(lower)) {
    const projectSection = ctx.match(/## Portfolio Projects[\s\S]*?(?=## (?!###)|$)/)?.[0] ?? '';
    const projectBlocks = [...projectSection.matchAll(/### (.+)\n\*\*Description:\*\* (.+)\n\*\*Technologies:\*\* (.+)/g)];
    if (projectBlocks.length > 0) {
      let resp = `Here are the portfolio projects:\n\n`;
      projectBlocks.slice(0, 5).forEach(m => {
        resp += `**${m[1]}**\n${m[2]}\n*Tech: ${m[3]}*\n\n`;
      });
      if (projectBlocks.length > 5) resp += `...and ${projectBlocks.length - 5} more.\n`;
      return resp.trim();
    }
  }

  // Specific tech / backend / frontend
  if (/backend|server|api|node|express|database|sql|postgres/.test(lower)) {
    const tech = ctx.match(/\*\*Tech Stack:\*\* (.+)/)?.[1] ?? '';
    const skills = ctx.match(/\*\*Skills:\*\* (.+)/)?.[1] ?? '';
    const backendTech = [tech, skills].join(', ').split(', ')
      .filter(t => /node|express|postgres|prisma|sql|redis|api|backend|server|python|php|ruby/i.test(t));
    return `**Backend experience includes:**\n${backendTech.length > 0 ? backendTech.map(t => `- ${t}`).join('\n') : tech}\n\nBuilds REST APIs, manages databases (PostgreSQL, etc.), handles authentication, payments (Stripe), and server infrastructure.`;
  }

  if (/frontend|react|vue|angular|css|ui|design|web/.test(lower)) {
    const tech = ctx.match(/\*\*Tech Stack:\*\* (.+)/)?.[1] ?? '';
    const frontendTech = tech.split(', ')
      .filter(t => /react|vue|angular|next|svelte|typescript|javascript|tailwind|css|html/i.test(t));
    return `**Frontend experience includes:**\n${frontendTech.length > 0 ? frontendTech.map(t => `- ${t}`).join('\n') : tech}\n\nBuilds responsive, animated interfaces with modern frameworks and design systems.`;
  }

  // Skills / technologies
  if (/skill|tech|stack|experience|language|framework|tool/.test(lower)) {
    const skills = ctx.match(/\*\*Skills:\*\* (.+)/)?.[1] ?? '';
    const tech = ctx.match(/\*\*Tech Stack:\*\* (.+)/)?.[1] ?? '';
    const yrs = ctx.match(/\*\*Years of Experience:\*\* (.+)/)?.[1] ?? '';
    return `**Skills & Technologies**\n\n**Experience:** ${yrs}\n\n**Skills:** ${skills}\n\n**Tech Stack:** ${tech}`;
  }

  // GitHub
  if (/github|repo|repository|code|open.?source/.test(lower)) {
    const ghUrl = ctx.match(/GitHub: (https?:\/\/\S+)/)?.[1];
    if (ghUrl) return `You can find the portfolio projects and open-source work on GitHub:\n\n🔗 **${ghUrl}**\n\nFeel free to explore the repositories and see the code directly.`;
    return "The GitHub profile link will appear here once it's added to the profile settings.";
  }

  // LinkedIn
  if (/linkedin|professional|resume|cv|connect/.test(lower)) {
    const liUrl = ctx.match(/LinkedIn: (https?:\/\/\S+)/)?.[1];
    const ghUrl = ctx.match(/GitHub: (https?:\/\/\S+)/)?.[1];
    let resp = `**Professional Profiles:**\n\n`;
    if (liUrl) resp += `🔗 LinkedIn: ${liUrl}\n`;
    if (ghUrl) resp += `🔗 GitHub: ${ghUrl}\n`;
    if (!liUrl && !ghUrl) resp += 'Profile links will appear here once added to settings.\n';
    resp += '\nYou can also download the full CV from the **Resume** page.';
    return resp;
  }

  // Pricing / plans
  if (/price|cost|plan|pay|how much|budget|invest|spend/.test(lower)) {
    const planSection = ctx.match(/## Direct Purchase Pricing Plans[\s\S]*?(?=## (?!###)|$)/)?.[0] ?? '';
    const planBlocks = [...planSection.matchAll(/### (.+)\n\*\*Price:\*\* (.+)\n\*\*Description:\*\* (.+)/g)];
    if (planBlocks.length > 0) {
      let resp = `**Available Pricing Plans:**\n\n`;
      planBlocks.forEach(m => { resp += `💳 **${m[1]}** — ${m[2]}\n${m[3]}\n\n`; });
      resp += 'Plans can be purchased directly via Stripe checkout. Visit the **Services** page to get started.';
      return resp;
    }
  }

  // Services
  if (/service|offer|provide|available|package|what can you/.test(lower)) {
    const serviceSection = ctx.match(/## Services Offered[\s\S]*?(?=## (?!###)|$)/)?.[0] ?? '';
    const serviceBlocks = [...serviceSection.matchAll(/### (.+)\n\*\*Description:\*\* (.+)\n\*\*Price:\*\* (.+)/g)];
    if (serviceBlocks.length > 0) {
      let resp = `**Services Available:**\n\n`;
      serviceBlocks.forEach(m => { resp += `🔹 **${m[1]}** — ${m[3]}\n${m[2]}\n\n`; });
      resp += 'Visit the **Services** page to explore packages and start an inquiry.';
      return resp;
    }
  }

  // Hire / contact
  if (/hire|contact|work together|get in touch|reach|inquiry|quote|start/.test(lower)) {
    return `**How to Get Started:**\n\n1. 📋 Visit the **Services** page to browse packages\n2. 💳 Click **"Pay Now"** for instant Stripe checkout, or\n3. 💬 Click **"Get a Quote"** to send an inquiry first\n4. 📬 Expect a reply within 24 hours\n\nFor direct questions, use the **Contact Admin** section in the Customer Portal.`;
  }

  // About / background
  if (/about|who are you|background|tell me|introduce|overview/.test(lower)) {
    const name = ctx.match(/\*\*Name:\*\* (.+)/)?.[1] ?? 'the developer';
    const title = ctx.match(/\*\*Title:\*\* (.+)/)?.[1] ?? '';
    const bio = ctx.match(/\*\*Full Bio:\*\* (.+)/)?.[1] ?? ctx.match(/\*\*Short Bio:\*\* (.+)/)?.[1] ?? '';
    const yrs = ctx.match(/\*\*Years of Experience:\*\* (.+)/)?.[1] ?? '';
    return `**About ${name}**\n\n${bio}\n\n📌 ${title} with ${yrs} of professional experience. Passionate about building scalable, well-crafted software.`;
  }

  // Availability
  if (/available|availability|open|taking|accepting|freelance/.test(lower)) {
    const avail = ctx.match(/\*\*Available for Work:\*\* (.+)/)?.[1] ?? 'Status unknown';
    return `**Availability Status:** ${avail}\n\nVisit the **Services** page to start an inquiry or purchase a plan directly.`;
  }

  // Default
  const name = ctx.match(/\*\*Name:\*\* (.+)/)?.[1] ?? 'the developer';
  return `I can help you explore ${name}'s portfolio. Try asking about:\n\n- 🗂 **Projects** — "show me your best work"\n- 🛠 **Technologies** — "what tech stack do you use"\n- 💼 **Services** — "what services are available"\n- 💰 **Pricing** — "how much does it cost"\n- 🔗 **Profiles** — "what's your GitHub?"\n- 👤 **Background** — "tell me about your experience"`;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export const chat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    const customerId = req.user?.role === 'CUSTOMER' ? req.user.id : undefined;
    const platformContext = await buildPlatformContext(customerId);

    const systemPrompt = [
      "You are an intelligent, conversational portfolio assistant for a software developer.",
      "You help visitors explore the developer's background, skills, projects, services, and pricing.",
      "",
      "PERSONALITY: Friendly, knowledgeable, and exploratory. Think of yourself as a smart guide through the portfolio.",
      "SCOPE: Only answer questions about this platform's content — the developer profile, projects, services, pricing, technologies, and (if authenticated) the customer's account.",
      "LINKS: When mentioning GitHub, LinkedIn, or specific projects, include the actual URL from the context if available.",
      "FORMAT: Use markdown — bold for emphasis, bullet points for lists, headers for sections. Keep responses scannable.",
      "LENGTH: Be detailed enough to be useful but not overwhelming. For project deep-dives, provide full detail.",
      "FOLLOW-UPS: When answering, naturally suggest 1-2 related things the user might want to explore next.",
      "ACCURACY: Never invent information. If something isn't in the context, say so and offer what you do know.",
      "OFF-TOPIC: If asked about unrelated topics, politely redirect with something like: 'I'm focused on this portfolio, but I can tell you about [relevant thing].'",
      "",
      "CONTEXT:",
      platformContext,
    ].join('\n');

    let reply: string;
    try {
      reply = await callOpenAI(systemPrompt, message, history);
    } catch (aiError: unknown) {
      const msg = aiError instanceof Error ? aiError.message : '';
      if (!msg.includes('not configured')) {
        logger.error('[chat] AI error:', msg);
      }
      reply = fallbackResponse(message, platformContext);
    }

    // Generate contextual follow-up suggestions
    const suggestions = generateSuggestions(message, reply, platformContext);

    res.json({ success: true, data: { reply, suggestions } });
  } catch (err) {
    next(err);
  }
};
