"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { UserSummary, CardBlockId } from "@/lib/types";
import BusinessCard from "./BusinessCard";
import type { CardDisplayOptions } from "@/lib/cardSettings";
import LayoutEditor from "./LayoutEditor";
import ModalHeader from "./CardGeneratorModalParts/ModalHeader";
import ModalSettingsTab from "./CardGeneratorModalParts/ModalSettingsTab";
import ModalActions from "./CardGeneratorModalParts/ModalActions";
import { useCardImageGenerator } from "@/hooks/useCardImageGenerator";
import { useCardSettings } from "@/hooks/useCardSettings";

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
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMounted(true);
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
    setPreviewUrl,
    copyStatus,
    handleDownload,
    handleCopy,
  } = useCardImageGenerator({
    cardRef,
    isOpen,
    layout,
    displayOptions,
    username: summary.profile?.login || "github",
  });

  const handleClose = useCallback(() => {
    onClose();
    setPreviewUrl(null);
  }, [onClose, setPreviewUrl]);

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
          <ModalHeader onClose={handleClose} />

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
            <ModalSettingsTab
              MAIN_BLOCKS={MAIN_BLOCKS}
              DETAIL_OPTIONS={DETAIL_OPTIONS}
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
                width={1200}
                height={900}
                className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
              />
            ) : (
              <p className="text-danger">Failed to generate preview.</p>
            )}
          </div>

          <ModalActions
            previewUrl={previewUrl}
            copyStatus={copyStatus}
            handleCopy={handleCopy}
            handleDownload={handleDownload}
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
