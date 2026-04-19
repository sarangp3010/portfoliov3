import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInquiryStatus } from '../../api';
import { inquiryKeys } from '../../lib/queryKeys';
import type { Inquiry } from '../../types';

interface UpdateInquiryStatusArgs {
  id: string;
  status: Inquiry['status'];
}

export function useUpdateInquiryStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: UpdateInquiryStatusArgs) => updateInquiryStatus(id, status),
    onSuccess: (_response, { id, status }) => {
      queryClient.setQueriesData(
        { queryKey: inquiryKeys.all },
        (existing: {
          success: boolean;
          data: { inquiries: Inquiry[]; total: number; page: number; totalPages: number };
        } | undefined) => {
          if (!existing) return existing;
          return {
            ...existing,
            data: {
              ...existing.data,
              inquiries: existing.data.inquiries.map(inquiry =>
                inquiry.id === id ? { ...inquiry, status } : inquiry
              ),
            },
          };
        }
      );
    },
  });
}
