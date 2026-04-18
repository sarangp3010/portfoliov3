/**
 * useSections.ts
 * Fetches page sections from the API, falls back to empty array on error.
 * Caches per page so navigating back doesn't re-fetch.
 */
import { useState, useEffect, useRef } from 'react';
import { getPageSections } from '../api';

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

// Simple in-memory cache across navigations
const cache: Record<string, PageSection[]> = {};

export function useSections(page: string) {
  const [sections, setSections] = useState<PageSection[]>(cache[page] ?? []);
  const [loading, setLoading]   = useState(!cache[page]);
  const fetched = useRef(!!cache[page]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    getPageSections(page)
      .then(r => {
        const data = r.data.data as PageSection[];
        cache[page] = data;
        setSections(data);
      })
      .catch(() => { /* use empty fallback — Home renders its own defaults */ })
      .finally(() => setLoading(false));
  }, [page]);

  const getSection = (key: string) => sections.find(s => s.key === key);

  return { sections, loading, getSection };
}
