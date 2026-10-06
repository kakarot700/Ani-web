import React, { useEffect, useRef, useState } from "react";

const INTERACTIVE =
  'a[href], button:not([disabled]), input, select, textarea, [role="button"], label, [data-cursor]';

/**
 * A reactive dot + ring cursor for fine-pointer devices.
 * - Ring lerps behind the dot for a sense of weight.
 * - Grows over interactive elements, contracts on press.
 * - Hands back the native cursor over the video player, where the
 *   embedded iframe can't host our cursor.
 */
const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);
  const [native, setNative] = useState(false);
  const [visible, setVisible] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    setEnabled(true);
    document.documentElement.classList.add("cc-on");

    let raf = 0;
    const loop = () => {
      // lerp the ring toward the pointer
      ring.current.x += (pos.current.x - ring.current.x) * 0.16;
      ring.current.y += (pos.current.y - ring.current.y) * 0.16;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
      const target = e.target as HTMLElement;
      setHovering(!!target.closest?.(INTERACTIVE));
      setNative(!!target.closest?.("[data-native-cursor]"));
    };
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cc-on", "cc-native");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  // reflect the native-cursor hand-off on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("cc-native", native && enabled);
  }, [native, enabled]);

  if (!enabled) return null;

  const hidden = !visible || native;

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{ opacity: hidden ? 0 : 1 }}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={`cursor-ring ${hovering ? "is-hover" : ""} ${down ? "is-down" : ""}`}
        style={{ opacity: hidden ? 0 : 1 }}
        aria-hidden="true"
      />
    </>
  );
};

export default CustomCursor;
