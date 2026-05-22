import { renderHook } from "@testing-library/react";
import { useModalFocus } from "../useModalFocus";
import { expect, test, vi, describe, afterEach, beforeEach } from "vitest";

describe("useModalFocus", () => {
  let modalRef: React.RefObject<HTMLElement | null>;
  let onClose: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    modalRef = { current: document.createElement("div") };
    onClose = vi.fn();
    addEventListenerSpy = vi.spyOn(document, "addEventListener");
    removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("focuses modalRef when isOpen is true", () => {
    const focusSpy = vi.spyOn(modalRef.current!, "focus");
    renderHook(() => useModalFocus(true, modalRef, onClose));
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  test("does not focus modalRef when isOpen is false", () => {
    const focusSpy = vi.spyOn(modalRef.current!, "focus");
    renderHook(() => useModalFocus(false, modalRef, onClose));
    expect(focusSpy).not.toHaveBeenCalled();
  });

  test("adds and removes keydown event listener based on isOpen", () => {
    const { unmount, rerender } = renderHook(
      ({ isOpen }) => useModalFocus(isOpen, modalRef, onClose),
      { initialProps: { isOpen: true } }
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  test("calls onClose when Escape key is pressed", () => {
    renderHook(() => useModalFocus(true, modalRef, onClose));

    const eventListenerCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "keydown"
    );
    const handler = eventListenerCall![1] as EventListener;

    handler(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    handler(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onClose).toHaveBeenCalledTimes(1); // Should not increase
  });
});
