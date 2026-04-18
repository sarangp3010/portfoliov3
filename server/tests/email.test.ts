/**
 * tests/email.test.ts
 * Tests: renderTemplate, renderSubject, getTemplate, renderEmail,
 *         FALLBACK_TEMPLATES, sendTemplatedEmail
 */

// ── Mocks (must be before imports) ───────────────────────────────────────────

jest.mock('../src/config/prisma', () => ({
  prisma: {
    emailTemplate: { findUnique: jest.fn() },
  },
}));

jest.mock('../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    verify:   jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../src/config/index', () => ({
  config: {
    smtp: {
      host: 'smtp.test.com', port: 587,
      user: 'test@test.com', pass: 'pass',
      from: 'noreply@test.com', adminEmail: 'admin@test.com',
    },
    customerUrl: 'http://customer.localhost:5173',
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  renderTemplate,
  renderSubject,
  getTemplate,
  renderEmail,
  FALLBACK_TEMPLATES,
} from '../src/services/email-template.service';
import { sendTemplatedEmail } from '../src/services/email.service';
import { prisma } from '../src/config/prisma';

const dbFindUnique = prisma.emailTemplate.findUnique as jest.Mock;

// ── renderTemplate ────────────────────────────────────────────────────────────

describe('renderTemplate', () => {
  it('replaces a single variable', () => {
    expect(renderTemplate('Hello {{name}}!', { name: 'Alice' }))
      .toBe('Hello Alice!');
  });

  it('replaces multiple variables', () => {
    expect(renderTemplate('{{name}} paid {{amount}} on {{date}}', {
      name: 'Bob', amount: '$500', date: '1 Jan 2025',
    })).toBe('Bob paid $500 on 1 Jan 2025');
  });

  it('leaves unknown variables unchanged', () => {
    expect(renderTemplate('Hi {{name}}, ref: {{unknown}}', { name: 'Sam' }))
      .toBe('Hi Sam, ref: {{unknown}}');
  });

  it('handles numeric values', () => {
    expect(renderTemplate('Total: {{amount}}', { amount: 4500 }))
      .toBe('Total: 4500');
  });

  it('skips undefined values, keeps placeholder', () => {
    expect(renderTemplate('{{a}} and {{b}}', { a: 'hello', b: undefined }))
      .toBe('hello and {{b}}');
  });

  it('returns string unchanged when no variables present', () => {
    expect(renderTemplate('No placeholders here', {}))
      .toBe('No placeholders here');
  });

  it('handles empty string input', () => {
    expect(renderTemplate('', { name: 'x' })).toBe('');
  });

  it('replaces the same variable appearing multiple times', () => {
    expect(renderTemplate('{{name}}, dear {{name}}', { name: 'Alice' }))
      .toBe('Alice, dear Alice');
  });
});

// ── renderSubject ─────────────────────────────────────────────────────────────

describe('renderSubject', () => {
  it('replaces variables in subject line', () => {
    expect(renderSubject('Payment Confirmed — {{service}}', { service: 'Pro Plan' }))
      .toBe('Payment Confirmed — Pro Plan');
  });

  it('handles subject with no variables', () => {
    expect(renderSubject('Welcome!', {})).toBe('Welcome!');
  });
});

// ── getTemplate ───────────────────────────────────────────────────────────────

describe('getTemplate', () => {
  afterEach(() => dbFindUnique.mockReset());

  it('returns DB template when found', async () => {
    dbFindUnique.mockResolvedValue({
      key: 'welcome',
      subject: 'Welcome {{name}}',
      html: '<p>Hi {{name}}</p>',
    });

    const tpl = await getTemplate('welcome');

    expect(tpl).toEqual({ subject: 'Welcome {{name}}', html: '<p>Hi {{name}}</p>' });
    expect(dbFindUnique).toHaveBeenCalledWith({ where: { key: 'welcome' } });
  });

  it('falls back to FALLBACK_TEMPLATES when DB returns null', async () => {
    dbFindUnique.mockResolvedValue(null);

    const tpl = await getTemplate('welcome');

    expect(tpl).not.toBeNull();
    expect(typeof tpl?.subject).toBe('string');
    expect(tpl?.subject.length).toBeGreaterThan(0);
  });

  it('returns null for a key that has no fallback', async () => {
    dbFindUnique.mockResolvedValue(null);

    const tpl = await getTemplate('no_such_template_xyz');

    expect(tpl).toBeNull();
  });

  it('falls back gracefully when DB throws', async () => {
    dbFindUnique.mockRejectedValue(new Error('DB unavailable'));

    // Should not throw — returns fallback or null
    await expect(getTemplate('welcome')).resolves.not.toThrow();
    const tpl = await getTemplate('welcome');
    expect(tpl).not.toBeNull();
  });

  it('DB template takes precedence over fallback', async () => {
    dbFindUnique.mockResolvedValue({
      key: 'welcome',
      subject: 'DB Subject',
      html: '<p>DB content</p>',
    });

    const tpl = await getTemplate('welcome');
    expect(tpl?.subject).toBe('DB Subject');
  });
});

// ── renderEmail ───────────────────────────────────────────────────────────────

describe('renderEmail', () => {
  afterEach(() => dbFindUnique.mockReset());

  it('renders subject and html with variables substituted', async () => {
    dbFindUnique.mockResolvedValue({
      key: 'welcome',
      subject: 'Welcome, {{name}}!',
      html: '<p>Hi {{name}}, your email is {{email}}</p>',
    });

    const result = await renderEmail('welcome', { name: 'Alice', email: 'alice@test.com' });

    expect(result?.subject).toBe('Welcome, Alice!');
    expect(result?.html).toBe('<p>Hi Alice, your email is alice@test.com</p>');
  });

  it('returns null for an unknown template key', async () => {
    dbFindUnique.mockResolvedValue(null);

    const result = await renderEmail('does_not_exist', {});

    expect(result).toBeNull();
  });

  it('falls back to FALLBACK_TEMPLATES and still renders', async () => {
    dbFindUnique.mockResolvedValue(null);

    const result = await renderEmail('payment_success', {
      name: 'Bob', email: 'b@test.com', service: 'Pro', amount: '$500', date: '1 Jan',
    });

    expect(result).not.toBeNull();
    expect(result?.subject).not.toContain('{{name}}'); // variable replaced
    expect(result?.html).not.toContain('{{name}}');
  });
});

// ── FALLBACK_TEMPLATES coverage ───────────────────────────────────────────────

describe('FALLBACK_TEMPLATES', () => {
  const required = [
    'inquiry_received',
    'inquiry_confirmation',
    'payment_success',
    'payment_failed',
    'payment_receipt',
    'welcome',
    'contact_message',
    'admin_reply',
  ];

  test.each(required)('has a non-empty fallback for "%s"', (key) => {
    const tpl = FALLBACK_TEMPLATES[key];
    expect(tpl).toBeDefined();
    expect(tpl.subject).toBeTruthy();
    expect(tpl.html).toBeTruthy();
    expect(tpl.html.length).toBeGreaterThan(50);
  });

  it('all fallback subjects are strings', () => {
    for (const [, tpl] of Object.entries(FALLBACK_TEMPLATES)) {
      expect(typeof tpl.subject).toBe('string');
    }
  });

  it('all fallback HTML contains at least one variable placeholder', () => {
    for (const [key, tpl] of Object.entries(FALLBACK_TEMPLATES)) {
      const hasVar = /\{\{\w+\}\}/.test(tpl.subject + tpl.html);
      expect({ key, hasVar }).toMatchObject({ key, hasVar: true });
    }
  });
});

// ── sendTemplatedEmail ────────────────────────────────────────────────────────

describe('sendTemplatedEmail', () => {
  beforeEach(() => dbFindUnique.mockResolvedValue(null)); // use fallbacks
  afterEach(() => dbFindUnique.mockReset());

  it('resolves without throwing for payment_success', async () => {
    await expect(sendTemplatedEmail('payment_success', {
      email: 'user@test.com', name: 'Jane',
      service: 'Pro Plan', amount: '$4,500', date: '1 Jan 2025',
    })).resolves.toBeUndefined();
  });

  it('resolves without throwing for customer_welcome', async () => {
    await expect(sendTemplatedEmail('customer_welcome', {
      email: 'new@test.com', name: 'Bob',
    })).resolves.toBeUndefined();
  });

  it('resolves without throwing for admin_reply', async () => {
    await expect(sendTemplatedEmail('admin_reply', {
      email: 'c@test.com', name: 'Carol', reply: 'Hi there!',
    })).resolves.toBeUndefined();
  });

  it('warns and skips for an unknown event type', async () => {
    const { logger } = require('../src/utils/logger');
    await sendTemplatedEmail('not_a_real_event', { email: 'x@test.com' });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown event type')
    );
  });

  it('warns and skips when recipient is missing', async () => {
    const { logger } = require('../src/utils/logger');
    // payment_success maps to d.email — omit it
    await sendTemplatedEmail('payment_success', { name: 'Ghost' });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('No recipient')
    );
  });

  it('handles all registered event types without throwing', async () => {
    const events = [
      ['inquiry_created',     { adminEmail: 'admin@test.com', name: 'A', email: 'a@t.com', subject: 'S', message: 'M' }],
      ['inquiry_confirmation',{ email: 'a@t.com', name: 'A', subject: 'S', preview: 'M' }],
      ['payment_success',     { email: 'a@t.com', name: 'A', service: 'S', amount: '$1', date: 'd' }],
      ['payment_failed',      { email: 'a@t.com', name: 'A', service: 'S', date: 'd' }],
      ['customer_welcome',    { email: 'a@t.com', name: 'A' }],
      ['contact_message',     { adminEmail: 'admin@test.com', name: 'A', email: 'a@t.com', message: 'M' }],
      ['admin_reply',         { email: 'a@t.com', name: 'A', reply: 'R' }],
    ] as const;

    for (const [eventType, data] of events) {
      await expect(
        sendTemplatedEmail(eventType, data as Record<string, string>)
      ).resolves.toBeUndefined();
    }
  });
});
