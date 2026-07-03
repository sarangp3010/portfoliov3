import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  getAdminFlags,
  getAnalyticsSessions,
  createEmailTemplate,
  createPageSection,
  deleteEmailTemplate,
  deletePageSection,
  getActiveVisitors,
  getAdminSections,
  getDiagnostics,
  getEmailTemplates,
  getEventLog,
  getNavFlows,
  getSessionTimeline,
  getSmartInsights,
  listSectionPages,
  previewEmailTemplate,
  reorderPageSections,
  resetEmailTemplate,
  sendTestEmail,
  togglePageSection,
  toggleFlag,
  updateEmailTemplate,
  updatePageSection,
  patchFlag,
} from '../../api';
import { adminQueryKeys } from '../../lib/queryKeys';
import type { ActiveVisitorSummary, DiagnosticsData, FeatureFlag, NavFlow, SessionDetail, SmartInsight } from '../../types';

export interface AdminCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  _count: { payments: number; sessions: number; messages: number };
}

export interface AdminCustomerDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  payments: Array<{ id: string; amount: number; status: string; serviceName?: string; createdAt: string }>;
  sessions: Array<{ id: string; browser?: string; device?: string; ipAddress?: string; loginAt: string; lastActiveAt: string; isActive: boolean }>;
  messages: Array<{ id: string; message: string; status: string; createdAt: string }>;
}

export interface AdminActiveSession {
  id: string;
  customerId: string;
  browser?: string;
  device?: string;
  ipAddress?: string;
  loginAt: string;
  lastActiveAt: string;
  customer: { email: string; name: string };
}

export interface AdminCustomerMessage {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  customer: { name: string; email: string };
  adminReply?: string;
}

export interface AdminEmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  isSystem: boolean;
  updatedAt: string;
}

export interface AdminSectionStyle {
  primaryColor?: string;
  bgColor?: string;
  textColor?: string;
  gradient?: string;
  spacing?: string;
}

export interface AdminSectionAnimation {
  type?: string;
  direction?: string;
  duration?: string;
  delay?: number;
  trigger?: string;
}

export interface AdminPageSection {
  id: string;
  page: string;
  key: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaText?: string;
  ctaLink?: string;
  icon?: string;
  imageUrl?: string;
  content: Record<string, unknown>;
  style: AdminSectionStyle;
  animation: AdminSectionAnimation;
  variant: string;
  mobileHide: boolean;
  desktopHide: boolean;
  isVisible: boolean;
  order: number;
}

export interface AdminAnalyticsSession {
  id: string;
  locationCountry?: string;
  locationCity?: string;
  browser?: string;
  operatingSystem?: string;
  entryPage?: string;
  exitPage?: string;
  pageCount: number;
  totalDuration?: number;
  totalEvents: number;
  navigationPath: string[];
  sessionStart: string;
  visitor?: {
    country?: string;
    browser?: string;
  };
  _count?: {
    contentEvents?: number;
  };
  highlights?: Array<{
    eventType: string;
    contentTitle?: string;
  }>;
}

export function useAdminCustomersQuery(page: number, enabled: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.customers(page),
    queryFn: async () => {
      const response = await api.get(`/admin/customers?page=${page}`);
      return {
        customers: (response.data.data.customers ?? []) as AdminCustomer[],
        total: (response.data.data.total ?? 0) as number,
      };
    },
    enabled,
  });
}

export function useAdminCustomerDetailQuery(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.customerDetail(id ?? ''),
    queryFn: async () => (await api.get(`/admin/customers/${id}`)).data.data as AdminCustomerDetail,
    enabled: enabled && Boolean(id),
  });
}

export function useAdminCustomerSessionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.customerSessions(),
    queryFn: async () => (await api.get('/admin/customers/sessions')).data.data as AdminActiveSession[],
    enabled,
  });
}

export function useAdminCustomerMessagesQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.customerMessages(),
    queryFn: async () => (await api.get('/admin/customers/messages')).data.data as AdminCustomerMessage[],
    enabled,
  });
}

export function useAdminCustomerMutations(page: number) {
  const queryClient = useQueryClient();

  return {
    toggleCustomer: useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        api.patch(`/admin/customers/${id}/active`, { isActive: !isActive }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers(page) });
      },
    }),
    terminateSession: useMutation({
      mutationFn: (sessionId: string) => api.delete(`/admin/customers/sessions/${sessionId}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.customerSessions() });
      },
    }),
    sendReply: useMutation({
      mutationFn: ({ messageId, reply }: { messageId: string; reply: string }) =>
        api.post(`/admin/customers/messages/${messageId}/reply`, { reply }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.customerMessages() });
      },
    }),
  };
}

export function useAdminEmailTemplatesQuery() {
  return useQuery({
    queryKey: adminQueryKeys.emailTemplates(),
    queryFn: async () => (await getEmailTemplates()).data.data as AdminEmailTemplate[],
  });
}

export function useAdminEmailTemplateMutations() {
  const queryClient = useQueryClient();

  return {
    createTemplate: useMutation({
      mutationFn: (payload: Record<string, unknown>) => createEmailTemplate(payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.emailTemplates() }),
    }),
    updateTemplate: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateEmailTemplate(id, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.emailTemplates() }),
    }),
    deleteTemplate: useMutation({
      mutationFn: (id: string) => deleteEmailTemplate(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.emailTemplates() }),
    }),
    resetTemplate: useMutation({
      mutationFn: (id: string) => resetEmailTemplate(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.emailTemplates() }),
    }),
    previewTemplate: useMutation({
      mutationFn: (id: string) => previewEmailTemplate(id),
    }),
    sendTest: useMutation({
      mutationFn: ({ id, to }: { id: string; to: string }) => sendTestEmail(id, to),
    }),
  };
}

export function useAdminSectionPagesQuery() {
  return useQuery({
    queryKey: adminQueryKeys.pageSectionPages(),
    queryFn: async () => {
      const pages = (await listSectionPages()).data.data as string[];
      return [...new Set([...pages, 'home', 'services'])];
    },
  });
}

export function useAdminPageSectionsQuery(page: string) {
  return useQuery({
    queryKey: adminQueryKeys.pageSections(page),
    queryFn: async () => (await getAdminSections(page)).data.data as AdminPageSection[],
  });
}

export function useAdminPageSectionMutations(activePage: string) {
  const queryClient = useQueryClient();

  return {
    createSection: useMutation({
      mutationFn: (payload: Record<string, unknown>) => createPageSection(payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pageSections(activePage) }),
    }),
    updateSection: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updatePageSection(id, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pageSections(activePage) }),
    }),
    deleteSection: useMutation({
      mutationFn: (id: string) => deletePageSection(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pageSections(activePage) }),
    }),
    reorderSections: useMutation({
      mutationFn: (order: { id: string; order: number }[]) => reorderPageSections(order),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pageSections(activePage) }),
    }),
    toggleSection: useMutation({
      mutationFn: (id: string) => togglePageSection(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.pageSections(activePage) }),
    }),
  };
}

export function useAdminFeatureFlagsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.featureFlags(),
    queryFn: async () => (await getAdminFlags()).data.data as FeatureFlag[],
  });
}

export function useAdminFeatureFlagMutations() {
  const queryClient = useQueryClient();

  return {
    toggleFeatureFlag: useMutation({
      mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => toggleFlag(key, enabled),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.featureFlags() }),
    }),
    patchFeatureFlag: useMutation({
      mutationFn: ({ key, payload }: { key: string; payload: Record<string, unknown> }) => patchFlag(key, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.featureFlags() }),
    }),
  };
}

export function useAdminAnalyticsSessionsQuery(page: number) {
  return useQuery({
    queryKey: adminQueryKeys.analyticsSessions(page),
    queryFn: async () => {
      const data = (await getAnalyticsSessions(page)).data.data;
      return {
        sessions: (data.sessions ?? []) as AdminAnalyticsSession[],
        total: (data.total ?? 0) as number,
        pages: (data.pages ?? 1) as number,
      };
    },
  });
}

export function useAdminSessionTimelineQuery(id: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.sessionTimeline(id ?? ''),
    queryFn: async () => (await getSessionTimeline(id!)).data.data as SessionDetail | null,
    enabled: Boolean(id),
  });
}

export function useAdminDiagnosticsQuery(hours: number) {
  return useQuery({
    queryKey: adminQueryKeys.diagnostics(hours),
    queryFn: async () => (await getDiagnostics(hours)).data.data as DiagnosticsData | null,
  });
}

export function useAdminEventLogQuery(limit: number) {
  return useQuery({
    queryKey: adminQueryKeys.eventLog(limit),
    queryFn: async () => (await getEventLog(limit)).data.data as Array<Record<string, any>>,
  });
}

export function useAdminSmartInsightsQuery(days: number) {
  return useQuery({
    queryKey: adminQueryKeys.smartInsights(days),
    queryFn: async () => ((await getSmartInsights(days)).data.data?.insights ?? []) as SmartInsight[],
  });
}

export function useAdminNavFlowsQuery(days: number) {
  return useQuery({
    queryKey: adminQueryKeys.navFlows(days),
    queryFn: async () => (await getNavFlows(days)).data.data as NavFlow | null,
  });
}

export function useAdminActiveVisitorsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.activeVisitors(),
    queryFn: async () => (await getActiveVisitors()).data.data as ActiveVisitorSummary | null,
    refetchInterval: 30_000,
  });
}
