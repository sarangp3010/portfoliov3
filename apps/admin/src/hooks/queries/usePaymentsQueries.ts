import { useQuery } from '@tanstack/react-query';
import { getPaymentAnalytics, listAdminPayments } from '../../api';
import { adminQueryKeys } from '../../lib/queryKeys';
import type { Payment, PaymentAnalytics } from '../../types';

interface AdminPaymentsData {
  payments: Payment[];
  total: number;
  pages: number;
}

export function usePaymentAnalyticsQuery(days: number) {
  return useQuery({
    queryKey: adminQueryKeys.paymentAnalytics(days),
    queryFn: async () => (await getPaymentAnalytics(days)).data.data as PaymentAnalytics,
  });
}

export function useAdminPaymentsQuery(page: number, source?: string, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.paymentsList({ page, ...(source ? { source } : {}) }),
    queryFn: async () => {
      const response = await listAdminPayments(page, source);
      return {
        payments: response.data.data.payments ?? [],
        total: response.data.data.total ?? 0,
        pages: response.data.data.pages ?? 1,
      } satisfies AdminPaymentsData;
    },
    enabled,
    placeholderData: previous => previous,
  });
}
