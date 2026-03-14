---
description: "GitHub User Summary – Next.js 16 app for visual GitHub profile summaries, dashboard analytics, and shareable cards powered by GitHub OAuth and GitHub APIs."
applyTo: "**"
---

# GitHub User Summary – Copilot Instructions

**GitHub User Summary** is a single-app Next.js 16 codebase that visualizes GitHub profiles, contribution history, language usage, and repository activity. It supports public profile pages, authenticated personal dashboards, and shareable business-card-style images generated from GitHub data.

This repository is **not** a monorepo. There is no separate backend service. Server-side logic lives inside Next.js App Router routes under `src/app/api`.

## Quick Reference

| Component | Tech | Location |
| --- | --- | --- |
| App shell | Next.js 16 App Router, React 19, Tailwind CSS 4 | `src/app` |
| Auth | NextAuth.js + GitHub OAuth | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| GitHub data layer | GitHub REST + GraphQL APIs | `src/lib/github.ts`, `src/lib/githubViewer.ts` |
| Dashboard APIs | Next.js route handlers + SWR clients | `src/app/api/dashboard/*`, `src/hooks/useDashboardData.ts` |
| Shareable cards | `@vercel/og`, `satori`, image rendering | `src/app/api/card/[username]/route.ts`, `src/lib/cardRenderer.tsx` |
| Tests | Vitest | `src/lib/__tests__`, `src/app/api/**/*.test.ts` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

---

## Getting Started

### Environment Setup

Create `.env.local` in the repo root:

```env
GITHUB_CLIENT_ID=<your-github-oauth-app-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-app-client-secret>
NEXTAUTH_SECRET=<long-random-secret>

# Optional but recommended for higher GitHub API limits and card generation
GITHUB_TOKEN=<github-personal-access-token>
```

### Core Commands

```bash
# Local development
npm run dev

# Validation
npm run lint
npm test
npm run test:watch
npm run test:coverage
npx tsc --noEmit
npm run build
```

### CI Expectations

GitHub Actions runs four checks on PRs:

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

Do not claim a change is ready until you have considered all four.

---

## Architecture & Key Concepts

### App Structure

```text
src/
├── app/          App Router pages, layouts, and API routes
├── components/   UI components and dashboard/profile cards
├── hooks/        SWR-based client hooks for dashboard data
└── lib/          Auth, GitHub API clients, rendering, validation, types
```

### Public Profile Pages

- Dynamic route: `src/app/[username]/page.tsx`
- Fetches GitHub summary data on the server via `fetchUserSummary()`
- Uses `getServerSession(authOptions)` so authenticated viewers can unlock GitHub GraphQL-backed data where a token is available
- Renders profile, skills, contributions, repos, interests, activity, sharing controls, and theme customization

### Authentication Flow

1. User signs in with GitHub through NextAuth.
2. `src/lib/auth.ts` stores the GitHub access token and login in JWT/session callbacks.
3. Client components consume session state via `SessionProvider` in `src/app/providers.tsx`.
4. Authenticated dashboard routes use `getServerSession(authOptions)` and require a valid access token.

### GitHub API Integration

Main logic lives in `src/lib/github.ts`.

- Prefer GraphQL when a token is available and it materially improves data quality.
- Preserve REST fallbacks for unauthenticated or degraded paths.
- Keep rate-limit handling intact. The code already maps 403 responses to `RateLimitError`.
- Do not remove partial-failure tolerance from `fetchUserSummary()`-style flows without a strong reason.

### Dashboard

- UI routes live under `src/app/dashboard/*`
- Data routes live under `src/app/api/dashboard/*`
- Client fetching lives in `src/hooks/useDashboardData.ts` using SWR
- Dashboard behavior depends on authenticated session state and the GitHub login derived from the session token

### Shareable Card/Image Generation

- Card endpoint: `src/app/api/card/[username]/route.ts`
- Renderer: `src/lib/cardRenderer.tsx`
- Data source: `src/lib/cardDataFetcher.ts`
- The card route runs on the edge runtime and sets explicit cache headers
- Query params control format, theme, layout, blocks, visibility, and width

If you change card parameters or rendering behavior, update tests accordingly.

---

## Code Conventions

### Naming & Organization

- Use the `@/` path alias for imports from `src`
- `src/components/*` uses component-oriented files, typically PascalCase file names
- `src/lib/*` uses utility-oriented camelCase file names
- Route handlers live in `route.ts` or `route.tsx`
- Keep shared types in `src/lib/types.ts` when they span multiple modules

### Next.js Patterns

- Default to server components
- Add `"use client"` only when the component needs browser APIs, local state, `useSession`, SWR, drag-and-drop, or DOM access
- Keep server-only logic in `src/lib/*` or route handlers, not in client components

### API Route Behavior

- JSON routes should return `NextResponse.json({ error: "..." }, { status })` on failure
- Image routes should preserve cache headers and predictable fallback behavior
- Dashboard API routes should return `401` for unauthenticated access

### GitHub Fetching Rules

- Preserve timeout handling in `src/lib/cardDataFetcher.ts`
- Keep `User-Agent: github-user-summary`
- Use `encodeURIComponent(username)` when constructing GitHub API paths
- Be careful with GitHub API quotas; avoid unnecessary extra requests

---

## Testing Requirements

### Testing Is Mandatory

Do not treat tests as optional in this repository.

- If you change behavior, add or update tests
- If you touch parsing, validation, aggregation, auth-dependent routes, or cache behavior, there should usually be a corresponding test change
- If you choose not to add a test, explain why in the PR description

### Actual Test Stack

This repo currently uses **Vitest**.

- Unit tests live mainly in `src/lib/__tests__/*.test.ts`
- Route tests can live next to route handlers, for example `src/app/api/card/[username]/route.test.ts`
- There is currently **no Playwright E2E suite** in this repository
- Do not invent or reference nonexistent E2E coverage

### Important Test Patterns

When testing server-only modules such as `src/lib/github.ts`:

- Mock `server-only` before importing the module
- Mock global `fetch` with `vi.stubGlobal()` or an equivalent approach
- Assert both success and failure paths, especially 404, 401, 403, 500, timeout, and fallback behavior where relevant

When testing route handlers:

- Verify status codes
- Verify JSON error payloads for JSON endpoints
- Verify cache headers for image/card endpoints

### Validation Before Push

Before pushing any non-trivial change, run:

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

This exact validation sequence matters. Do not stop after only one or two commands.

---

## Agent Workflow Guidelines

### Starting New Work

1. Create a branch from `main`

   ```bash
   git switch -c <type>/<short-description>
   ```

2. Implement the change
3. Add or update tests
4. Run full validation
5. Commit and push
6. Open a PR
7. Stay with the PR until checks finish or failures are fixed

### Branch and PR Discipline

- Never commit directly to `main`
- Never stop at `git push`
- Opening the PR is not the end of the task
- The task includes watching CI, fixing failures, and responding to review comments

---

## PR Workflow

### Default PR Sequence

```bash
git switch -c <type>/<short-description>

# make changes

npm run lint
npm test
npx tsc --noEmit
npm run build

git add .
git commit -m "<clear message>"
git push --set-upstream origin <type>/<short-description>
PR_URL=$(gh pr create --fill)
gh pr checks "$PR_URL"
```

### CI Check Loop: Use It Aggressively

After opening the PR, you must keep checking GitHub checks. The default pattern in this repo should be explicit re-checks with `sleep` and `gh`.

Use this pattern repeatedly:

```bash
gh pr checks "$PR_URL"
sleep 300 && gh pr checks "$PR_URL"
sleep 300 && gh pr checks "$PR_URL"
```

If checks are still running, keep going. If checks fail, investigate immediately and push a fix. Do not assume someone else will watch CI later.

`gh pr checks "$PR_URL" --watch` is useful, but the baseline expectation is still the explicit `sleep 300 && gh pr checks "$PR_URL"` re-check pattern because it works well for long-running CI and makes the agent verify completion instead of guessing.

### Merge Readiness

Do not merge until all of the following are true:

- All required checks are green
- Any failing checks were investigated and fixed
- Review comments are answered
- Unresolved conversations are handled
- The latest pushed commit has been re-checked after CI completed

This final re-check matters:

```bash
sleep 300 && gh pr checks "$PR_URL"
```

Use it before treating the PR as merge-ready.

---

## Responding to PR Reviews

### Review Handling Rules

For each review thread, do one of the following:

- Apply the requested change, push it, and reply with what changed
- Or explain clearly why the suggestion is being deferred or declined

Do not leave review threads unacknowledged.

### Suggested Review Workflow

```bash
gh pr view <PR#> --json reviews
gh pr checks "$PR_URL"
```

After pushing a review fix:

```bash
sleep 300 && gh pr checks "$PR_URL"
```

If checks are still pending, keep repeating the sleep-and-check cycle until they finish or fail.

### Conversation Checklist

- Every substantive review comment has a reply
- Accepted feedback is reflected in code and tests
- Deferred feedback is explicitly justified
- CI has been re-checked after the latest push

---

## Useful Paths & Entry Points

| Purpose | Path |
| --- | --- |
| Root layout | `src/app/layout.tsx` |
| Public profile page | `src/app/[username]/page.tsx` |
| Dashboard overview page | `src/app/dashboard/page.tsx` |
| NextAuth config | `src/lib/auth.ts` |
| NextAuth route | `src/app/api/auth/[...nextauth]/route.ts` |
| Dashboard summary route | `src/app/api/dashboard/summary/route.ts` |
| Card image route | `src/app/api/card/[username]/route.ts` |
| Card renderer | `src/lib/cardRenderer.tsx` |
| GitHub summary fetchers | `src/lib/github.ts` |
| Dashboard SWR hooks | `src/hooks/useDashboardData.ts` |
| Core unit tests | `src/lib/__tests__/*.test.ts` |
| Route tests | `src/app/api/**/*.test.ts` |
| CI workflow | `.github/workflows/ci.yml` |

---

## Common Tasks

### Add a New Dashboard API Route

1. Add a route handler under `src/app/api/dashboard/.../route.ts`
2. Check `getServerSession(authOptions)` if auth is required
3. Return `401` for unauthenticated requests
4. Keep response shape explicit and typed
5. Add a test if behavior is non-trivial

### Change GitHub Summary Logic

1. Update `src/lib/github.ts` or the relevant helper
2. Preserve rate-limit and not-found behavior
3. Keep authenticated GraphQL paths and unauthenticated fallbacks aligned
4. Update unit tests in `src/lib/__tests__/`

### Change Card Rendering

1. Update `src/lib/cardRenderer.tsx` and/or `src/lib/cardDataFetcher.ts`
2. Preserve cache behavior in `src/app/api/card/[username]/route.ts`
3. Update route tests and renderer/query parsing tests

---

## Notes for Agents

- Always ground your work in the actual project structure above, not generic Next.js assumptions
- This is a Next.js app with internal route handlers, not a split frontend/backend system
- Tests, type checks, build verification, and PR follow-through are part of the job
- The `sleep 300 && gh pr checks "$PR_URL"` loop is not optional busywork; it is the default way to verify CI completion before declaring the PR done
