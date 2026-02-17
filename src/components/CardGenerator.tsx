"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { toPng, toBlob } from "html-to-image";
import { UserSummary } from "@/lib/types";
import BusinessCard from "./BusinessCard";

type Props = {
  summary: UserSummary;
};

export default function CardGenerator({ summary }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [mounted, setMounted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPreviewUrl(null);
  }, []);

  // 画像生成処理
  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    try {
       const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 1,
          backgroundColor: '#0d1117',
       });
       return dataUrl;
    } catch (err) {
      console.error("Failed to generate image", err);
      return null;
    }
  }, []);

  // モーダルが開いたときにプレビューを生成
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the modal container
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Handle Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen && !previewUrl) {
      let isCancelled = false;
      setIsGenerating(true);

      const generate = async () => {
        try {
          // フォントの読み込みを待つことで、レンダリングの信頼性を高めます。
          await document.fonts.ready;
          const url = await generateImage();
          if (!isCancelled) {
            setPreviewUrl(url);
          }
        } catch (err) {
          console.error("Failed to generate image", err);
          if (!isCancelled) {
            setPreviewUrl(null);
          }
        } finally {
          if (!isCancelled) {
            setIsGenerating(false);
          }
        }
      };

      // わずかな遅延でレンダリングの安定を待ちます。
      const timer = setTimeout(generate, 100);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [isOpen, previewUrl, generateImage]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `${summary.profile?.login || "github"}-summary-card.png`;
    link.href = previewUrl;
    link.click();
  }, [previewUrl, summary.profile?.login]);

  const handleCopy = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setCopyStatus("idle");
      const blob = await toBlob(cardRef.current, { cacheBust: true, backgroundColor: '#0d1117' });
      if (!blob) throw new Error("Failed to create blob");

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
      setCopyStatus("error");
    }
  }, []);

  if (!summary.profile) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-card-border bg-card-bg px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
        Card
      </button>

      {mounted && createPortal(
        isOpen && (
          <>
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
              role="dialog"
              aria-modal="true"
              onClick={handleClose}
            >
              <div
                ref={modalRef}
                className="relative w-full max-w-4xl rounded-xl bg-card-bg border border-card-border p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Profile Card</h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full p-2 text-muted hover:bg-white/10 hover:text-foreground transition-colors"
                    aria-label="Close"
                  >
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center min-h-[300px] overflow-auto bg-[#0d1117]/50 rounded-lg border border-dashed border-card-border p-4">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                      <p className="text-muted">Generating preview...</p>
                    </div>
                  ) : previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Card Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                  ) : (
                    <p className="text-danger">Failed to generate preview.</p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!previewUrl}
                    className="inline-flex items-center gap-2 rounded-md border border-card-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {copyStatus === "copied" ? (
                      <>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy Image
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!previewUrl}
                    className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Download PNG
                  </button>
                </div>
              </div>
            </div>
            {/* Hidden container for rendering the card */}
            <div className="fixed left-[-9999px] top-[-9999px] overflow-hidden">
              {/* Always render but keep hidden offscreen, so it's ready for capture */}
              <div className="block">
                <BusinessCard ref={cardRef} summary={summary} />
              </div>
            </div>
          </>
        ),
        document.body
      )}
    </>
  );
}
