export const inquiryKeys = {
  all: ['inquiries'] as const,
  list: (params: { page: number; status?: string }) => [...inquiryKeys.all, 'list', params] as const,
};
