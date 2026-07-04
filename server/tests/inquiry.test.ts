/**
 * tests/inquiry.test.ts
 * Tests: submitInquiry, updateInquiryStatus, deleteInquiry
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../src/config/prisma', () => ({
  prisma: {
    inquiry: {
      create:    jest.fn(),
      findMany:  jest.fn(),
      update:    jest.fn(),
      delete:    jest.fn(),
      count:     jest.fn(),
    },
  },
}));

jest.mock('../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../src/services/email.service', () => ({
  sendInquiryEmails:    jest.fn().mockResolvedValue(undefined),
  sendTemplatedEmail:   jest.fn().mockResolvedValue(undefined),
}));

// Mock notification service so notifyAdmin doesn't try to hit prisma.user
jest.mock('../src/services/notification.service', () => ({
  notifyAdmin:    jest.fn().mockResolvedValue(undefined),
  notifyCustomer: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/config/index', () => ({
  config: {
    smtp: { user: 'test@test.com', adminEmail: 'admin@test.com' },
    customerUrl: 'http://localhost:3002',
  },
}));

jest.mock('../src/services/cache.service', () => ({
  cached:             jest.fn((_, fn) => fn()),
  cacheGet:           jest.fn().mockResolvedValue(null),
  cacheSet:           jest.fn().mockResolvedValue(undefined),
  cacheDelete:        jest.fn().mockResolvedValue(undefined),
  cacheDeletePattern: jest.fn().mockResolvedValue(undefined),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../src/config/prisma';
import {
  submitInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from '../src/controllers/content.controller';

const mockCreate = prisma.inquiry.create  as jest.Mock;
const mockUpdate = prisma.inquiry.update  as jest.Mock;
const mockDelete = prisma.inquiry.delete  as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

function req(body = {}, params = {}): Partial<Request> {
  return {
    body,
    params: params as Request['params'],
    query:  {},
    ip:     '127.0.0.1',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' } as any,
  } as Partial<Request>;
}

function res(): jest.Mocked<Partial<Response>> & { json: jest.Mock; status: jest.Mock } {
  const r = { json: jest.fn(), status: jest.fn() };
  r.status.mockReturnValue(r);
  return r as any;
}

const next: NextFunction = jest.fn();

// ── submitInquiry ─────────────────────────────────────────────────────────────

describe('submitInquiry', () => {
  afterEach(() => { mockCreate.mockReset(); (next as jest.Mock).mockReset(); });

  it('creates inquiry and responds 201 with valid input', async () => {
    const inquiry = {
      id: 'inq-1', name: 'Alice', email: 'alice@test.com',
      subject: 'Hello', message: 'A message long enough', status: 'UNREAD',
    };
    mockCreate.mockResolvedValue(inquiry);

    const r = res();
    await submitInquiry(
      req({ name: 'Alice', email: 'alice@test.com', subject: 'Hello', message: 'A message long enough' }) as Request,
      r as unknown as Response,
      next
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Alice', email: 'alice@test.com' }),
      })
    );
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: inquiry })
    );
  });

  it('passes error to next when required fields are missing', async () => {
    const r = res();
    await submitInquiry(
      req({ name: 'Alice' }) as Request, // missing email, subject, message
      r as unknown as Response,
      next
    );

    expect(next).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(r.json).not.toHaveBeenCalled();
  });

  it('passes error to next when email is missing', async () => {
    const r = res();
    await submitInquiry(
      req({ name: 'A', subject: 'S', message: 'M' }) as Request,
      r as unknown as Response,
      next
    );
    expect(next).toHaveBeenCalled();
  });

  it('passes error to next when subject is missing', async () => {
    const r = res();
    await submitInquiry(
      req({ name: 'A', email: 'a@b.com', message: 'M' }) as Request,
      r as unknown as Response,
      next
    );
    expect(next).toHaveBeenCalled();
  });

  it('passes DB error to next', async () => {
    mockCreate.mockRejectedValue(new Error('DB failure'));
    const r = res();
    await submitInquiry(
      req({ name: 'A', email: 'a@b.com', subject: 'S', message: 'M' }) as Request,
      r as unknown as Response,
      next
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('fires email notification without awaiting (non-blocking)', async () => {
    mockCreate.mockResolvedValue({ id: 'inq-1' });
    const { sendInquiryEmails } = require('../src/services/email.service');
    const r = res();

    await submitInquiry(
      req({ name: 'A', email: 'a@b.com', subject: 'S', message: 'M' }) as Request,
      r as unknown as Response,
      next
    );

    expect(sendInquiryEmails).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'A', email: 'a@b.com' })
    );
  });
});

// ── updateInquiryStatus ───────────────────────────────────────────────────────

describe('updateInquiryStatus', () => {
  afterEach(() => { mockUpdate.mockReset(); (next as jest.Mock).mockReset(); });

  it('updates status and returns the updated inquiry', async () => {
    const updated = { id: 'inq-1', status: 'READ' };
    mockUpdate.mockResolvedValue(updated);

    const r = res();
    await updateInquiryStatus(
      req({ status: 'READ' }, { id: 'inq-1' }) as Request,
      r as unknown as Response,
      next
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'inq-1' },
      data:  { status: 'READ' },
    });
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: updated })
    );
  });

  it('can set status to REPLIED', async () => {
    mockUpdate.mockResolvedValue({ id: 'inq-1', status: 'REPLIED' });
    const r = res();

    await updateInquiryStatus(
      req({ status: 'REPLIED' }, { id: 'inq-1' }) as Request,
      r as unknown as Response,
      next
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'inq-1' },
      data:  { status: 'REPLIED' },
    });
  });

  it('passes DB error to next', async () => {
    mockUpdate.mockRejectedValue(new Error('Record not found'));
    const r = res();

    await updateInquiryStatus(
      req({ status: 'READ' }, { id: 'bad-id' }) as Request,
      r as unknown as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ── deleteInquiry ─────────────────────────────────────────────────────────────

describe('deleteInquiry', () => {
  afterEach(() => { mockDelete.mockReset(); (next as jest.Mock).mockReset(); });

  it('deletes the inquiry by id and returns success', async () => {
    mockDelete.mockResolvedValue({});
    const r = res();

    await deleteInquiry(
      req({}, { id: 'inq-1' }) as Request,
      r as unknown as Response,
      next
    );

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'inq-1' } });
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('passes DB error to next when delete fails', async () => {
    mockDelete.mockRejectedValue(new Error('Not found'));
    const r = res();

    await deleteInquiry(
      req({}, { id: 'bad-id' }) as Request,
      r as unknown as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
