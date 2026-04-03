"use client";

import { useState, useCallback, useEffect, type RefObject } from "react";
import { toPng, toBlob } from "html-to-image";
import { logger } from "@/lib/logger";

interface UseCardImageGeneratorProps {
  cardRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  layout: unknown;
  displayOptions: unknown;
  username: string;
}

export function useCardImageGenerator({
  cardRef,
  isOpen,
  layout,
  displayOptions,
  username,
}: UseCardImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        backgroundColor: "#0d1117",
      });
      return dataUrl;
    } catch {
      logger.error("Failed to generate image");
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
          const url = await generateImage();
          if (!isCancelled) {
            setPreviewUrl(url);
          }
        } catch {
          if (!isCancelled) {
            setPreviewUrl(null);
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
    }
  }, [layout, displayOptions, isOpen]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `${username || "github"}-summary-card.png`;
    link.href = previewUrl;
    link.click();
  }, [username, previewUrl]);

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
    } catch {
      logger.error("Failed to copy");
      setCopyStatus("error");
    }
  }, [cardRef]);

  return {
    isGenerating,
    previewUrl,
    setPreviewUrl,
    copyStatus,
    handleDownload,
    handleCopy,
  };
}
