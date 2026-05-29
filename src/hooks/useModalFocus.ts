import { useEffect, useRef } from "react";

export function useModalFocus(
  isOpen: boolean,
  modalRef: React.RefObject<HTMLElement | null>,
  onClose: () => void
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      if (modalRef.current) {
        modalRef.current.focus();
      }

      const handleKeyDown = (e: globalThis.KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
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
  }, [isOpen, onClose, modalRef]);
}
