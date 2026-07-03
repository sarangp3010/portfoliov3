import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsBlogStats,
  getAnalyticsProjectStats,
  getAnalyticsSummary,
  getAnalyticsVisitorInsights,
  getPaymentAnalytics,
} from '../../api';
import { adminQueryKeys } from '../../lib/queryKeys';
import type {
  AnalyticsSummary,
  BlogAnalytics,
  PaymentAnalytics,
  ProjectAnalytics,
  VisitorInsights,
} from '../../types';

interface AnalyticsPageData {
  summary: AnalyticsSummary;
  blogStats: BlogAnalytics;
  projectStats: ProjectAnalytics;
  visitorStats: VisitorInsights;
  paymentStats: PaymentAnalytics;
}

export function useAnalyticsPageQuery(days: number) {
  return useQuery({
    queryKey: adminQueryKeys.analyticsPage(days),
    queryFn: async () => {
      const [summary, blogStats, projectStats, visitorStats, paymentStats] = await Promise.all([
        getAnalyticsSummary(days),
        getAnalyticsBlogStats(days),
        getAnalyticsProjectStats(days),
        getAnalyticsVisitorInsights(days),
        getPaymentAnalytics(days),
      ]);

      return {
        summary: summary.data.data as AnalyticsSummary,
        blogStats: blogStats.data.data as BlogAnalytics,
        projectStats: projectStats.data.data as ProjectAnalytics,
        visitorStats: visitorStats.data.data as VisitorInsights,
        paymentStats: paymentStats.data.data as PaymentAnalytics,
      } satisfies AnalyticsPageData;
    },
  });
}
