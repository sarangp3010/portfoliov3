# In Progress

This document tracks tasks that are currently being worked on. Move a task here from `upcoming.md` or `planned.md` when you start it, and move it to `completed.md` when it is done.

---

## How to use this file

1. Pick a task from `upcoming.md` or `planned.md`
2. Copy it here and fill in the **Started** date and **Branch** name
3. Use the **Notes** section to track decisions, blockers, and sub-steps as you work
4. When done, move the full entry to `completed.md` with the final commit hash and summary

---

## Task: CRM-style inquiry pipeline

**Status:** Complete — pending commit
**Source:** `planned.md` → Task 6
**Branch:** `main`
**Started:** 2026-07-02
**Commit:** —

### What was done

- Added `InquiryStage` enum (`NEW | QUALIFIED | PROPOSAL_SENT | WON | LOST`) to Prisma schema
- Added `stage` and `stageUpdatedAt` fields to `Inquiry` model
- Added `InquiryStageHistory` model (tracks every stage transition with optional note)
- Migration: `20260703025221_add_inquiry_pipeline`
- New backend endpoint: `PATCH /admin/inquiries/:id/stage`
- Updated `getInquiries` to accept `stage` query param for filtering
- Updated cache key to include stage filter
- New frontend mutation hook: `useUpdateInquiryStageMutation`
- Updated `Inquiry` type + `InquiryStage` type export
- Updated `getInquiries` API call to pass stage param
- Updated query key factory to include stage
- Rewrote `InquiriesManager.tsx`:
  - Pipeline summary row (5 clickable cards, one per stage, with count)
  - Stage filter tabs (click a card to filter by stage)
  - Stage column in the table with colored dropdown selector
  - Stage selector in the detail modal alongside status
  - `stageUpdatedAt` shown in modal when set
