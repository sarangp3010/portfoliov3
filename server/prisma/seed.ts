import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashed = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@portfolio.dev' },
    update: {},
    create: { email: 'admin@portfolio.dev', password: hashed, name: 'Your Name', role: 'ADMIN' },
  });

  const existingProfile = await prisma.profile.findFirst();
  if (!existingProfile) {
    await prisma.profile.create({
      data: {
        name: 'Your Name',
        title: 'Full-Stack Software Engineer',
        bioShort: 'Building scalable web applications with clean code and modern technologies.',
        bio: "I'm a full-stack software engineer with 3+ years of experience designing and building production-grade web applications. I specialize in React, Node.js, and PostgreSQL.\n\nMy focus is on writing clean, maintainable code and shipping products that users love. When I'm not coding, I'm contributing to open source, reading about distributed systems, or exploring the latest in web technology.",
        email: 'hello@yourname.dev',
        phone: '+1 (555) 000-0000',
        location: 'San Francisco, CA',
        githubUrl: 'https://github.com/yourname',
        linkedinUrl: 'https://linkedin.com/in/yourname',
        twitterUrl: 'https://twitter.com/yourname',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Next.js', 'Redis', 'Prisma', 'GraphQL'],
        techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Docker', 'AWS'],
        yearsExp: 3, projectCount: 20, clientCount: 10, available: true,
      },
    });
  }

  await prisma.project.createMany({ skipDuplicates: true, data: [
    { title: 'E-Commerce Platform', description: 'Full-stack e-commerce with cart, payments, and admin panel.', longDesc: 'Built with React, Node.js, Stripe integration, and PostgreSQL.', techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'], githubUrl: 'https://github.com/yourname/ecommerce', liveUrl: 'https://demo.vercel.app', featured: true, order: 1 },
    { title: 'Real-time Chat App', description: 'WebSocket-powered chat with rooms and file sharing.', techStack: ['React', 'Socket.io', 'Node.js', 'MongoDB'], githubUrl: 'https://github.com/yourname/chat', featured: true, order: 2 },
    { title: 'AI Content Generator', description: 'OpenAI-powered content creation tool with saved history.', techStack: ['Next.js', 'OpenAI', 'TypeScript', 'Tailwind'], githubUrl: 'https://github.com/yourname/ai-gen', featured: true, order: 3 },
  ]});

  await prisma.blogPost.createMany({ skipDuplicates: true, data: [
    {
      title: 'Building Scalable APIs with Node.js and PostgreSQL',
      slug: 'scalable-apis-nodejs-postgresql',
      excerpt: 'Learn how to design production-ready REST APIs that handle thousands of requests per second using Node.js, Express, and PostgreSQL with Prisma ORM.',
      content: `## Introduction\n\nWhen building APIs that need to scale, your architecture decisions in the early stages determine how painful growth will be later. In this post I'll walk through the patterns I've used to build APIs serving 100k+ requests/day.\n\n## Connection Pooling\n\nThe first mistake most Node.js developers make is creating a new database connection per request. Use a connection pool:\n\n\`\`\`typescript\nconst globalForPrisma = globalThis as { prisma?: PrismaClient };\nexport const prisma = globalForPrisma.prisma ?? new PrismaClient();\nif (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;\n\`\`\`\n\n## Indexing Strategy\n\nEvery query you run in production should hit an index. Use \`EXPLAIN ANALYZE\` in PostgreSQL to verify your queries are using indexes.\n\n## Cursor-Based Pagination\n\nOffset pagination degrades at scale. Use cursor-based pagination for feeds:\n\n\`\`\`typescript\nconst posts = await prisma.blogPost.findMany({\n  take: 10,\n  skip: cursor ? 1 : 0,\n  cursor: cursor ? { id: cursor } : undefined,\n  orderBy: { createdAt: 'desc' },\n});\n\`\`\`\n\n## Key Takeaways\n\n- Always pool database connections\n- Index every column you filter or sort by\n- Use cursor pagination for large datasets\n- Cache aggressively with Redis for read-heavy endpoints`,
      tags: ['Node.js', 'PostgreSQL', 'API Design', 'Performance'],
      published: true, readingTime: 6, views: 142, publishedAt: new Date('2024-11-15'),
    },
    {
      title: 'React Performance: From 3s to 300ms',
      slug: 'react-performance-optimization',
      excerpt: "A deep dive into cutting a React dashboard's initial load time by 90% — code splitting, memoization, virtualization, and bundle analysis.",
      content: `## The Problem\n\nOur analytics dashboard was taking 3+ seconds to become interactive. Here's exactly what I did to fix it.\n\n## 1. Code Splitting\n\n\`\`\`typescript\nconst Dashboard = React.lazy(() => import('./Dashboard'));\n<Suspense fallback={<Loader />}><Dashboard /></Suspense>\n\`\`\`\n\nThis cut our initial bundle from 890kb to 210kb.\n\n## 2. Memoize Expensive Computations\n\n\`\`\`typescript\nconst processedData = useMemo(() =>\n  rawData.map(transform).filter(isValid).sort(byDate),\n  [rawData]\n);\n\`\`\`\n\n## Results\n\n| Metric | Before | After |\n|--------|--------|-------|\n| Bundle | 890kb | 210kb |\n| TTI | 3.2s | 0.31s |\n| LCP | 2.8s | 0.8s |\n\nPerformance is a feature. Measure everything with Lighthouse CI in your pipeline.`,
      tags: ['React', 'Performance', 'TypeScript', 'Frontend'],
      published: true, readingTime: 8, views: 287, publishedAt: new Date('2024-12-01'),
    },
    {
      title: 'Docker for Node.js: A Production Guide',
      slug: 'docker-nodejs-production-guide',
      excerpt: 'Everything you need to containerize Node.js apps for production — multi-stage builds, health checks, and secrets management.',
      content: `## Multi-Stage Builds\n\n\`\`\`dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json .\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS production\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package*.json .\nRUN npm ci --omit=dev\nCOPY --from=builder /app/dist ./dist\nEXPOSE 3000\nCMD ["node", "dist/server.js"]\n\`\`\`\n\nResult: image size from ~800MB to ~180MB.\n\n## Health Checks\n\n\`\`\`dockerfile\nHEALTHCHECK --interval=30s --timeout=10s --retries=3 \\\\\n  CMD wget -qO- http://localhost:3000/health || exit 1\n\`\`\`\n\n## Key Principles\n\n1. Multi-stage builds for small images\n2. Run as non-root user\n3. Add health checks for every service\n4. Pin base image versions`,
      tags: ['Docker', 'Node.js', 'DevOps', 'AWS'],
      published: true, readingTime: 7, views: 195, publishedAt: new Date('2024-12-20'),
    },
  ]});

  await prisma.service.createMany({ skipDuplicates: true, data: [
    { title: 'Starter', tier: 'starter', description: 'Perfect for landing pages, portfolios, and small web apps.', price: '$1,500', priceNote: 'one-time', features: ['Up to 5 pages', 'Responsive design', 'Contact form', 'Basic SEO', 'Deploy to Vercel', '2 revisions', '2 weeks delivery'], popular: false, order: 1 },
    { title: 'Professional', tier: 'professional', description: 'Full-stack apps with database, auth, and admin panel.', price: '$4,500', priceNote: 'one-time', features: ['Full-stack React + Node.js', 'PostgreSQL + Prisma ORM', 'JWT Authentication', 'Admin dashboard', 'REST API docs', 'Docker + cloud deploy', 'Analytics setup', '3 revisions', '4-6 weeks'], popular: true, ctaLabel: 'Most Popular', order: 2 },
    { title: 'Enterprise', tier: 'enterprise', description: 'Complex systems, team augmentation, ongoing partnership.', price: 'Custom', priceNote: 'monthly retainer', features: ['Everything in Professional', 'Microservices architecture', 'CI/CD pipeline setup', 'Performance audits', 'Code reviews', 'Tech consulting', 'Weekly meetings', 'Dedicated Slack channel'], popular: false, ctaLabel: "Let's Talk", order: 3 },
  ]});

  await prisma.testimonial.createMany({ skipDuplicates: true, data: [
    { name: 'Sarah Chen', role: 'Engineering Manager', company: 'Tech Corp', content: "One of the most reliable engineers I've worked with. Delivers clean, well-tested code consistently on time. Has a rare ability to communicate complex technical decisions to non-technical stakeholders.", linkedinUrl: 'https://linkedin.com/in/sarahchen', rating: 5, featured: true, order: 1 },
    { name: 'Marcus Webb', role: 'CTO', company: 'Startup Inc', content: 'Built our entire MVP from scratch in 3 months. The quality of the codebase meant we could scale to 50k users without a rewrite. Worth every penny.', rating: 5, featured: true, order: 2 },
    { name: 'Priya Nair', role: 'Product Designer', company: 'Design Studio', content: 'A developer who actually cares about UI/UX — extremely rare. Implements designs pixel-perfectly and proactively suggests improvements that make the product better.', rating: 5, featured: true, order: 3 },
    { name: 'James Okafor', role: 'Freelance Client', company: 'Okafor Consulting', content: 'Hired for a 2-week project that turned into a 6-month engagement. Proactive communication, no surprises, and code handed off with thorough documentation.', rating: 5, featured: false, order: 4 },
  ]});

  const resumeExists = await prisma.resume.findFirst({ where: { isActive: true } });
  if (!resumeExists) {
    await prisma.resume.create({ data: { fileName: 'YourName-Resume-2025.pdf', fileUrl: '/uploads/resume.pdf', version: '2025.1', isActive: true } });
  }

  // ─── Email Templates ────────────────────────────────────────────────────────
  const { FALLBACK_TEMPLATES } = await import('../src/services/email-template.service.js');
  const templateEntries = Object.entries(FALLBACK_TEMPLATES);
  for (const [key, tpl] of templateEntries) {
    const name = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const allContent = `${tpl.subject} ${tpl.html}`;
    const variables = (allContent.match(/\{\{(\w+)\}\}/g) ?? [])
      .map((v: string) => v.slice(2, -2))
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      .filter((v: string) => !v.startsWith('#') && !v.startsWith('/')); // skip block helpers
    await prisma.emailTemplate.upsert({
      where:  { key },
      update: {}, // never overwrite admin edits on re-seed
      create: { key, name, subject: tpl.subject, html: tpl.html, variables, isSystem: true },
    });
  }
  console.log(`✅ Seeded ${templateEntries.length} email templates`);

  console.log('✅ Seed complete — login: admin@portfolio.dev / Admin@123456');
}
main().catch(console.error).finally(() => prisma.$disconnect());
