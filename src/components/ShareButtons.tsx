"use client";

import { useCallback } from "react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

type Props = {
  username: string;
};

export default function ShareButtons({ username }: Props) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const getShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/${encodeURIComponent(username)}`;
  }, [username]);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(getShareUrl());
  }, [getShareUrl, copyToClipboard]);

  const handleTwitterShare = useCallback(() => {
    const text = `Check out ${username}'s GitHub profile summary!`;
    const url = getShareUrl();
    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }, [username, getShareUrl]);

  return (
    <div className="flex items-center gap-2">
      {/* X / Twitter share */}
      <button
        type="button"
        onClick={handleTwitterShare}
        className="inline-flex items-center gap-1.5 rounded-md border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        aria-label="Share on X"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share
      </button>

      {/* Copy URL */}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        aria-label="Copy profile URL"
      >
        {copied ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy URL
          </>
        )}
      </button>
    </div>
  );
}
