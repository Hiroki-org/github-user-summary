"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { UserSummary } from "@/lib/types";
import BusinessCard from "./BusinessCard";
import LayoutEditor from "./LayoutEditor";
import { SettingsTab } from "./SettingsTab";
import { ActionButtons } from "./ActionButtons";
import { useCardSettings } from "@/hooks/useCardSettings";
import { useCardPreview } from "@/hooks/useCardPreview";
import { useModalFocus } from "@/hooks/useModalFocus";

interface CardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: UserSummary;
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

  useModalFocus(isOpen, modalRef, handleClose);

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
