export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-card-border bg-card-bg p-8 text-center">
        <div className="mb-4 text-5xl">🔍</div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          User Not Found
        </h2>
        <p className="mb-6 text-sm text-muted">
          The GitHub user you&apos;re looking for doesn&apos;t exist. Please check the
          username and try again.
        </p>
        <a
          href="/"
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
