import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPaymentMethod,
  createCheckout,
  deletePaymentMethod,
  getCustomerPayments,
  getDevProfile,
  getNotifications,
  getPaymentMethods,
  getPaymentReceipt,
  getServicePlans,
  markAllRead,
  markNotificationRead,
} from '../../api';
import { customerQueryKeys } from '../../lib/queryKeys';
import type { Payment, PaymentMethod, ServicePlan } from '../../types';

export interface CustomerNotificationItem {
  id: string;
  event: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface CustomerPaymentsData {
  payments: Payment[];
  total: number;
}

interface CustomerDashboardData {
  payments: Payment[];
  plans: ServicePlan[];
  devProfile: { githubUrl?: string; linkedinUrl?: string; websiteUrl?: string } | null;
}

interface CustomerNotificationsData {
  notifications: CustomerNotificationItem[];
  totalPages: number;
}

export function useCustomerDashboardQuery() {
  return useQuery({
    queryKey: customerQueryKeys.dashboard(),
    queryFn: async () => {
      const [paymentsResponse, plansResponse, profileResponse] = await Promise.all([
        getCustomerPayments(1),
        getServicePlans(),
        getDevProfile(),
      ]);

      return {
        payments: paymentsResponse.data.data.payments || [],
        plans: plansResponse.data.data || [],
        devProfile: profileResponse.data.data ?? null,
      } satisfies CustomerDashboardData;
    },
  });
}

export function useCustomerPaymentsQuery(page: number) {
  return useQuery({
    queryKey: customerQueryKeys.payments(page),
    queryFn: async () => {
      const response = await getCustomerPayments(page);
      return {
        payments: response.data.data.payments || [],
        total: response.data.data.total || 0,
      } satisfies CustomerPaymentsData;
    },
    placeholderData: previous => previous,
  });
}

export function useCustomerServicePlansQuery() {
  return useQuery({
    queryKey: customerQueryKeys.servicePlans(),
    queryFn: async () => (await getServicePlans()).data.data as ServicePlan[],
  });
}

export function useCustomerPaymentMethodsQuery() {
  return useQuery({
    queryKey: customerQueryKeys.paymentMethods(),
    queryFn: async () => (await getPaymentMethods()).data.data as PaymentMethod[],
  });
}

export function useCustomerNotificationsQuery(page: number, unreadOnly: boolean) {
  return useQuery({
    queryKey: customerQueryKeys.notificationsList({ page, unreadOnly }),
    queryFn: async () => {
      const response = await getNotifications(page, unreadOnly);
      return {
        notifications: response.data.data.notifications ?? [],
        totalPages: response.data.data.totalPages ?? 1,
      } satisfies CustomerNotificationsData;
    },
    placeholderData: previous => previous,
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const invalidate = (key: readonly unknown[]) => queryClient.invalidateQueries({ queryKey: key });

  return {
    addPaymentMethod: useMutation({
      mutationFn: () => addPaymentMethod(),
    }),
    deletePaymentMethod: useMutation({
      mutationFn: (pmId: string) => deletePaymentMethod(pmId),
      onSuccess: () => invalidate(customerQueryKeys.paymentMethods()),
    }),
    createCheckout: useMutation({
      mutationFn: (payload: { planId: string; planName: string; amount: number }) => createCheckout(payload),
    }),
    getPaymentReceipt: useMutation({
      mutationFn: (paymentId: string) => getPaymentReceipt(paymentId),
    }),
    markNotificationRead: useMutation({
      mutationFn: (id: string) => markNotificationRead(id),
      onSuccess: () => invalidate(customerQueryKeys.notifications()),
    }),
    markAllRead: useMutation({
      mutationFn: () => markAllRead(),
      onSuccess: () => invalidate(customerQueryKeys.notifications()),
    }),
  };
}
