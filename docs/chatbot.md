# Chatbot Setup & Configuration Guide

## Overview

The platform includes an AI-powered portfolio assistant available in:

| App | Context | Purpose |
|-----|---------|---------|
| **Public site** | `public` | Help visitors explore projects, services, pricing, GitHub, and the developer's background |
| **Customer portal** | `customer` | Account-aware assistance: purchased services, payments, plan details |

The chatbot is **not** available in the admin panel.

---

## How It Works

```
Browser (Chatbot widget)
        │
        │  POST /api/chat  { message, history }
        │  Authorization: Bearer <token>  (optional — customer portal only)
        ▼
Backend (/api/chat endpoint)
        │
        ├── Builds rich context from the database:
        │   - Profile (bio, skills, tech stack, external links)
        │   - All projects (title, description, longDesc, tech, links)
        │   - Services & pricing plans
        │   - Testimonials, blog posts
        │   - Navigation links
        │
        ├── If customer JWT present → appends personal context:
        │   - Customer name, email, account status
        │   - Completed payments with service details
        │   - Pending payments
        │
        ├── Sends to OpenAI (if OPENAI_API_KEY is set)
        │   OR falls back to keyword-based rule matching
        │
        └── Returns { reply, suggestions[] } to the browser
```

The AI is instructed to:
- Explore freely within the platform context
- Include actual links (GitHub, LinkedIn, project URLs) when relevant
- Suggest follow-up topics after each answer
- Use friendly, conversational, detailed responses
- Never invent data not present in the context

---

## Quick Setup

### With OpenAI (Recommended)

1. Get an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

2. Add to your `.env`:
   ```env
   OPENAI_API_KEY=sk-proj-...
   OPENAI_MODEL=gpt-4o-mini
   ```

3. Restart the server. The chatbot will automatically use OpenAI.

### Without an API Key (Built-in Fallback)

No configuration needed. The chatbot uses a rich keyword-based fallback that handles:
- Project exploration
- Tech stack questions
- Pricing and service queries
- GitHub/LinkedIn links
- Background and experience questions
- Contact and hiring guidance

---

## Knowledge Sources

The chatbot context is built fresh from the database on every request. Here's what it includes and where to update it:

| Knowledge Area | Source in Admin | What to Update |
|---------------|-----------------|----------------|
| Developer profile, bio, skills, tech stack | Admin → Profile | Edit profile details |
| External links (GitHub, LinkedIn) | Admin → Profile | Add URLs to profile fields |
| Portfolio projects | Admin → Projects | Add `longDesc` for richer project explanations |
| Services & pricing | Admin → Services | Edit service descriptions and features |
| Testimonials | Admin → Testimonials | Feature testimonials to include them |
| Blog posts | Admin → Blog | Published posts appear in context |

### Adding Richer Project Information

The chatbot uses the `longDesc` field on projects for detailed explanations. To give the AI more to work with:

1. Go to **Admin → Projects → Edit** any project
2. Fill in the **Long Description** field with:
   - What the project does
   - Architecture overview
   - Key features implemented
   - Challenges solved
   - Technologies used in depth

The chatbot will use this for responses like "tell me about that project in detail".

### Improving Profile Context

In **Admin → Profile**, keep these fields filled in:
- **Bio** — full background paragraph(s)
- **Skills** — comma-separated list
- **Tech Stack** — all technologies used
- **GitHub URL** — linked in responses
- **LinkedIn URL** — linked in responses
- **Available** — chatbot will mention current availability

---

## Chatbot Capabilities

### Public Site
Users can ask:
- `"show me your projects"` → lists all projects with tech
- `"tell me about [project name]"` → detailed breakdown
- `"what technologies do you use?"` → full tech stack
- `"tell me about your backend experience"` → filtered explanation
- `"what's your GitHub?"` → links to GitHub profile
- `"how much does it cost?"` → pricing plans with prices
- `"how do I hire you?"` → step-by-step instructions
- `"are you available?"` → availability status

### Customer Portal (Authenticated)
Additional capabilities:
- `"what have I purchased?"` → lists completed payments
- `"tell me about my plan"` → details of purchased service
- `"how much have I spent?"` → total spend
- `"how do I contact support?"` → guidance

---

## UI Features

### Topic Pills
Before the first message, clickable pills let users jump straight to key topics:
- 🗂 Projects
- 💼 Services
- 💰 Pricing
- 🛠 Tech Stack
- 🔗 GitHub
- 👤 About

### Follow-up Suggestions
After each AI response, 2–3 contextual suggestions appear as clickable chips below the message.

### Expandable Messages
Long responses (>400 characters) show a "↓ Show more" button to expand inline without cluttering the chat.

### Clickable Links
When the AI mentions GitHub, LinkedIn, or project URLs, they render as tappable links.

### Clear Conversation
The header shows a ↺ reset button once the conversation has started.

---

## Configuration Reference

| Env Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | _(none)_ | OpenAI API key — required for AI responses |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model to use. `gpt-4o-mini` is recommended |

**Model recommendations:**
- `gpt-4o-mini` — fast, cheap, great for Q&A
- `gpt-4o` — better reasoning, higher cost
- `gpt-3.5-turbo` — cheapest option

---

## Rate Limiting

The `/api/chat` endpoint is rate-limited to **20 requests per minute** per IP. Edit `server/src/app.ts` to change:

```ts
app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, max: 20 }));
```

---

## Extending the Chatbot

### Adding More Context Categories

Edit `buildPlatformContext()` in `server/src/controllers/chat.controller.ts` to add new data sections. Each section is a string appended to the context:

```ts
// Example: add team members
const team = await prisma.teamMember.findMany();
if (team.length > 0) {
  ctx += '## Team Members\n';
  for (const m of team) ctx += `- **${m.name}** — ${m.role}\n`;
  ctx += '\n';
}
```

### Adding New Topic Pills

Edit `TOPIC_PILLS` in `apps/public/src/components/ui/Chatbot.tsx`:

```ts
const TOPIC_PILLS = {
  public: [
    { label: '🗂 Projects', prompt: 'Show me your portfolio projects' },
    { label: '✍️ Blog',     prompt: 'What have you written about recently?' }, // ← add
    // ...
  ],
};
```

### Adjusting AI Behavior

The system prompt is in the `chat` controller. Edit the `systemPrompt` array to change tone, scope, or formatting instructions.

### Adjusting Conversation History

The backend keeps the last 10 messages for context. Change `history.slice(-10)` in `callOpenAI()` to adjust.

---

## File Reference

| File | Purpose |
|------|---------|
| `server/src/controllers/chat.controller.ts` | Context builder, OpenAI call, fallback logic, suggestions |
| `server/src/middleware/auth.ts` | `optionalAuth` — optional JWT decoding for customer context |
| `server/src/routes/index.ts` | Route: `POST /api/chat` |
| `server/src/config/index.ts` | `openai.apiKey`, `openai.model` config |
| `apps/public/src/components/ui/Chatbot.tsx` | Widget (public) — markdown renderer, topic pills, suggestions |
| `apps/customer/src/components/ui/Chatbot.tsx` | Widget (customer) — identical, different default pills |
| `apps/public/src/components/layout/PublicLayout.tsx` | Mounts chatbot in public app |
| `apps/customer/src/components/layout/CustomerLayout.tsx` | Mounts chatbot with auth token in customer app |
