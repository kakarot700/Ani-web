import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab focus inside `containerRef` while `active`, focuses the first
 * focusable element on open, and restores focus to the opener on close.
 */
export default function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    restoreRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // focus the first focusable (or the container itself)
    const first = container.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? container).focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === firstNode || current === container)) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && current === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return containerRef;
}
