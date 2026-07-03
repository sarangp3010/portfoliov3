import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary, getInquiries } from '../../api';
import { adminQueryKeys } from '../../lib/queryKeys';
import type { AnalyticsSummary, Inquiry } from '../../types';

interface DashboardData {
  summary: AnalyticsSummary;
  inquiries: Inquiry[];
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: async () => {
      const [analyticsResponse, inquiriesResponse] = await Promise.all([
        getAnalyticsSummary(7),
        getInquiries({ status: 'UNREAD' }),
      ]);

      return {
        summary: analyticsResponse.data.data as AnalyticsSummary,
        inquiries: (inquiriesResponse.data.data.inquiries as Inquiry[]).slice(0, 5),
      } satisfies DashboardData;
    },
  });
}
