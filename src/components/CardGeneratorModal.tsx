
"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { toPng, toBlob } from "html-to-image";
import type { UserSummary, CardLayout, CardBlockId } from "@/lib/types";
import BusinessCard from "./BusinessCard";
import {
  cloneDefaultCardLayout,
  normalizeCardLayout,
  toggleBlockVisibility,
  LAYOUT_STORAGE_KEY,
} from "@/lib/cardLayout";
import { DEFAULT_DISPLAY_OPTIONS, type CardDisplayOptions } from "@/lib/cardSettings";
import LayoutEditor from "./LayoutEditor";
import { logger } from "@/lib/logger";

interface CardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: UserSummary;
}

const MAIN_BLOCKS: { id: CardBlockId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "contributions", label: "Contributions" },
  { id: "heatmap", label: "Activity Heatmap" },
  { id: "interests", label: "Interests" },
  { id: "repos", label: "Popular Repos" },
  { id: "skills", label: "Skills" },
];

const DETAIL_OPTIONS: { key: keyof CardDisplayOptions; label: string }[] = [
  { key: "showAvatar", label: "Avatar" },
  { key: "showBio", label: "Bio" },
  { key: "showStats", label: "Stats" },
  { key: "showLocation", label: "Location" },
  { key: "showJoinedDate", label: "Joined Date" },
  { key: "showTopics", label: "Topics" },
  { key: "showLanguage", label: "Languages" },
];

function useCardSettings(mounted: boolean) {
  const [isLayoutHydrated, setIsLayoutHydrated] = useState(false);
  const [layout, setLayout] = useState<CardLayout>(cloneDefaultCardLayout());
  const [displayOptions, setDisplayOptions] = useState<CardDisplayOptions>(
    DEFAULT_DISPLAY_OPTIONS,
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }

    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setLayout(normalizeCardLayout(parsed));
      } else {
        setLayout(cloneDefaultCardLayout());
      }
    } catch {
      setLayout(cloneDefaultCardLayout());
    } finally {
      setIsLayoutHydrated(true);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isLayoutHydrated) {
      return;
    }

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Ignore storage write failures (private mode, quota exceeded, etc.)
    }
  }, [layout, mounted, isLayoutHydrated]);

  const toggleMainBlockVisibility = useCallback((blockId: CardBlockId) => {
    setLayout((prev) => toggleBlockVisibility(prev, blockId));
  }, []);

  const toggleDisplayOption = useCallback((key: keyof CardDisplayOptions) => {
    setDisplayOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isBlockVisible = useCallback((blockId: CardBlockId): boolean => {
    return (
      layout.blocks.find((block) => block.id === blockId)?.visible ?? false
    );
  }, [layout.blocks]);

  return {
    layout,
    setLayout,
    displayOptions,
    setDisplayOptions,
    toggleMainBlockVisibility,
    toggleDisplayOption,
    isBlockVisible,
  };
}

function useCardPreview(
  isOpen: boolean,
  cardRef: React.RefObject<HTMLDivElement | null>,
  summary: UserSummary,
  layout: CardLayout,
  displayOptions: CardDisplayOptions
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    const target = cardRef.current;
    const rect = target.getBoundingClientRect();
    const width = Math.max(
      1,
      Math.round(rect.width || target.scrollWidth || target.clientWidth),
    );
    const height = Math.max(
      1,
      Math.round(rect.height || target.scrollHeight || target.clientHeight),
    );
    try {
      const dataUrl = await toPng(target, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: "#0d1117",
      });
      return { dataUrl, width, height };
    } catch (err) {
      logger.error("Failed to generate image", err);
      return null;
    }
  }, [cardRef]);

  useEffect(() => {
    if (isOpen && !previewUrl) {
      let isCancelled = false;
      setIsGenerating(true);

      const generate = async () => {
        try {
          await document.fonts.ready;
          const image = await generateImage();
          if (!isCancelled) {
            setPreviewUrl(image?.dataUrl ?? null);
            setPreviewSize(
              image ? { width: image.width, height: image.height } : null,
            );
          }
        } catch {
          if (!isCancelled) {
            setPreviewUrl(null);
            setPreviewSize(null);
          }
        } finally {
          if (!isCancelled) {
            setIsGenerating(false);
          }
        }
      };

      let rafId: number;
      const timer = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          generate();
        });
      }, 100);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [isOpen, previewUrl, generateImage]);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setPreviewSize(null);
    }
  }, [layout, displayOptions, isOpen]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `${summary.profile?.login || "github"}-summary-card.png`;
    link.href = previewUrl;
    link.click();
  }, [summary.profile?.login, previewUrl]);

  const handleCopy = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setCopyStatus("idle");
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#0d1117",
      });
      if (!blob) throw new Error("Failed to create blob");

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      logger.error("Failed to copy", err);
      setCopyStatus("error");
    }
  }, [cardRef]);

  return {
    isGenerating,
    previewUrl,
    previewSize,
    setPreviewUrl,
    setPreviewSize,
    copyStatus,
    handleDownload,
    handleCopy,
  };
}

function SettingsTab({
  isBlockVisible,
  toggleMainBlockVisibility,
  displayOptions,
  toggleDisplayOption,
}: {
  isBlockVisible: (id: CardBlockId) => boolean;
  toggleMainBlockVisibility: (id: CardBlockId) => void;
  displayOptions: CardDisplayOptions;
  toggleDisplayOption: (key: keyof CardDisplayOptions) => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-card-border/50 bg-card-bg/50 p-4 md:grid-cols-3">
      {MAIN_BLOCKS.map(({ id, label }) => (
        <label
          key={id}
          className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <input
            type="checkbox"
            checked={isBlockVisible(id)}
            onChange={() => toggleMainBlockVisibility(id)}
            className="rounded border-card-border bg-background text-accent focus:ring-accent"
          />
          {label}
        </label>
      ))}

      {DETAIL_OPTIONS.map(({ key, label }) => (
        <label
          key={key as string}
          className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <input
            type="checkbox"
            checked={displayOptions[key] ?? false}
            onChange={() => toggleDisplayOption(key)}
            className="rounded border-card-border bg-background text-accent focus:ring-accent"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function ActionButtons({
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

export default function CardGeneratorModal({
  isOpen,
  onClose,
  summary,
}: CardGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "layout">("settings");
  const [mounted, setMounted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const {
    layout,
    setLayout,
    displayOptions,
    toggleMainBlockVisibility,
    toggleDisplayOption,
    isBlockVisible,
  } = useCardSettings(mounted);

  const {
    isGenerating,
    previewUrl,
    previewSize,
    setPreviewUrl,
    setPreviewSize,
    copyStatus,
    handleDownload,
    handleCopy,
  } = useCardPreview(isOpen, cardRef, summary, layout, displayOptions);

  const handleClose = useCallback(() => {
    onClose();
    setPreviewUrl(null);
    setPreviewSize(null);
  }, [onClose, setPreviewSize, setPreviewUrl]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      if (modalRef.current) {
        modalRef.current.focus();
      }

      const handleKeyDown = (e: globalThis.KeyboardEvent) => {
        if (e.key === "Escape") {
          handleClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, handleClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
            e.preventDefault();
            handleClose();
          }
        }}
      >
        <div
          ref={modalRef}
          className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-card-border bg-card-bg p-6 shadow-2xl focus:outline-none"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Profile Card
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Close"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${activeTab === "settings" ? "bg-accent text-white" : "bg-background text-muted hover:text-foreground"}`}
            >
              Display Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("layout")}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${activeTab === "layout" ? "bg-accent text-white" : "bg-background text-muted hover:text-foreground"}`}
            >
              Edit Layout
            </button>
          </div>

          {activeTab === "settings" && (
            <SettingsTab
              isBlockVisible={isBlockVisible}
              toggleMainBlockVisibility={toggleMainBlockVisibility}
              displayOptions={displayOptions}
              toggleDisplayOption={toggleDisplayOption}
            />
          )}

          {activeTab === "layout" && (
            <div className="mb-4 rounded-lg border border-card-border/50 bg-card-bg/50 p-4">
              <LayoutEditor
                layout={layout}
                onLayoutChange={setLayout}
                onToggleBlockVisibility={toggleMainBlockVisibility}
              />
            </div>
          )}

          <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-auto rounded-lg border border-dashed border-card-border bg-[#0d1117]/50 p-4">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                <p className="text-muted">Generating preview...</p>
              </div>
            ) : previewUrl ? (
              <Image
                src={previewUrl}
                alt="Card Preview"
                width={previewSize?.width ?? 1200}
                height={previewSize?.height ?? 630}
                className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
              />
            ) : (
              <p className="text-danger">Failed to generate preview.</p>
            )}
          </div>

          <ActionButtons
            handleCopy={handleCopy}
            handleDownload={handleDownload}
            previewUrl={previewUrl}
            copyStatus={copyStatus}
          />
        </div>
      </div>

      <div className="fixed left-[-9999px] top-[-9999px] overflow-hidden">
        <div className="block">
          <BusinessCard
            ref={cardRef}
            summary={summary}
            layout={layout}
            options={displayOptions}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}
