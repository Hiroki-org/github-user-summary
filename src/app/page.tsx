import LoginButton from "@/components/LoginButton";
import SearchForm from "@/components/SearchForm";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-card-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            GitHub User Summary
          </h1>
          <LoginButton />
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-4xl font-bold text-foreground">
            GitHub User Summary
          </h2>
          <p className="text-lg text-muted">
            Explore any GitHub user&apos;s profile, skills, and contributions at
            a glance.
          </p>
        </div>

        <SearchForm />

        <p className="mt-6 text-sm text-muted">
          Sign in with GitHub to see contribution graphs and more detailed data.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border px-6 py-4 text-center text-sm text-muted">
        Built with Next.js &amp; GitHub API
      </footer>
    </div>
  );
}
