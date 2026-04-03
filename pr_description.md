🧹 [Code Health] Fix suppressed image lint warning in BusinessCard

🎯 **What:** Replaced the raw HTML `<img>` tag in `src/components/BusinessCard.tsx` with the Next.js `<Image>` component, thereby fixing the `@next/next/no-img-element` lint warning and removing the need for an explicit suppression comment (`/* eslint-disable-next-line ... */`).

💡 **Why:** This change improves code health and maintainability by adhering to Next.js best practices without relying on lint suppression. By supplying the `unoptimized` flag to the Next.js `Image` component, we bypass the Next.js Image Optimization API (which could cause issues with arbitrary external `avatar_url`s or `html-to-image` rendering logic) while still satisfying the Next.js framework's ESLint constraints natively.

✅ **Verification:**
- Evaluated and tested Next.js `<Image unoptimized>` property behavior.
- Executed `npm run lint` and confirmed that `src/components/BusinessCard.tsx` generates no errors or warnings.
- Executed `npm run test -- --run` to verify that all 218 tests across the test suite still pass cleanly and no new regressions were introduced.

✨ **Result:** A cleaner component implementation conforming to Next.js standards, eliminating the need for hardcoded eslint suppression rules.
