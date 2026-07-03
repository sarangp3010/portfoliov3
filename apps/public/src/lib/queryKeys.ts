export const publicQueryKeys = {
  all: ['public'] as const,
  profile: () => [...publicQueryKeys.all, 'profile'] as const,
  projects: () => [...publicQueryKeys.all, 'projects'] as const,
  posts: (params: { page: number; tag?: string }) => [...publicQueryKeys.all, 'posts', params] as const,
  tags: () => [...publicQueryKeys.all, 'tags'] as const,
  services: () => [...publicQueryKeys.all, 'services'] as const,
  servicePlans: () => [...publicQueryKeys.all, 'service-plans'] as const,
  testimonials: () => [...publicQueryKeys.all, 'testimonials'] as const,
  activeResume: () => [...publicQueryKeys.all, 'active-resume'] as const,
  sections: (page: string) => [...publicQueryKeys.all, 'sections', page] as const,
};
