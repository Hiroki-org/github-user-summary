import { useState, useEffect, useCallback } from "react";
import { toPng, toBlob } from "html-to-image";
import type { UserSummary, CardLayout } from "@/lib/types";
import type { CardDisplayOptions } from "@/lib/cardSettings";
import { logger } from "@/lib/logger";

export function useCardPreview(
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
