# In Progress

This document tracks tasks that are currently being worked on. Move a task here from `upcoming.md` or `planned.md` when you start it, and move it to `completed.md` when it is done.

---

## How to use this file

1. Pick a task from `upcoming.md` or `planned.md`
2. Copy it here and fill in the **Started** date and **Branch** name
3. Use the **Notes** section to track decisions, blockers, and sub-steps as you work
4. When done, move the full entry to `completed.md` with the final commit hash and summary

---

## Task: TanStack Query across all three apps

**Status:** Not started
**Source:** `planned.md` → Task 1
**Branch:** `feat/tanstack-query`
**Started:** —
**Commit:** —

### Goal

Replace the repetitive `useState + useEffect + loading` patterns across `apps/public`, `apps/admin`, and `apps/customer` with `@tanstack/react-query`. Adds frontend caching, background refetching, and consistent loading/error state without any backend changes.

### Sub-tasks

- [ ] Install `@tanstack/react-query` in all three apps
- [ ] Add `QueryClientProvider` in each app entrypoint (`main.tsx`)
- [ ] `apps/public` — convert:
  - [ ] Profile fetch
  - [ ] Services fetch
  - [ ] Projects fetch
  - [ ] Blog list + single post
  - [ ] Testimonials fetch
  - [ ] Theme fetch
- [ ] `apps/admin` — convert:
  - [ ] Analytics summary, blogs, projects, visitors
  - [ ] Inquiries list
  - [ ] Payments list + analytics
  - [ ] Notifications
  - [ ] Customers list
  - [ ] Blog manager
  - [ ] Projects manager
  - [ ] Services manager
  - [ ] Testimonials manager
- [ ] `apps/customer` — convert:
  - [ ] Payments list
  - [ ] Profile
  - [ ] Notifications
  - [ ] Messages
- [ ] Add `useMutation` + `invalidateQueries` for all create/update/delete actions
- [ ] Remove all replaced `useState + useEffect` fetch patterns

### Notes

- Use `queryKey` naming convention: `['profile']`, `['projects']`, `['blog', slug]`, etc.
- Default `staleTime: 30_000` (30s) — backend cache is the source of truth for longer TTLs
- Wrap each app in a single `QueryClientProvider` at the root, not per-page
- Do not remove React Context — it handles auth/theme state, not server state

---

<!-- Add more active tasks below -->
