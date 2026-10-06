import React, { useRef } from "react";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/** Pulls its child a few px toward the cursor; springs back on leave. */
const Magnetic: React.FC<MagneticProps> = ({ children, className = "", strength = 8 }) => {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${(x / r.width) * strength}px, ${(y / r.height) * strength}px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0,0)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transition: "transform 0.35s var(--ease-spring)" }}
    >
      {children}
    </div>
  );
};

export default Magnetic;
