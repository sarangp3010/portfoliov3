# Chatbot Setup & Configuration Guide

## Overview

The platform currently includes an assistant experience in:

- the public app
- the customer portal

It is not currently mounted in the admin app.

This assistant is one of the most important AI-related implementation details in the current repository because it proves the system already has:

- OpenAI integration
- context-building from platform data
- customer-aware responses when authenticated
- rule-based fallback behavior

## Current Runtime Behavior

### Public Mode

The assistant helps visitors explore:

- profile/background
- projects
- services
- pricing
- resume
- GitHub/LinkedIn or other profile links

### Customer Mode

When a customer is authenticated and the JWT is included:

- account context is added
- recent payments can be referenced
- purchased services can be described
- assistant suggestions can be more support-oriented

This means the repo already contains the first version of a customer-support assistant, even if it is not yet specialized enough to replace real support workflows.

## Request Flow

```text
Chatbot UI
  -> POST /api/chat
  -> optional Authorization header
  -> chat.controller.ts
      -> build platform context
      -> append customer context when authenticated
      -> call OpenAI if configured
      -> fallback if unavailable
      -> return reply + suggestions
```

## Context Sources

The current assistant builds context from live database content, including:

- profile
- projects
- services
- Stripe-friendly service plans
- testimonials
- recent blog posts
- public navigation and contact guidance

When authenticated as a customer, it also appends:

- customer identity
- account status
- recent payments
- total spend summary
- pending payment count where applicable

This is already more capable than a generic website chatbot because it is platform-context-aware rather than purely prompt-driven.

## OpenAI Integration

Current config:

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

Current implementation details:

- uses the Chat Completions API
- sends a system prompt plus recent history
- includes a fairly rich markdown-oriented response instruction
- returns follow-up suggestions after each message

If OpenAI is not configured or a request fails, the assistant falls back to deterministic keyword-based responses.

## Fallback Behavior

The fallback is stronger than a trivial “AI unavailable” message.

It currently supports:

- greeting handling
- project summaries
- tech stack answers
- pricing and services guidance
- GitHub and LinkedIn link sharing
- background/about answers
- hiring/contact flow explanations
- availability guidance

That means the assistant still remains useful in development or misconfigured environments.

## UI Behavior

The current assistant widgets include:

- welcome message by context
- conversation history
- follow-up suggestion chips
- link rendering
- clear/reset conversation support
- collapsible chat panel UI

The public and customer widgets are similar but not identical in usage context.

## Limitations

The assistant should currently be described as:

- a contextual portfolio assistant
- a light customer-aware support assistant

It should not yet be described as:

- an admin copilot
- a full AI support agent
- a workflow assistant for inquiries, content generation, or proposals

Those are roadmap items, not present implementation.

## Current Opportunities

The most natural next evolution paths for this assistant are:

- stricter separation between public and support prompts
- more customer-specific guided answers
- assistant shortcuts for portal actions
- migration of AI logic into dedicated `services/ai/*` modules

That would keep the current feature while making the AI layer easier to extend for inquiry triage, content assistance, and analytics summaries.
