import { useQuery } from '@tanstack/react-query';
import {
  getActiveResume,
  getPageSections,
  getPosts,
  getProfile,
  getProjects,
  getServicePlans,
  getServices,
  getTags,
  getTestimonials,
} from '../../api';
import { publicQueryKeys } from '../../lib/queryKeys';
import type { BlogPost, Profile, Project, Resume, Service, ServicePlan, Testimonial } from '../../types';
import type { PageSection } from '../useSections';

interface PostsResponse {
  posts: BlogPost[];
  total: number;
}

export function useProfileQuery() {
  return useQuery({
    queryKey: publicQueryKeys.profile(),
    queryFn: async () => (await getProfile()).data.data as Profile,
  });
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: publicQueryKeys.projects(),
    queryFn: async () => (await getProjects()).data.data as Project[],
  });
}

export function usePostsQuery(page: number, tag?: string) {
  return useQuery({
    queryKey: publicQueryKeys.posts({ page, ...(tag ? { tag } : {}) }),
    queryFn: async () => {
      const response = await getPosts({ page, tag });
      return response.data.data as PostsResponse;
    },
    placeholderData: previous => previous,
  });
}

export function useTagsQuery() {
  return useQuery({
    queryKey: publicQueryKeys.tags(),
    queryFn: async () => (await getTags()).data.data as string[],
  });
}

export function useServicesQuery() {
  return useQuery({
    queryKey: publicQueryKeys.services(),
    queryFn: async () => (await getServices()).data.data as Service[],
  });
}

export function useServicePlansQuery() {
  return useQuery({
    queryKey: publicQueryKeys.servicePlans(),
    queryFn: async () => (await getServicePlans()).data.data as ServicePlan[],
  });
}

export function useTestimonialsQuery() {
  return useQuery({
    queryKey: publicQueryKeys.testimonials(),
    queryFn: async () => (await getTestimonials()).data.data as Testimonial[],
  });
}

export function useActiveResumeQuery() {
  return useQuery({
    queryKey: publicQueryKeys.activeResume(),
    queryFn: async () => (await getActiveResume()).data.data as Resume | null,
  });
}

export function usePageSectionsQuery(page: string) {
  return useQuery({
    queryKey: publicQueryKeys.sections(page),
    queryFn: async () => (await getPageSections(page)).data.data as PageSection[],
    staleTime: 5 * 60_000,
  });
}
