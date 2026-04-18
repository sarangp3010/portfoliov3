# Customer Portal

## Overview

The Customer Portal is a dedicated authenticated environment for clients who purchase services. It runs at `customer.example.com` (or `http://localhost:3002` in development).

## Architecture

```
/apps/customer/          ← React + TypeScript + Vite + Tailwind
  src/
    pages/customer/      ← All portal pages
    components/layout/   ← CustomerLayout (sidebar nav)
    context/             ← AuthContext (customer JWT)
    api/                 ← API client pointing to /server
    types/               ← Customer-specific types
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Email/password login + social OAuth buttons |
| `/register` | New customer registration with optional phone |
| `/dashboard` | Overview: spend, payments, quick links, dev profile |
| `/services` | Service plan cards with direct Stripe checkout |
| `/payments` | Full payment history with receipt download |
| `/payment-methods` | Saved cards via Stripe (add/remove) |
| `/contact-admin` | Free-text message to admin |
| `/profile` | Edit name, phone (email/provider locked) |
| `/payment/success` | Post-checkout confirmation |

## Authentication

Customers authenticate separately from the admin user. The JWT contains `role: "CUSTOMER"`.

**Email/Password:** Standard bcrypt hashed passwords, minimum 8 characters.

**Social Login (OAuth):** Google, GitHub, and Microsoft are supported as OAuth providers. In production, configure with passport.js:
1. Create OAuth apps at each provider
2. Add env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
3. Implement the OAuth callback routes in `server/src/controllers/oauth.controller.ts`

## Customer Sessions

Every login creates a `CustomerSession` record in the DB:
- Token (random 96-char hex)
- IP address, user agent, browser, device
- `loginAt`, `lastActiveAt`, `expiresAt` (30 days)
- `isActive` flag (set to false on logout or admin termination)

Admins can view and terminate active sessions in **Admin → Customers → Active Sessions**.

## SMS Notifications

After a successful Stripe payment webhook:
1. The system looks up the customer by email
2. If a phone number is on file, sends an SMS via Twilio

**Setup:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15550001234
```

If Twilio is not configured, SMS is silently skipped.

## Admin Management

### Customers List
- View all registered customers
- See payment count, session count, message count per customer
- Activate / Deactivate accounts
- Click "View" to see full profile + payment history + sessions

### Active Sessions
- See all currently active customer sessions
- Browser, device, IP, last active time
- Terminate any session instantly

### Messages
- Receive messages sent from the Contact Admin page
- Reply directly — reply is sent via email to the customer and stored in DB

## Environment Variables

```env
# Required for customer portal
JWT_SECRET=your_secret          # Shared with admin auth
CUSTOMER_URL=http://customer.example.com

# Optional: SMS notifications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## Development

```bash
cd apps/customer
npm install
npm run dev      # Runs on http://localhost:3002
```

The customer API is served from the main server at `VITE_API_URL` (default: `http://localhost:5000`).

## Stripe Integration

Customer portal uses the same Stripe keys as the public site:
- `getServicePlans()` — reads live services from DB and converts prices
- `createCheckout` — creates a Stripe Checkout session with `fromCustomerPortal: true`
- Success redirect → `/payment/success` on the customer portal
- `getPaymentMethods` — reads saved cards from Stripe for the customer's email
- `setupPaymentMethod` — creates a Stripe Setup Session for adding new cards
