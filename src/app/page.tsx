import SearchForm from "@/components/SearchForm";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent opacity-10 blur-[100px] animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-success opacity-5 blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-3xl text-center space-y-8 animate-slide-up">
          <div className="space-y-4">
            <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter">
              <span className="text-gradient">Unlock Your</span> <br/>
              <span className="text-gradient-accent">GitHub Profile</span>
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
              Explore user profiles, visualize contributions, and analyze coding habits with a beautiful, data-driven summary.
            </p>
          </div>

          <div className="w-full max-w-md mx-auto p-1 scale-100 hover:scale-[1.02] transition-transform duration-300">
            <SearchForm />
          </div>

          <p className="text-sm text-muted animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Sign in with GitHub to access detailed insights and contribution graphs.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border/50 bg-background/50 backdrop-blur-sm px-6 py-8 text-center text-sm text-muted">
        <p>Built with Next.js &amp; GitHub API</p>
      </footer>
    </div>
  );
}
