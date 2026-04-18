# Payment Module

## Overview

The payment system uses **Stripe Checkout** — Stripe's hosted payment page. This means payment card data never touches the application server, simplifying PCI DSS compliance.

---

## Payment Types

| Type | Description | Typical Use |
|---|---|---|
| `service` | Service package payment | Client pays for a dev package |
| `custom` | User-specified amount | Consulting, ad-hoc engagement |
| `donation` | Support payment | Coffee, open-source support |

---

## Client Service Request Flow

```
Visitor views /services
       │
       ▼
Clicks "Get Started" on a service card
       │
       ▼ scrolls to inquiry form
Fills out inquiry (name, email, subject, message, serviceType)
       │
       ▼ POST /api/inquiries
Inquiry stored, inquiryId returned
       │
       ▼ optional
Clicks deposit amount ($250 / $500 / $1000)
       │
       ▼ POST /api/payments/checkout
Server creates Stripe Checkout Session
Server stores PENDING Payment record
Response: { sessionId, url }
       │
       ▼ browser redirects
Stripe Hosted Checkout Page
(card entry, 3D Secure if needed)
       │
       ▼ payment complete
Stripe redirects to /payment/success?session_id=cs_...
       │
       ▼ client polls GET /api/payments/status/:sessionId
Stripe fires webhook to /api/payments/webhook
Server updates Payment → COMPLETED
       │
       ▼ status resolves
Payment success page shows amount + receipt download
```

---

## Backend Implementation

### Checkout Session Creation

```typescript
// payment.service.ts
export const createCheckoutSession = async (params: CheckoutParams) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{ price_data: { ... }, quantity: 1 }],
    success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${CLIENT_URL}/payment/cancel`,
    metadata: { type, serviceId, serviceName, inquiryId, customerName },
  });

  // Store pending record immediately
  await prisma.payment.create({
    data: { stripeSessionId: session.id, status: 'PENDING', ... }
  });

  return { sessionId: session.id, url: session.url };
};
```

### Webhook Processing

The webhook endpoint uses `express.raw()` middleware (not JSON) because Stripe's signature verification requires the raw request body bytes.

```typescript
// Idempotency check
const existing = await prisma.paymentWebhookEvent.findUnique({
  where: { stripeEventId: event.id }
});
if (existing?.processed) return { received: true };  // already handled

// Process event
if (event.type === 'checkout.session.completed') {
  await prisma.payment.update({
    where: { stripeSessionId: session.id },
    data: { status: 'COMPLETED', stripePaymentIntent: session.payment_intent }
  });
}

// Mark processed
await prisma.paymentWebhookEvent.update({
  where: { stripeEventId: event.id },
  data: { processed: true }
});
```

---

## Database Schema

### Payment

```prisma
model Payment {
  id                  String        @id @default(cuid())
  stripeSessionId     String        @unique
  stripePaymentIntent String?
  amount              Int           // stored in cents
  currency            String        @default("usd")
  status              PaymentStatus @default(PENDING)
  type                String        @default("service")
  description         String?
  customerName        String?
  customerEmail       String?
  serviceId           String?
  serviceName         String?
  inquiryId           String?
  metadata            Json?
  receiptUrl          String?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}
```

### PaymentWebhookEvent

```prisma
model PaymentWebhookEvent {
  id            String   @id @default(cuid())
  stripeEventId String   @unique    // idempotency key
  type          String
  payload       Json
  processed     Boolean  @default(false)
  error         String?
  createdAt     DateTime @default(now())
}
```

---

## Analytics

`getPaymentAnalytics(days)` returns:

| Field | Description |
|---|---|
| `totalRevenue` | Sum of completed payments in cents |
| `totalCount` | Count of completed payments |
| `avgOrderValue` | Average per transaction |
| `byType` | Revenue grouped by payment type |
| `byDay` | Daily revenue and count for the period |
| `recent` | 10 most recent payments |
| `webhookErrors` | Count of unprocessed webhook events |

---

## Receipt PDF

`downloadReceiptPDF(payment)` in `utils/pdf.ts` generates a browser print PDF containing:
- Receipt ID, date, customer name, email
- Line item description and service name
- Subtotal, fees, total
- Payment status badge
- Stripe session reference

---

## Configuration

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` in dev, `sk_live_...` in production |
| `STRIPE_PUBLISHABLE_KEY` | Sent to frontend via `/api/payments/key` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe webhook configuration |

If `STRIPE_SECRET_KEY` is not configured, the server starts normally but throws an error when a checkout is attempted. This allows running the app without Stripe for non-payment features.

---

## Testing Stripe Locally

Use the Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Test with Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
