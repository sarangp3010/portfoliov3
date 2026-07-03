export const customerQueryKeys = {
  dashboard: () => ['customer', 'dashboard'] as const,
  payments: (page: number) => ['customer', 'payments', page] as const,
  paymentMethods: () => ['customer', 'payment-methods'] as const,
  servicePlans: () => ['customer', 'service-plans'] as const,
  devProfile: () => ['customer', 'dev-profile'] as const,
  notifications: () => ['customer', 'notifications'] as const,
  notificationsList: (params: { page: number; unreadOnly: boolean }) => ['customer', 'notifications', 'list', params] as const,
};
