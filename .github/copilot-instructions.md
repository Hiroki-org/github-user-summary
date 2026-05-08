---
description: "GitHub User Summary – Next.js 16 app for visual GitHub profile summaries, dashboard analytics, and shareable cards powered by GitHub OAuth and GitHub APIs."
applyTo: "**"
---

# GitHub User Summary – Copilot Instructions

**GitHub User Summary** is a single-app Next.js 16 codebase that visualizes GitHub profiles, contribution history, language usage, and repository activity. It supports public profile pages, authenticated personal dashboards, and shareable business-card-style images generated from GitHub data.

This repository is **not** a monorepo. There is no separate backend service. Server-side logic lives inside Next.js App Router routes under `src/app/api`.

---

## Part 1: Project-Specific Context

### Quick Reference

| Component         | Tech                                            | Location                                                           |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| App shell         | Next.js 16 App Router, React 19, Tailwind CSS 4 | `src/app`                                                          |
| Auth              | NextAuth.js + GitHub OAuth                      | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`       |
| GitHub data layer | GitHub REST + GraphQL APIs                      | `src/lib/github.ts`, `src/lib/githubViewer.ts`                     |
| Dashboard APIs    | Next.js route handlers + SWR clients            | `src/app/api/dashboard/*`, `src/hooks/useDashboardData.ts`         |
| Shareable cards   | `@vercel/og`, `satori`, image rendering         | `src/app/api/card/[username]/route.ts`, `src/lib/cardRenderer.tsx` |
| Tests             | Vitest                                          | `src/lib/__tests__`, `src/app/api/**/*.test.ts`                    |
| CI                | GitHub Actions                                  | `.github/workflows/ci.yml`                                         |

### Getting Started

#### Environment Setup

Create `.env.local` in the repo root:

```env
GITHUB_CLIENT_ID=<your-github-oauth-app-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-app-client-secret>
NEXTAUTH_SECRET=<long-random-secret>

# Optional but recommended for higher GitHub API limits and card generation
GITHUB_TOKEN=<github-personal-access-token>
```

#### Core Commands

```bash
# Local development
npm run dev

# Validation
npm run lint
npm test
npx tsc --noEmit
npm run build
```

### Architecture & Key Concepts

#### App Structure

```text
src/
├── app/          App Router pages, layouts, and API routes
├── components/   UI components and dashboard/profile cards
├── hooks/        SWR-based client hooks for dashboard data
└── lib/          Auth, GitHub API clients, rendering, validation, types
```

#### Public Profile Pages

- Dynamic route: `src/app/[username]/page.tsx`
- Fetches GitHub summary data on the server via `fetchUserSummary()`
- Uses `getServerSession(authOptions)` so authenticated viewers can unlock GitHub GraphQL-backed data where a token is available
- Renders profile, skills, contributions, repos, interests, activity, sharing controls, and theme customization

#### Authentication Flow

1. User signs in with GitHub through NextAuth.
2. `src/lib/auth.ts` stores the GitHub access token and login in JWT/session callbacks.
3. Client components consume session state via `SessionProvider` in `src/app/providers.tsx`.
4. Authenticated dashboard routes use `getServerSession(authOptions)` and require a valid access token.

#### GitHub API Integration

Main logic lives in `src/lib/github.ts`.

- Prefer GraphQL when a token is available and it materially improves data quality.
- Preserve REST fallbacks for unauthenticated or degraded paths.
- Keep rate-limit handling intact. The code already maps 403 responses to `RateLimitError`.
- Do not remove partial-failure tolerance from `fetchUserSummary()`-style flows without a strong reason.

#### Dashboard

- UI routes live under `src/app/dashboard/*`
- Data routes live under `src/app/api/dashboard/*`
- Client fetching lives in `src/hooks/useDashboardData.ts` using SWR
- Dashboard behavior depends on authenticated session state and the GitHub login derived from the session token

#### Shareable Card/Image Generation

- Card endpoint: `src/app/api/card/[username]/route.ts`
- Renderer: `src/lib/cardRenderer.tsx`
- Data source: `src/lib/cardDataFetcher.ts`
- The card route runs on the edge runtime and sets explicit cache headers
- Query params control format, theme, layout, blocks, visibility, and width

If you change card parameters or rendering behavior, update tests accordingly.

### Code Conventions

#### Naming & Organization

- Use the `@/` path alias for imports from `src`
- `src/components/*` uses component-oriented files, typically PascalCase file names
- `src/lib/*` uses utility-oriented camelCase file names
- Route handlers live in `route.ts` or `route.tsx`
- Keep shared types in `src/lib/types.ts` when they span multiple modules

#### Next.js Patterns

- Default to server components
- Add `"use client"` only when the component needs browser APIs, local state, `useSession`, SWR, drag-and-drop, or DOM access
- Keep server-only logic in `src/lib/*` or route handlers, not in client components

#### API Route Behavior

- JSON routes should return `NextResponse.json({ error: "..." }, { status })` on failure
- Image routes should preserve cache headers and predictable fallback behavior
- Dashboard API routes should return `401` for unauthenticated access

#### GitHub Fetching Rules

- Preserve timeout handling in `src/lib/cardDataFetcher.ts`
- Keep `User-Agent: github-user-summary`
- Use `encodeURIComponent(username)` when constructing GitHub API paths
- Be careful with GitHub API quotas; avoid unnecessary extra requests

### Testing Requirements

#### Testing Is Mandatory

Do not treat tests as optional in this repository.

- If you change behavior, add or update tests
- If you touch parsing, validation, aggregation, auth-dependent routes, or cache behavior, there should usually be a corresponding test change
- If you choose not to add a test, explain why in the PR description

#### Actual Test Stack

This repo currently uses **Vitest**.

- Unit tests live mainly in `src/lib/__tests__/*.test.ts`
- Route tests can live next to route handlers, for example `src/app/api/card/[username]/route.test.ts`
- There is currently **no Playwright E2E suite** in this repository
- Do not invent or reference nonexistent E2E coverage

#### Important Test Patterns

When testing server-only modules such as `src/lib/github.ts`:

- Mock `server-only` before importing the module
- Mock global `fetch` with `vi.stubGlobal()` or an equivalent approach
- Assert both success and failure paths, especially 404, 401, 403, 500, timeout, and fallback behavior where relevant

When testing route handlers:

- Verify status codes
- Verify JSON error payloads for JSON endpoints
- Verify cache headers for image/card endpoints

### Useful Paths & Entry Points

| Purpose                 | Path                                      |
| ----------------------- | ----------------------------------------- |
| Root layout             | `src/app/layout.tsx`                      |
| Public profile page     | `src/app/[username]/page.tsx`             |
| Dashboard overview page | `src/app/dashboard/page.tsx`              |
| NextAuth config         | `src/lib/auth.ts`                         |
| NextAuth route          | `src/app/api/auth/[...nextauth]/route.ts` |
| Dashboard summary route | `src/app/api/dashboard/summary/route.ts`  |
| Card image route        | `src/app/api/card/[username]/route.ts`    |
| Card renderer           | `src/lib/cardRenderer.tsx`                |
| GitHub summary fetchers | `src/lib/github.ts`                       |
| Dashboard SWR hooks     | `src/hooks/useDashboardData.ts`           |
| Core unit tests         | `src/lib/__tests__/*.test.ts`             |
| Route tests             | `src/app/api/**/*.test.ts`                |
| CI workflow             | `.github/workflows/ci.yml`                |

### Common Tasks

#### Add a New Dashboard API Route

1. Add a route handler under `src/app/api/dashboard/.../route.ts`
2. Check `getServerSession(authOptions)` if auth is required
3. Return `401` for unauthenticated requests
4. Keep response shape explicit and typed
5. Add a test if behavior is non-trivial

#### Change GitHub Summary Logic

1. Update `src/lib/github.ts` or the relevant helper
2. Preserve rate-limit and not-found behavior
3. Keep authenticated GraphQL paths and unauthenticated fallbacks aligned
4. Update unit tests in `src/lib/__tests__/`

#### Change Card Rendering

1. Update `src/lib/cardRenderer.tsx` and/or `src/lib/cardDataFetcher.ts`
2. Preserve cache behavior in `src/app/api/card/[username]/route.ts`
3. Update route tests and renderer/query parsing tests

---

## Part 2: General Agent Workflow Playbooks

> REFERENCE-ONLY: Do not adopt this section into `main` unless it is explicitly approved as repository policy.

This half is intentionally more general than the project-specific section above.

- Keep the repo-specific facts in Part 1 grounded in this repository.
- Keep reusable PR/CI/review playbooks in Part 2.
- If you are iterating on generic workflow wording in a reference-only PR, mark that PR clearly and **do not merge it into `main`** until you intentionally decide to adopt the wording as repo policy.

### Starting New Work

1. Create a branch from `main`

   ```bash
   git switch -c <type>/<short-description>
   ```

2. Implement the change
3. Add or update tests when behavior changed
4. Run validation
5. Commit and push
6. Open a PR
7. Stay with the PR until checks finish or failures are fixed

### Branch and PR Discipline

- Never commit directly to `main`
- Never stop at `git push`
- Opening the PR is not the end of the task
- The task includes watching CI, fixing failures, and responding to review comments

### Validation Before Push

Before pushing any non-trivial change, run:

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

This exact validation sequence matters. Do not stop after only one or two commands.

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

### CI Check Loop

After opening the PR, you must keep checking GitHub checks. The default pattern in this repo should be explicit re-checks with `sleep` and `gh`.

Any new push resets this process. After **every** push, treat prior CI state as stale, then restart the check loop from the latest commit.

For follow-up pushes to an existing PR, the default mental model is:

```bash
git push && sleep 300 && gh pr checks "$PR_URL"
```

That shorthand means "push, wait, then verify the latest PR state." Do not treat `git push` alone as completion.

Use this pattern repeatedly:

```bash
gh pr checks "$PR_URL"
sleep 300 && gh pr checks "$PR_URL"
sleep 300 && gh pr checks "$PR_URL"
```

If checks are still running, keep going. If checks fail, investigate immediately and push a fix. Do not assume someone else will watch CI later.

Do not stop after the first green snapshot if you just pushed. A fresh push can still produce a later failure, and it can also attract new bot or human review comments after CI restarts.

`gh pr checks "$PR_URL" --watch` is useful, but the baseline expectation is still the explicit `sleep 300 && gh pr checks "$PR_URL"` re-check pattern because it works well for long-running CI and makes the agent verify completion instead of guessing.

If your terminal tooling launches long-running commands through an async exec session, do not fire-and-forget the `sleep 300 && gh pr checks "$PR_URL"` command. Keep the same session alive and poll it until it exits so the agent actually waits for the delayed check to finish.

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

### Responding to PR Reviews

#### PR Review 対応の基本原則

PR を作成しただけで作業を完了と見なさないでください。

- review comments、review threads、CI checks を必ず確認してください。
- 指摘内容を分類し、必要に応じて修正を行ってください。
- 修正後は commit / push を行い、CI が完了するまで待機・確認してください。
- 対応した review comment / thread には必ず返信を投稿してください。
- 解決済みの thread についてのみ、resolve 処理を行ってください。

#### gh CLI / GitHub API / GraphQL の利用ルール

PR 関連の操作を開始する前に、必ず以下を実行して認証状態を確認してください。

- `gh --version` および `gh auth status` を確認する。
- `gh auth status` が失敗した場合は、修正作業には進まず、認証エラーとして処理を停止してください。

情報の取得と操作には以下のツールを使用します。

- PR 情報、review comments、CI checks の確認には `gh` CLI を使用する。
- review thread の一覧取得と resolve 処理には GitHub GraphQL を使用する。
- conversation の resolve は必ず GraphQL の `resolveReviewThread` mutation を用いて行う。

#### 禁止事項

以下の行為は固く禁じられています。

- 通常のコメントで "Resolve conversation" 等とテキスト投稿し、resolve 処理の代用とすること。
- review の dismiss と conversation の resolve を混同すること。review の dismiss は明示的な指示があった場合のみ実行してください。
- 指示されていない対象外の PR を勝手に操作・検証すること。
- 明示的な指示がない限り、PR の close、branch の delete、merge を行うこと。
- 実行結果の証跡を伴わずに「完了」と報告すること。

#### 最終報告フォーマット

PR 対応が完了した際、またはエラーで停止した際は、必ず以下のフォーマットで最終報告を行ってください。

```markdown
- 対象 PR URL:
- gh version:
- gh auth status の結果:
- 取得した review thread 数:
- resolve 前の unresolved thread 数:
- resolve 後の unresolved thread 数:
- 返信したコメント URL:
- resolve した thread ID 一覧:
- 実行した test / lint / typecheck コマンドと結果:
- CI checks の結果:
- できなかったこと:
- どこで止まったか:
```

Suggested review workflow:

```bash
gh pr view <PR#> --json reviews
gh pr checks "$PR_URL"
```

After pushing a review fix:

```bash
git push && sleep 300 && gh pr checks "$PR_URL"
```

Keep the `&&` guard, or use an equivalent conditional form. Do not rewrite this as two unconditional lines.

Then fetch review state again. A review-fix push can trigger fresh CI, fresh bot comments, or follow-up human review.

### PR Consolidation Playbook

Use this when several open PRs are materially overlapping and should be reviewed as one destination PR instead of being merged independently.

#### Choose the Destination PR First

- Pick one surviving destination PR and branch for each cluster of similar work
- Prefer the branch that already has the clearest scope or the strongest base implementation
- Treat every other similar PR in that cluster as a source PR that will be superseded

#### Consolidation Sequence

1. Switch to the destination branch
2. Merge `origin/main` into the destination branch first
3. Merge each source PR branch into the destination branch
4. Resolve conflicts explicitly; do not silently discard behavior, tests, or review fixes
5. Remove junk files that do not belong in the final PR, such as ad hoc logs, temp files, or PR drafting artifacts
6. Re-run validation as needed and push the destination branch

#### Review Handling During Consolidation

- Inspect review threads on both the destination PR and the source PRs being absorbed
- Carry forward valid feedback into the destination branch, even if it was originally posted on a source PR
- After applying those changes, reply on the destination PR and resolve the relevant threads
- If the destination branch receives a new push during this work, restart the wait-check-review cycle from that latest push

#### Destination PR Hygiene

Rewrite the surviving destination PR so it clearly reads as a consolidated PR.

- Update the title to make the consolidation explicit
- Update the PR body to list the absorbed PRs
- Call out conflict resolution and review-feedback incorporation in the body
- Make the surviving PR the single place where reviewers should look going forward

#### Superseded PR Hygiene

For every absorbed source PR:

- Leave a comment that it is superseded by the destination PR
- Link the destination PR in that comment
- Close the superseded PR after commenting

Do not leave overlapping PRs open without explanation once the destination PR is ready.

#### Post-Push Rule Still Applies

Consolidation does **not** weaken the CI/review loop. Once a destination-branch push has completed, immediately do the same post-push verification:

```bash
sleep 300 && gh pr checks "$PR_URL"
```

Then:

- Fetch review state again
- Verify unresolved threads again
- Verify the latest checks again

A consolidated PR is not done until the **latest** destination-branch push has gone through that full loop.

### Final Checklist

- Project-specific reasoning stayed in Part 1
- Reusable workflow guidance stayed in Part 2
- The latest pushed commit has been re-checked after CI completed
- Review state has been fetched again after the latest push
- For consolidation work, source PRs were commented and closed, and the destination PR became the single active review target
