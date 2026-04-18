# Testing Guide

## Structure

```
server/
  tests/
    email.test.ts      — renderTemplate, getTemplate, renderEmail, sendTemplatedEmail
    payment.test.ts    — getServicePlans, price parsing
    inquiry.test.ts    — submitInquiry, updateInquiryStatus, deleteInquiry

apps/admin/
  src/tests/
    setup.ts           — vitest setup (extends jest-dom matchers)
    modal.test.tsx     — Modal open/close, Escape, scroll lock, ConfirmDialog
    form.test.tsx      — AdminLogin inputs, validation, submit, loading, error
    button.test.tsx    — Spinner sizes, button states, status rendering
```

## Backend Tests (Jest + ts-jest)

```bash
cd server

# 1. Install dependencies
npm install

# 2. Run all tests
npm test

# 3. Watch mode
npm run test:watch

# 4. Single file
npm test -- --testPathPattern=email

# 5. Coverage report
npm run test:coverage
```

## Frontend Tests (Vitest + Testing Library)

```bash
cd apps/admin

# 1. Install dependencies
npm install

# 2. Run all tests
npm test

# 3. Watch mode (interactive)
npm run test:watch

# 4. Single file
npx vitest run src/tests/modal.test.tsx

# 5. Coverage report
npm run test:coverage
```

## What is mocked

**Backend:**
- `prisma` — all DB calls (jest.mock)
- `nodemailer` — no real SMTP
- `stripe` — no real API calls
- `logger` — suppresses output
- `config` — test values for SMTP, URLs

**Frontend:**
- `framer-motion` — renders children immediately (no animation delays)
- `react-router-dom` — `useNavigate` replaced with `vi.fn()`
- `../api` — all API calls replaced with `vi.fn()`
- `../context/AuthContext` — `useAuth` returns mock `setUser`

## Adding new tests

**New backend event type:**
```ts
// In email.test.ts, add to the events array:
['my_new_event', { email: 'a@t.com', name: 'A', myVar: 'val' }],
```

**New DB-driven function:**
```ts
// Mock the prisma method, test the controller
const mockCreate = prisma.myModel.create as jest.Mock;
mockCreate.mockResolvedValue({ id: '1', ...fields });
```

**New frontend component:**
```tsx
// In src/tests/mycomponent.test.tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

it('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('expected text')).toBeInTheDocument();
});
```
