import { useQuery } from '@tanstack/react-query';
import { getInquiries } from '../../api';
import { inquiryKeys } from '../../lib/queryKeys';
import type { Inquiry } from '../../types';

interface InquiriesResponse {
  success: boolean;
  data: {
    inquiries: Inquiry[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function useInquiriesQuery(page: number, status?: string, stage?: string) {
  return useQuery({
    queryKey: inquiryKeys.list({ page, ...(status ? { status } : {}), ...(stage ? { stage } : {}) }),
    queryFn: async () => {
      const response = await getInquiries({ page, status, stage });
      return response.data as InquiriesResponse;
    },
    placeholderData: previous => previous,
  });
}
