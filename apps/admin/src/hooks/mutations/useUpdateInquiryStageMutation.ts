import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInquiryStage } from '../../api';
import { inquiryKeys } from '../../lib/queryKeys';
import type { Inquiry, InquiryStage } from '../../types';

interface UpdateInquiryStageArgs {
  id: string;
  stage: InquiryStage;
  note?: string;
}

export function useUpdateInquiryStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage, note }: UpdateInquiryStageArgs) => updateInquiryStage(id, stage, note),
    onSuccess: (_response, { id, stage }) => {
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
                inquiry.id === id ? { ...inquiry, stage, stageUpdatedAt: new Date().toISOString() } : inquiry
              ),
            },
          };
        }
      );
    },
  });
}
