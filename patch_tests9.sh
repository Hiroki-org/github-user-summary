#!/bin/bash
# Fix TypeScript error where `slowPromise as unknown as string` is invalid for a mockReturnValue that expects a Promise or we just use mockImplementation or mockReturnValue(slowPromise as any) which was causing lint issue but TS was happy.
# The `toPng` returns a Promise<string>. So mockReturnValue(slowPromise) should be valid without casting if we correctly type slowPromise.

sed -i 's/let resolveImage: (value: unknown) => void;/let resolveImage: (value: string) => void;/g' src/components/__tests__/CardGeneratorModal.test.tsx
sed -i 's/const slowPromise = new Promise((resolve) => {/const slowPromise = new Promise<string>((resolve) => {/g' src/components/__tests__/CardGeneratorModal.test.tsx
sed -i 's/vi.mocked(toPng).mockReturnValue(slowPromise as unknown as string);/vi.mocked(toPng).mockReturnValue(slowPromise as unknown as Promise<string>);/g' src/components/__tests__/CardGeneratorModal.test.tsx

npx tsc --noEmit
