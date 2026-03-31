🧪 [testing improvement] Add comprehensive unit tests for SearchForm component

🎯 **What:** The `SearchForm` component lacked unit tests, leaving critical user interaction (searching for GitHub users) unverified.
📊 **Coverage:** This PR adds `src/components/SearchForm.test.tsx` utilizing `@testing-library/react` and `vitest`. The test suite now covers:
  - Form rendering (input and submit button).
  - State updates when typing in the input.
  - Form submission logic and conditional disabling of the search button for empty inputs.
  - Ensuring whitespace-only submissions are prevented.
  - Verification that the username is trimmed and URI encoded properly before calling `router.push`.
  - Simulating the React `useTransition` loading state where the button becomes disabled and displays "Loading...".
✨ **Result:** Enhanced test coverage and reliability for user search workflows. Improved testing confidence by mocking `next/navigation` and React hooks effectively.
