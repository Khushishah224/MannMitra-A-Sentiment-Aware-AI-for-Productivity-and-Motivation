# MannMitra: Current Implementation Summary (Aug 2025)

## What the product is now (hybrid assistant)
- Guided, deterministic flow (Mood → Quote → Category/Subject/Duration → Plan) with a light, chat-like feel.
- A compact conversational layer wraps the steps without introducing LLM complexity or cost.

## Backend

1) Models and contracts
- Suggestions: `SuggestionRequest` now accepts optional `start_time` as either time or "HH:MM[:SS]" string (validator added). 
- Plans: `scheduled_time` normalized to HH:MM string in DB and API responses.
- Moods: extended `MoodType` and JSON body support for `/moods/analyze`.

2) Routes
- `/moods/analyze`: consumes JSON { text, language }, returns `MoodResponse`.
- `/suggestions`: returns a formatted suggestion with subject/duration interpolation.
- `/suggestions/personalized-plan`: creates a plan; safely parses `start_time`, stores HH:MM, and returns the created `plan` with `response_text`.
- `/suggestions/categories/{category}`: merges defaults with user-specific subjects.
- `/user-subjects`: full CRUD to manage personal subjects per category.
- `/quote`: returns language-aware quote with graceful defaulting.

3) Data and DB layer
- Default data seeded for quotes, suggestions, and subjects.
- User subjects persisted (Mongo) with in-memory fallback; helper combines defaults + user subjects.

## Frontend

1) Single API client
- Consolidated axios client with token interceptor and unified error handling. All API modules import from `src/api/index.js`.

2) Assistant flow (MoodSuggestionInput + AssistantChat)
- Step 1 analyze: normalizes response (mood or mood_type) and stores neutral fallback. Tracks mood history.
- Step 2 quote: requests `/quote?mood={mood}`; falls back to a default line if empty.
- Step 3 choose: category chips; SubjectSelector shows defaults immediately, user subjects merged when available; duration select; optional start time picker.
- Step 4 finalize: server creates plan; assistant shows `response_text` and avoids duplicate scheduling prompts.

3) Subjects UX
- Subject chips with "+ Add custom". New subject creation persists via `/user-subjects/`; after add, SubjectSelector refreshes its list so the new item appears immediately. 
- If unauthenticated (401/403), the added subject is kept locally with a sign-in hint.

4) Planner
- Task list cards display status, category, duration, and scheduled_time badge.
- Quick actions: Start, Complete, Reschedule (inline time edit), Snooze (10m, +30m, +1h). Snooze updates `scheduled_time` and a lightweight reminder loop checks every 30 seconds; when the time hits, a toast and (if permitted) a browser notification fire.

5) History & insights
- Mood chart (Recharts) on History page, using server data when signed in; local history fallback when not.
- Subtle hint shows when logged out: "Sign in to unlock your mood history chart."

6) i18n and polish
- Centralized key strings; localized key Planner labels and assistant buttons, including Snooze/Reschedule.
- Loading skeletons for quotes/subjects.

## Fixed issues (notable)
- 422 on `/suggestions/personalized-plan` due to `start_time` type: fixed via validator + HH:MM normalization.
- `mood=undefined` on `/quote`: frontend normalizes to `mood || mood_type || 'neutral'` before requesting.
- Empty "Your Motivation": added safe defaults when quote lookup fails.
- Custom subjects not appearing after create: SubjectSelector now refreshes list post-add (or caches locally if unauthenticated).
- Snooze “does nothing”: Snooze updates `scheduled_time` and reminder loop triggers a toast/notification when the minute matches.

## Current workflow
1. User enters mood → analyze (backend) → mood badge + quote.
2. Picks category subject/duration → optional start time → server creates plan.
3. Planner shows the new task with scheduled time; user can start, complete, snooze, or reschedule inline.
4. History page displays recent moods; chart shows last 30 entries when signed in.

## Known gaps and cleanup
- Some legacy models/fields are broader than needed (e.g., SuggestionBase.suggestions). Safe to keep; mark for later cleanup.
- Minimal tests pending: add unit tests for suggestions and personalized-plan, and a smoke test for the 4-step flow.
- Consider adding DB indexes for plans.user_id and moods.user_id, created_at.

## Suggested enhancements
- Reminder settings per plan: custom lead time (e.g., 5m before).
- Streaks and best-time-of-day insights (correlate completions by hour).
- Planner views: Today/Upcoming/Completed, sort by time.
- Small gamification: daily goals and streak badges.
- Offline subject persistence and sync on sign-in.

This document reflects the codebase state on branch `khushi` after the latest fixes and UX enhancements.
