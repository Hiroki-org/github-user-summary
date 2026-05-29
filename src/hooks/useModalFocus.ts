import { useEffect, useRef } from "react";

export function useModalFocus(
  isOpen: boolean,
  modalRef: React.RefObject<HTMLElement | null>,
  onClose: () => void
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect((): void => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect((): (() => void) | void => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      if (modalRef.current) {
        modalRef.current.focus();
      }

      const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
        if (e.key === "Escape") {
          onCloseRef.current();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return (): void => {
        document.removeEventListener("keydown", handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen]);
}
