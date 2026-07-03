import { useMemo } from 'react';
import { usePageSectionsQuery } from './queries/usePublicQueries';

export interface SectionStyle {
  primaryColor?: string;
  bgColor?: string;
  textColor?: string;
  gradient?: string;
  spacing?: 'compact' | 'normal' | 'spacious';
}

export interface SectionAnimation {
  type?: 'none' | 'fade' | 'slide' | 'scale' | 'blur';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
  trigger?: 'load' | 'scroll' | 'hover';
}

export interface PageSection {
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
  style: SectionStyle;
  animation: SectionAnimation;
  variant: string;
  mobileHide: boolean;
  desktopHide: boolean;
  isVisible: boolean;
  order: number;
}

export function useSections(page: string) {
  const { data, isLoading } = usePageSectionsQuery(page);
  const sections = data ?? [];
  const sectionsByKey = useMemo(() => new Map(sections.map(section => [section.key, section])), [sections]);

  return {
    sections,
    loading: isLoading,
    getSection: (key: string) => sectionsByKey.get(key),
  };
}
