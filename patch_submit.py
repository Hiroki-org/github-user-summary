import subprocess
import os

branch_name = "fix/remove-commented-code"
commit_message = "chore: remove commented out code in cardSettings.test.ts"
title = "🧹 Remove commented-out code in cardSettings test"
description = """🎯 **What:** Removed commented out code `// Remove window from global object to simulate SSR environment` in `src/lib/__tests__/cardSettings.test.ts`.
💡 **Why:** Commented out codes generally serve no purpose and pollute codebase.
✅ **Verification:** Ran test suite to ensure tests still pass.
✨ **Result:** Cleaner codebase without dead code comments."""

subprocess.run(["git", "push", "origin", branch_name])
subprocess.run(["gh", "pr", "create", "--title", title, "--body", description, "--head", branch_name])
