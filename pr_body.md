🎯 **What:** The code health issue addressed
Replaced the plain `<img>` element in `src/components/CardGenerator.tsx` with Next.js's `<Image />` component, which is the recommended way to handle images in Next.js applications, resolving an `@next/next/no-img-element` ESLint bypass.

💡 **Why:** How this improves maintainability
The usage of `<Image />` component is a Next.js standard best practice that usually provides automatic optimizations. Although this particular instance requires `unoptimized` because it relies on a local dynamically generated data URL from `html-to-image`, using the uniform standard throughout the application helps remove linting suppression rules, keeping code clean and maintaining consistent components across the codebase.

✅ **Verification:** How you confirmed the change is safe
Ran the lint check (`npm run lint`), which no longer produces the ESLint warning on `CardGenerator.tsx`. Also ran the full unit test suite (`npm run test`) which executed 100 tests with no failures, verifying that we didn't break anything.

✨ **Result:** The improvement achieved
A clean resolution to the `@next/next/no-img-element` linting rule in `CardGenerator.tsx` by upgrading it to use the standard `<Image />` element from `next/image`.
