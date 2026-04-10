import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";

export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showCopiedFeedback = useCallback(() => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), timeout);
  }, [timeout]);

  const copyToClipboard = useCallback(async (text: string) => {
    let clipboardError: unknown = null;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        showCopiedFeedback();
        return;
      } catch (err) {
        clipboardError = err;
      }
    } else {
      clipboardError = new Error("Clipboard API not available");
    }

    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);

    let successful = false;
    let fallbackError: unknown = null;

    try {
      textArea.select();
      successful = document.execCommand("copy");
      if (!successful) {
        fallbackError = new Error("document.execCommand('copy') failed");
      }
    } catch (err) {
      successful = false;
      fallbackError = err;
    } finally {
      document.body.removeChild(textArea);
    }

    if (successful) {
      showCopiedFeedback();
    } else {
      logger.error("Failed to copy", clipboardError, fallbackError);
    }
  }, [showCopiedFeedback]);

  return { copied, copyToClipboard };
}
