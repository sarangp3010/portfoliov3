import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateResume,
  createPost,
  createProject,
  createService,
  createTestimonial,
  deleteAllPosts,
  deleteAllProjects,
  deleteAllServices,
  deleteAllTestimonials,
  deletePost,
  deleteProject,
  deleteResume,
  deleteService,
  deleteTestimonial,
  getAllResumes,
  getPosts,
  getProfile,
  getProjects,
  getServices,
  getTestimonials,
  updatePost,
  updateProfile,
  updateProject,
  updateService,
  updateTestimonial,
  uploadResume,
} from '../../api';
import { adminQueryKeys } from '../../lib/queryKeys';
import type { BlogPost, Profile, Project, Resume, Service, Testimonial } from '../../types';

export function useAdminProjectsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.projects(),
    queryFn: async () => (await getProjects()).data.data as Project[],
  });
}

export function useAdminServicesQuery() {
  return useQuery({
    queryKey: adminQueryKeys.services(),
    queryFn: async () => (await getServices()).data.data as Service[],
  });
}

export function useAdminBlogPostsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.blogPosts(),
    queryFn: async () => {
      const response = await getPosts();
      return (response.data.data.posts ?? response.data.data) as BlogPost[];
    },
  });
}

export function useAdminTestimonialsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.testimonials(),
    queryFn: async () => (await getTestimonials()).data.data as Testimonial[],
  });
}

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: adminQueryKeys.profile(),
    queryFn: async () => (await getProfile()).data.data as Profile,
  });
}

export function useAdminResumesQuery() {
  return useQuery({
    queryKey: adminQueryKeys.resumes(),
    queryFn: async () => (await getAllResumes()).data.data as Resume[],
  });
}

export function useAdminContentMutations() {
  const queryClient = useQueryClient();

  const invalidate = (key: readonly unknown[]) => queryClient.invalidateQueries({ queryKey: key });

  return {
    createProject: useMutation({
      mutationFn: (payload: Record<string, unknown>) => createProject(payload),
      onSuccess: () => invalidate(adminQueryKeys.projects()),
    }),
    updateProject: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateProject(id, payload),
      onSuccess: () => invalidate(adminQueryKeys.projects()),
    }),
    deleteProject: useMutation({
      mutationFn: (id: string) => deleteProject(id),
      onSuccess: () => invalidate(adminQueryKeys.projects()),
    }),
    deleteAllProjects: useMutation({
      mutationFn: () => deleteAllProjects(),
      onSuccess: () => invalidate(adminQueryKeys.projects()),
    }),
    createService: useMutation({
      mutationFn: (payload: Record<string, unknown>) => createService(payload),
      onSuccess: () => invalidate(adminQueryKeys.services()),
    }),
    updateService: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateService(id, payload),
      onSuccess: () => invalidate(adminQueryKeys.services()),
    }),
    deleteService: useMutation({
      mutationFn: (id: string) => deleteService(id),
      onSuccess: () => invalidate(adminQueryKeys.services()),
    }),
    deleteAllServices: useMutation({
      mutationFn: () => deleteAllServices(),
      onSuccess: () => invalidate(adminQueryKeys.services()),
    }),
    createPost: useMutation({
      mutationFn: (payload: Record<string, unknown>) => createPost(payload),
      onSuccess: () => invalidate(adminQueryKeys.blogPosts()),
    }),
    updatePost: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updatePost(id, payload),
      onSuccess: () => invalidate(adminQueryKeys.blogPosts()),
    }),
    deletePost: useMutation({
      mutationFn: (id: string) => deletePost(id),
      onSuccess: () => invalidate(adminQueryKeys.blogPosts()),
    }),
    deleteAllPosts: useMutation({
      mutationFn: () => deleteAllPosts(),
      onSuccess: () => invalidate(adminQueryKeys.blogPosts()),
    }),
    createTestimonial: useMutation({
      mutationFn: (payload: Record<string, unknown>) => createTestimonial(payload),
      onSuccess: () => invalidate(adminQueryKeys.testimonials()),
    }),
    updateTestimonial: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateTestimonial(id, payload),
      onSuccess: () => invalidate(adminQueryKeys.testimonials()),
    }),
    deleteTestimonial: useMutation({
      mutationFn: (id: string) => deleteTestimonial(id),
      onSuccess: () => invalidate(adminQueryKeys.testimonials()),
    }),
    deleteAllTestimonials: useMutation({
      mutationFn: () => deleteAllTestimonials(),
      onSuccess: () => invalidate(adminQueryKeys.testimonials()),
    }),
    updateProfile: useMutation({
      mutationFn: (payload: Record<string, unknown>) => updateProfile(payload),
      onSuccess: () => invalidate(adminQueryKeys.profile()),
    }),
    uploadResume: useMutation({
      mutationFn: (formData: FormData) => uploadResume(formData),
      onSuccess: () => invalidate(adminQueryKeys.resumes()),
    }),
    activateResume: useMutation({
      mutationFn: (id: string) => activateResume(id),
      onSuccess: () => invalidate(adminQueryKeys.resumes()),
    }),
    deleteResume: useMutation({
      mutationFn: (id: string) => deleteResume(id),
      onSuccess: () => invalidate(adminQueryKeys.resumes()),
    }),
  };
}
