export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-card-bg" />
          <div className="h-9 w-24 animate-pulse rounded bg-card-bg" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Profile skeleton */}
        <div className="rounded-lg border border-card-border bg-card-bg p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="h-32 w-32 animate-pulse rounded-full bg-background" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-48 animate-pulse rounded bg-background" />
              <div className="h-5 w-64 animate-pulse rounded bg-background" />
              <div className="h-4 w-40 animate-pulse rounded bg-background" />
              <div className="mt-4 flex gap-6">
                <div className="h-4 w-24 animate-pulse rounded bg-background" />
                <div className="h-4 w-24 animate-pulse rounded bg-background" />
                <div className="h-4 w-24 animate-pulse rounded bg-background" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-card-border bg-card-bg p-6"
            >
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-background" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-background" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-background" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-background" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
