import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInquiry } from '../../api';
import { inquiryKeys } from '../../lib/queryKeys';
import type { Inquiry } from '../../types';

export function useDeleteInquiryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInquiry(id),
    onSuccess: (_response, id) => {
      queryClient.setQueriesData(
        { queryKey: inquiryKeys.all },
        (existing: {
          success: boolean;
          data: { inquiries: Inquiry[]; total: number; page: number; totalPages: number };
        } | undefined) => {
          if (!existing) return existing;
          const inquiries = existing.data.inquiries.filter(inquiry => inquiry.id !== id);
          const total = Math.max(0, existing.data.total - 1);
          return {
            ...existing,
            data: {
              ...existing.data,
              inquiries,
              total,
              totalPages: Math.max(1, Math.ceil(total / 20)),
            },
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
    },
  });
}
