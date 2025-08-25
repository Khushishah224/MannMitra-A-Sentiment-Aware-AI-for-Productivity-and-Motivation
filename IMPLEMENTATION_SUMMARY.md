# MannMitra: Current Implementation Summary (Aug 2025)

## Technology Stack (Runtime & Libraries)
| Layer | Technologies |
|-------|-------------|
| Frontend | React + Vite, Tailwind CSS, Framer Motion, Recharts, Axios, React Hot Toast |
| Backend API | FastAPI, Pydantic, Uvicorn |
| Auth & Security | JWT (python-jose), bcrypt, HttpOnly cookie support |
| Data | MongoDB (with in‑memory fallback) |
| NLP / Emotion | HuggingFace transformer (`cardiffnlp/twitter-roberta-base-emotion`), TextBlob fallback, lightweight rule tweaks |
| Decision AI | scikit-fuzzy (fuzzy inference system) with heuristic fallback |
| Scheduling & Time | Custom conflict detection & chain shifting utilities, background async rescheduler loop |
| Visualization | Recharts for mood trends & planner insights |
| State / Preferences | React Context, Local Storage persistence |
| Tooling | dotenv, LRU caching (model), react-icons |

## Feature Inventory & Technology Mapping
Total core user-facing features implemented: **18**

| # | Feature | Technologies / Modules | How It Works |
|---|---------|-----------------------|--------------|
| 1 | User Authentication | FastAPI auth router, JWT, bcrypt | Login issues token (header + HttpOnly cookie). Protected routes read either location. |
| 2 | Multi-language UI (EN/HI/GU) | React contexts, `strings.js` | Language preference stored in user profile & applied to labels, planner, decision helper. |
| 3 | Mood / Emotion Analysis | HuggingFace RoBERTa model, TextBlob fallback | `/moods/analyze` routes text; model outputs emotion logits → mapped to internal moods; fallback ensures availability. |
| 4 | Empathetic Response Layer | Mood templates, backend sentiment module | Template selection keyed by normalized mood, returned with analysis response. |
| 5 | Motivational Quotes | `quote` route, JSON dataset, response picker util | Picks mood + language appropriate quote with fallback chain. |
| 6 | Personalized Plan Preview | `/suggestions/personalized-plan` route | Validates and normalizes start time; returns a non-persisted plan preview flagged `preview: true`. |
| 7 | Plan Creation & CRUD | `/plans` routes, Pydantic Plan model | Create only after Accept; standard REST endpoints manage lifecycle. |
| 8 | Custom Subjects CRUD | `/user-subjects` routes + SubjectSelector + CustomSubjectForm | Merges default + user subjects; immediate refresh after create. |
| 9 | Planner Task Board UI | `PlannerPage.jsx`, `TaskList.jsx`, Framer Motion | Responsive cards, animated mount/unmount, inline edit, filter panels. |
|10 | Status & Time Conflict Management | time conflict utils (`timeConflicts`), backend validation | Detects overlap; offers chain shift or next free slot suggestion (client + backend). |
|11 | Snooze & Reminder Lead | `/plans/{id}/snooze`, reminder_lead_minutes | Snooze shifts scheduled_time; reminder loop (30s) triggers toast + Notification. |
|12 | Auto-Rescheduler | FastAPI startup async loop in `main.py` | Every 5 min: finds past-due pending/snoozed tasks, shrinks duration, repositions, resolves conflicts iteratively. |
|13 | Auto-Reschedule Conflict Resolution | Loop + conflict scan & adjustment | Iteratively increments start until no overlap; sets `auto_rescheduled` + `conflict_resolved`. |
|14 | Task Chain Shift on Creation Conflict | computeChainShifts + applyChainShifts utilities | On 409, user opts to push blocking task(s); cascade shift durations and persist via updatePlan. |
|15 | Mood History & Chart | `/history` (when authed), Recharts component | Fetches moods; chart with gradient line + pagination for entries (History page). |
|16 | Decision Helper (Fuzzy Logic) | `/decision` route, scikit-fuzzy system | Membership functions (time_pressure, fatigue, importance) + rules → defuzzify decision; fallback heuristics if library absent. |
|17 | Browser Notifications | Web Notifications API, toast | Permission requested once; timer checks scheduled/lead window to emit local & system alerts. |
|18 | Responsive & Modern UI Layer | Tailwind, Framer Motion, grid/flex layouts | Horizontal expansion (sidebar planner), animated forms, consistent glass & gradient badges. |

> Note: Feature count groups closely related sub-capabilities (e.g., chain shift & conflict detection under management) distinctly where they required separate algorithmic logic.

## Neural Networks vs Fuzzy Logic
We **use a pre-trained transformer (deep neural network)** for emotion detection but **do not train or deploy a custom ANN in this repository**. The Decision Helper instead leverages **fuzzy logic** (linguistic membership + rule base + defuzzification) for explainable choices between two options.

High-level fuzzy pipeline:
1. Extract numeric factors from free-text context (regex & keyword heuristics).
2. Map factors into membership functions (low/medium/high) for time_pressure, fatigue, task_importance.
3. Apply rule set (e.g., high time_pressure & high importance ⇒ option1).
4. Aggregate consequents and defuzzify to numeric decision score (0–10).
5. Translate score to recommendation + confidence; compute per-option %; generate explanation + actionable advice.
6. Fallback: heuristic weighted scoring when scikit-fuzzy not installed.

## Implementation Timeline Summary
*Sprint 2* introduced auto-rescheduling, snooze, conflict management. *Sprint 3* added empathetic layer & improved sentiment fidelity. *Sprint 4* integrated the fuzzy Decision Helper with explanatory outputs.

## What the product is now (hybrid assistant)
- Guided, deterministic flow (Mood → Quote → Category/Subject/Duration → Plan) with a light, chat-like feel.
- A compact conversational layer wraps the steps without introducing LLM complexity or cost.
- Empathetic responses tailored to user's emotional state (Sprint 3).
- Auto-rescheduling of missed tasks with conflict resolution (Sprint 2).

## Backend

1) Models and contracts
- Suggestions: `SuggestionRequest` now accepts optional `start_time` as either time or "HH:MM[:SS]" string (validator added). 
- Plans: `scheduled_time` normalized to HH:MM string in DB and API responses.
- Moods: extended `MoodType` and JSON body support for `/moods/analyze`.

2) Routes
- `/moods/analyze`: consumes JSON { text, language }, returns `MoodResponse`.
- `/suggestions`: returns a formatted suggestion with subject/duration interpolation.
- `/suggestions/personalized-plan`: returns a PREVIEW of a plan (no DB write). It safely parses `start_time`, normalizes to HH:MM, and returns `{ plan: {..}, response_text, preview: true }`. The UI persists the plan only after user accepts.
- `/suggestions/categories/{category}`: merges defaults with user-specific subjects.
- `/user-subjects`: full CRUD to manage personal subjects per category.
- `/quote`: returns language-aware quote with graceful defaulting.

3) Plans CRUD and actions
- PlanStatus extended with `snoozed` and `missed`.
- Plan schema supports `reminder_lead_minutes` to trigger reminders before `scheduled_time`.
- New actions:
	- `POST /plans/{id}/snooze?minutes=N` bumps `scheduled_time` forward by N minutes and sets status to `snoozed`.
	- `POST /plans/{id}/reminder?lead_minutes=M` stores a per-task reminder lead time.

4) Data and DB layer
5) Auth
- JWT remains stateless; in addition to Authorization: Bearer header, login now also sets an HttpOnly cookie `access_token`. `/auth/me` reads token from header or cookie; logout clears the cookie. No token table is required.
- Default data seeded for quotes, suggestions, and subjects.
- User subjects persisted (Mongo) with in-memory fallback; helper combines defaults + user subjects.

## Frontend

1) Single API client
- Consolidated axios client with token interceptor and unified error handling. All API modules import from `src/api/index.js`.

2) Assistant flow (MoodSuggestionInput + AssistantChat)
- Step 1 analyze: normalizes response (mood or mood_type) and stores neutral fallback. Tracks mood history.
- Step 2 quote: requests `/quote?mood={mood}`; falls back to a default line if empty.
- Step 3 choose: category chips; SubjectSelector shows defaults immediately, user subjects merged when available; duration select; optional start time picker.
- Step 4 finalize: the suggestion step yields only a preview; the plan is created via `/plans/` after the user clicks Accept, fixing accidental creation when user clicks Change.

3) Subjects UX
- Subject chips with "+ Add custom". New subject creation persists via `/user-subjects/`; after add, SubjectSelector refreshes its list so the new item appears immediately. 
- If unauthenticated (401/403), the added subject is kept locally with a sign-in hint.

4) Planner
- Task list cards display status, category, duration, and scheduled_time badge.
- Quick actions: Start, Complete, Reschedule (inline time edit), Snooze (+1m, +5m, +10m, +30m, +1h). Snooze calls backend and updates `scheduled_time`. A lightweight reminder loop checks every 30s; fires toast/notification at the `scheduled_time` or at `reminder_lead_minutes`.

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
- Snooze enhancements: Backend endpoint, UI quick snooze options, consistent updates and toasts.
- Plan created before Accept: `/suggestions/personalized-plan` now returns a preview, and creation happens only on Accept.
- `/auth/me` 401 with cookie-based auth: backend now reads JWT from header or HttpOnly cookie; login sets cookie, logout clears it.

## Current workflow
1. User enters mood → analyze (backend) → mood badge + quote.
2. Picks category subject/duration → optional start time → server returns plan preview.
3. User clicks Accept → plan is created and visible in Planner; user can start, complete, snooze, or reschedule inline.
4. History page displays recent moods; chart shows last 30 entries when signed in.

## Known gaps and cleanup
- Some legacy models/fields are broader than needed (e.g., SuggestionBase.suggestions). Safe to keep; mark for later cleanup.
- Minimal tests pending: add unit tests for suggestions and personalized-plan, and a smoke test for the 4-step flow.
- Consider adding DB indexes for plans.user_id and moods.user_id, created_at.

## Sprint 2 Enhancements (Completed)
- **Auto-Rescheduler**: System automatically reschedules missed tasks
  - Tasks that are past due are moved forward by ~1 hour
  - Duration is reduced to 75% of original for easier completion
  - Conflict detection prevents overlap with existing tasks
  - Users receive notifications when tasks are auto-rescheduled
  - UI displays badge for auto-rescheduled tasks
- **Mood-Aware Lighter Suggestions**: 
  - For low-energy moods, suggestions are adapted to be lighter and more manageable
  - Duration of suggested tasks is reduced to match user's energy level
- **Time Conflict Management**: 
  - System detects when tasks would overlap in time
  - Provides options to reschedule either the existing task or the new one
  - Conflict resolution ensures a realistic schedule

## Sprint 3 - Empathy Layer (Implemented)
- **Enhanced Sentiment Analysis**: 
  - Replaced basic TextBlob analysis with HuggingFace model
  - Integrated `cardiffnlp/twitter-roberta-base-emotion` for more accurate emotion detection
  - Implemented graceful fallback to TextBlob if HuggingFace model is unavailable
  - Used LRU caching to optimize model loading performance
- **Response Templates by Mood**:
  - Implemented mood-specific response templates:
    - Stressed → "reset tone" responses
    - Happy → motivational responses
    - Sad → gentle nudge responses
    - Other moods → appropriate supportive responses
  - Added empathetic_response field to MoodResponse model
- **Frontend Empathetic Display**:
  - Enhanced AssistantChat to display empathetic line along with plans
  - Improved user experience with emotionally intelligent responses
  
## Sprint 4 - Decision Helper AI (Implemented)
- **Backend Decision Helper**:
  - Created `/decision` endpoint accepting `{option1, option2, context, mood}`
  - Implemented fuzzy logic system for decision making using scikit-fuzzy
  - Built expert system rules to handle different contexts
  - Optimized for graceful degradation when dependencies are unavailable
- **Advanced Decision Factors**:
  - Exam proximity → study bias (time-sensitive tasks prioritized)
  - Fatigue level → rest bias but with time-boxing
  - Context analysis for task importance and priority
- **Frontend Decision Helper**:
  - Created DecisionHelper component and dedicated page
  - Added interactive UI with option comparison visualization
  - Implemented confidence score and factor breakdown
  - Provided practical advice tailored to decision context
- **Multi-language Support**:
  - Extended all decision helper UI elements to support Hindi and Gujarati

## Suggested Future Enhancements
- Reminder settings per plan: custom lead time (e.g., 5m before).
- Streaks and best-time-of-day insights (correlate completions by hour).
- Planner views: Today/Upcoming/Completed, sort by time.
- Small gamification: daily goals and streak badges.
- Offline subject persistence and sync on sign-in.

This document reflects the codebase state on branch `khushi` after Sprint 2 implementation with bug fixes.

## Future Technical Opportunities (Extended)
| Area | Opportunity | Rationale |
|------|-------------|-----------|
| Scheduling | Priority queues + calendar-like view | Better visualization for dense task sets |
| AI | Lightweight on-device embedding for personalization | Enhance mood-to-plan mapping without server call |
| Decision Helper | Add linguistic hedging & rationale scoring | Improve trust & explainability |
| Testing | Add unit & integration tests (planner, decision) | Reliability & regression safety |
| Observability | Structured logging + metrics for auto-rescheduler | Diagnose scheduling drift |
