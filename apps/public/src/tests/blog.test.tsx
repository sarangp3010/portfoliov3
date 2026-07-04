/**
 * src/tests/blog.test.tsx
 * Tests: Blog page — post cards, tag filter, empty state, loading state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Blog from '../pages/public/Blog';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:     ({ children, ...p }: any) => <div {...p}>{children}</div>,
    article: ({ children, ...p }: any) => <article {...p}>{children}</article>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <>{children}</>,
}));

vi.mock('../components/ui/Spinner', () => ({
  PageLoader: () => <div data-testid="page-loader" />,
}));

vi.mock('../hooks/queries/usePublicQueries', () => ({
  usePostsQuery: vi.fn(),
  useTagsQuery:  vi.fn(),
}));

import { usePostsQuery, useTagsQuery } from '../hooks/queries/usePublicQueries';
const mockPostsQuery = usePostsQuery as ReturnType<typeof vi.fn>;
const mockTagsQuery  = useTagsQuery  as ReturnType<typeof vi.fn>;

const POSTS = [
  { id: 'b-1', title: 'React Patterns', slug: 'react-patterns', excerpt: 'A post about React', tags: ['react', 'frontend'], publishedAt: '2026-01-01T00:00:00Z', views: 120, readingTime: 5 },
  { id: 'b-2', title: 'TypeScript Tips', slug: 'typescript-tips', excerpt: 'TS tips and tricks',  tags: ['typescript'],        publishedAt: '2026-01-02T00:00:00Z', views: 80,  readingTime: 3 },
];

function renderBlog(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/blog${search}`]}>
      <Routes>
        <Route path="/blog" element={<Blog />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Blog — loading state', () => {
  it('shows PageLoader while posts are loading', () => {
    mockPostsQuery.mockReturnValue({ data: undefined, isLoading: true });
    mockTagsQuery.mockReturnValue({ data: [], isLoading: false });
    renderBlog();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('shows PageLoader while tags are loading', () => {
    mockPostsQuery.mockReturnValue({ data: { posts: POSTS, total: 2 }, isLoading: false });
    mockTagsQuery.mockReturnValue({ data: [], isLoading: true });
    renderBlog();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });
});

describe('Blog — empty state', () => {
  beforeEach(() => {
    mockPostsQuery.mockReturnValue({ data: { posts: [], total: 0 }, isLoading: false });
    mockTagsQuery.mockReturnValue({ data: [], isLoading: false });
  });

  it('shows empty state message when no posts exist', () => {
    renderBlog();
    expect(screen.getByText(/No articles yet/i)).toBeInTheDocument();
  });

  it('does not render any article elements when posts are empty', () => {
    renderBlog();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
});

describe('Blog — post cards', () => {
  beforeEach(() => {
    mockPostsQuery.mockReturnValue({ data: { posts: POSTS, total: 2 }, isLoading: false });
    mockTagsQuery.mockReturnValue({ data: ['react', 'typescript', 'frontend'], isLoading: false });
  });

  it('renders a card for each post', () => {
    renderBlog();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('renders post titles as links', () => {
    renderBlog();
    expect(screen.getByRole('link', { name: 'React Patterns' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'TypeScript Tips' })).toBeInTheDocument();
  });

  it('renders post excerpts', () => {
    renderBlog();
    expect(screen.getByText('A post about React')).toBeInTheDocument();
    expect(screen.getByText('TS tips and tricks')).toBeInTheDocument();
  });

  it('renders post tags', () => {
    renderBlog();
    expect(screen.getAllByText('react').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('typescript').length).toBeGreaterThanOrEqual(1);
  });

  it('renders reading time and view counts', () => {
    renderBlog();
    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByText('120 views')).toBeInTheDocument();
  });
});

describe('Blog — tag filter', () => {
  beforeEach(() => {
    mockPostsQuery.mockReturnValue({ data: { posts: POSTS, total: 2 }, isLoading: false });
    mockTagsQuery.mockReturnValue({ data: ['react', 'typescript'], isLoading: false });
  });

  it('renders an "All" filter button', () => {
    renderBlog();
    expect(screen.getByRole('button', { name: /^All/i })).toBeInTheDocument();
  });

  it('renders a button for each tag', () => {
    renderBlog();
    expect(screen.getByRole('button', { name: 'react' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'typescript' })).toBeInTheDocument();
  });

  it('calls usePostsQuery with the selected tag after clicking a tag button', async () => {
    renderBlog();
    await userEvent.click(screen.getByRole('button', { name: 'react' }));
    // After click, usePostsQuery should have been called with tag='react'
    const calls = mockPostsQuery.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[1]).toBe('react'); // second arg is the tag
  });

  it('does not render tag section when no tags are returned', () => {
    mockTagsQuery.mockReturnValue({ data: [], isLoading: false });
    renderBlog();
    expect(screen.queryByRole('button', { name: 'react' })).toBeNull();
  });
});
