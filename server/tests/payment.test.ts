/**
 * tests/payment.test.ts
 * Tests: getServicePlans (price parsing, plan building)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../src/config/prisma', () => ({
  prisma: {
    service: { findMany: jest.fn() },
    payment: { update: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
    paymentWebhookEvent: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    customer: { findUnique: jest.fn() },
  },
}));

jest.mock('../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../src/config/index', () => ({
  config: {
    stripe: {
      secretKey: 'sk_test_mock',
      webhookSecret: 'whsec_mock',
      publishableKey: 'pk_test_mock',
    },
    clientUrl:   'http://public.localhost:5173',
    customerUrl: 'http://customer.localhost:5173',
  },
}));

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    checkout:       { sessions: { create: jest.fn() } },
    webhooks:       { constructEvent: jest.fn() },
    customers:      { list: jest.fn().mockResolvedValue({ data: [] }), create: jest.fn() },
    paymentMethods: { list: jest.fn().mockResolvedValue({ data: [] }) },
  }))
);

// ── Imports ───────────────────────────────────────────────────────────────────

import { prisma } from '../src/config/prisma';
import { getServicePlans } from '../src/services/payment.service';

const mockFindMany = prisma.service.findMany as jest.Mock;

function makeService(overrides: Record<string, unknown> = {}) {
  return {
    id: 'svc-1', title: 'Starter', description: 'Basic plan',
    price: '$1,500', priceNote: 'one-time',
    features: ['Feature A', 'Feature B'],
    popular: false, order: 1, ctaLabel: 'Get Started',
    ...overrides,
  };
}

// ── getServicePlans ───────────────────────────────────────────────────────────

describe('getServicePlans', () => {
  afterEach(() => mockFindMany.mockReset());

  it('converts $1,500 price string to 150000 cents', async () => {
    mockFindMany.mockResolvedValue([makeService({ price: '$1,500' })]);
    const plans = await getServicePlans();
    expect(plans[0].price).toBe(150000);
    expect(plans[0].name).toBe('Starter');
  });

  it('converts $4,500 price string to 450000 cents', async () => {
    mockFindMany.mockResolvedValue([makeService({ title: 'Pro', price: '$4,500' })]);
    const plans = await getServicePlans();
    expect(plans[0].price).toBe(450000);
  });

  it('parses a plain numeric price string', async () => {
    mockFindMany.mockResolvedValue([makeService({ price: '2500' })]);
    const plans = await getServicePlans();
    expect(plans[0].price).toBe(250000);
  });

  it('marks popular flag correctly', async () => {
    mockFindMany.mockResolvedValue([
      makeService({ popular: false }),
      makeService({ id: 'svc-2', title: 'Pro', price: '$4,500', popular: true }),
    ]);
    const plans = await getServicePlans();
    expect(plans[0].popular).toBe(false);
    expect(plans[1].popular).toBe(true);
  });

  it('always appends a custom plan at the end', async () => {
    mockFindMany.mockResolvedValue([makeService()]);
    const plans = await getServicePlans();
    expect(plans[plans.length - 1].id).toBe('custom');
    expect(plans[plans.length - 1].price).toBe(50000); // $500
  });

  it('returns only custom plan when no services exist', async () => {
    mockFindMany.mockResolvedValue([]);
    const plans = await getServicePlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe('custom');
    expect(plans[0].name).toBe('Custom Project');
  });

  it('skips services with non-numeric price ("Custom")', async () => {
    mockFindMany.mockResolvedValue([makeService({ price: 'Custom' })]);
    const plans = await getServicePlans();
    expect(plans).toHaveLength(1);         // only the appended custom plan
    expect(plans[0].id).toBe('custom');
  });

  it('skips services with zero price', async () => {
    mockFindMany.mockResolvedValue([makeService({ price: '$0' })]);
    const plans = await getServicePlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe('custom');
  });

  it('returns plans in DB order before the custom plan', async () => {
    mockFindMany.mockResolvedValue([
      makeService({ id: 's1', title: 'A', price: '$500',  order: 1 }),
      makeService({ id: 's2', title: 'B', price: '$1000', order: 2 }),
    ]);
    const plans = await getServicePlans();
    expect(plans[0].name).toBe('A');
    expect(plans[1].name).toBe('B');
    expect(plans[2].id).toBe('custom');
  });

  it('includes features array from the service', async () => {
    mockFindMany.mockResolvedValue([makeService({ features: ['x', 'y', 'z'] })]);
    const plans = await getServicePlans();
    expect(plans[0].features).toEqual(['x', 'y', 'z']);
  });
});
