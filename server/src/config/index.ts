import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '5001', 10),
  host: process.env.HOST ?? '0.0.0.0',
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? '',
    adminEmail: process.env.ADMIN_EMAIL ?? process.env.SMTP_USER ?? '',
  },
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  publicUrl: process.env.PUBLIC_URL ?? process.env.CLIENT_URL ?? 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL ?? 'http://localhost:3001',
  customerUrl: process.env.CUSTOMER_URL ?? 'http://localhost:3002',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? '',
  },
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10),
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model:  process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  oauth: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackUrl:  process.env.GOOGLE_CALLBACK_URL ?? 'http://api.localhost:5173/api/customer/auth/google/callback',
    },
    github: {
      clientId:     process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      callbackUrl:  process.env.GITHUB_CALLBACK_URL ?? 'http://api.localhost:5173/api/customer/auth/github/callback',
    },
    // URL to redirect the browser to after OAuth completes (frontend callback page)
    successRedirect: process.env.OAUTH_SUCCESS_URL ?? 'http://customer.localhost:5173/auth/callback',
    errorRedirect:   process.env.OAUTH_ERROR_URL   ?? 'http://customer.localhost:5173/login',
  },
};
