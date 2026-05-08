export function ActionButtons({
  handleCopy,
  handleDownload,
  previewUrl,
  copyStatus,
}: {
  handleCopy: () => void;
  handleDownload: () => void;
  previewUrl: string | null;
  copyStatus: "idle" | "copied" | "error";
}) {
  return (
    <div className="mt-6 flex flex-wrap justify-end gap-4">
      <button
        type="button"
        onClick={handleCopy}
        disabled={!previewUrl}
        className="inline-flex items-center gap-2 rounded-md border border-card-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/5 disabled:opacity-50"
      >
        {copyStatus === "copied" ? (
          <>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy Image
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleDownload}
        disabled={!previewUrl}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        Download PNG
      </button>
    </div>
  );
}
