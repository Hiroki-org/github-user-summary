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
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        showCopiedFeedback();
      } catch (err) {
        logger.error("Failed to copy", err);
      }
    } else {
      logger.error("Failed to copy", new Error("Clipboard API not available"));
    }
  }, [showCopiedFeedback]);

  return { copied, copyToClipboard };
}
