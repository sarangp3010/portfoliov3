import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAllRead, markNotificationRead } from '../../api';
import { adminQueryKeys } from '../../lib/queryKeys';

export interface NotificationItem {
  id: string;
  event: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationsData {
  notifications: NotificationItem[];
  totalPages: number;
}

export function useNotificationsQuery(page: number, unreadOnly: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.notificationsList({ page, unreadOnly }),
    queryFn: async () => {
      const response = await getNotifications(page, unreadOnly);
      return {
        notifications: response.data.data.notifications ?? [],
        totalPages: response.data.data.totalPages ?? 1,
      } satisfies NotificationsData;
    },
    placeholderData: previous => previous,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications() });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications() });
    },
  });
}
