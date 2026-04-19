# Payment Module

## Overview

The payment system is built on Stripe Checkout and supports both public-site and customer-portal payment flows.

Current strengths:

- hosted Stripe Checkout keeps card handling off the app server
- pending payment records are created immediately
- webhook processing is idempotent
- admin payment analytics are available
- customer portal users can view payments and manage saved payment methods

## Payment Entry Paths

### Public Flow

Used when a visitor explores services on the public site and either purchases directly or proceeds through an inquiry-driven flow.

### Customer Portal Flow

Used when an authenticated customer purchases from the portal using:

- a selected plan
- customer identity already known from the portal session

The customer portal also exposes:

- payment history
- receipt data
- Stripe payment method setup and deletion

## Data Model

### `Payment`

The current `Payment` model includes:

- Stripe session and payment intent identifiers
- amount and currency
- payment status
- payment type
- payment source
- optional plan, inquiry, service, and customer linkage
- metadata

Important current fields:

- `status`
- `type`
- `paymentSource`
- `customerId`
- `customerEmail`
- `serviceName`
- `planId`

This is more capable than an earlier “single checkout table” design because it already distinguishes direct and inquiry-driven payments.

### `PaymentWebhookEvent`

Used as an idempotency and trace record for Stripe webhooks.

Purpose:

- prevent duplicate processing
- record payloads
- surface errors when webhook handling fails

## Public Payment Lifecycle

```text
Visitor opens /services
  -> selects a service or plan
  -> optional inquiry submitted
  -> frontend requests /api/payments/checkout
  -> server creates Stripe Checkout session
  -> server stores PENDING payment
  -> browser redirects to Stripe
  -> Stripe webhook updates payment state
  -> success/cancel page resolves status
```

## Customer Portal Payment Lifecycle

```text
Customer logs in
  -> opens /services or /payments
  -> starts checkout with known account identity
  -> /api/customer/payments/checkout
  -> server creates checkout session with customer context
  -> payment stored and later updated via webhook
  -> customer sees it in portal history
```

## Payment Methods

The customer portal supports saved Stripe payment methods.

Current backend routes:

- `GET /api/customer/payment-methods`
- `POST /api/customer/payment-methods/setup`
- `DELETE /api/customer/payment-methods/:pmId`

These are important because they move the portal beyond one-time checkout into ongoing customer account management.

## Admin Payments Surface

The admin app currently includes a payments manager with:

- paginated transactions
- revenue analytics
- filtering by source
- recent payment visibility

The backend supports:

- `GET /api/admin/payments`
- `GET /api/admin/payments/analytics`

## Webhook Handling

Webhook processing is designed to be idempotent.

Typical flow:

1. Stripe posts to `/api/payments/webhook`
2. raw request body is used for signature verification
3. `PaymentWebhookEvent` is checked/recorded
4. relevant payment is updated
5. repeat delivery is ignored when already processed

This is one of the more production-ready backend areas in the repo.

## Notifications And Side Effects

Payments can trigger follow-on communication behavior such as:

- customer email
- notification creation
- optional SMS behavior where configured

That means payments are not isolated to a single controller. They already participate in the broader customer-ops system.

## Configuration

Required Stripe variables:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Optional but related:

- customer portal URLs
- email delivery configuration
- SMS configuration

## Current Limitations

The current payment system is strong for one-time and direct service payments, but it does not yet include:

- invoices
- milestone billing
- subscriptions
- dunning/retry workflows
- proposal-linked billing

Those are valid future additions, but the existing implementation is already robust for the current product stage.
