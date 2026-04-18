export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  provider: 'local' | 'google' | 'github' | 'microsoft';
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSession {
  id: string;
  customerId: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  loginAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  features: string[];
  popular: boolean;
  badge?: string;
}

export interface Payment {
  id: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  description?: string;
  serviceName?: string;
  planId?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface AuthCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  provider: string;
}
