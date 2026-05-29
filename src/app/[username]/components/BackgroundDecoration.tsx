export default function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
      <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent opacity-5 blur-[120px] animate-pulse-slow" />
      <div
        className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-success opacity-5 blur-[120px] animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
}
