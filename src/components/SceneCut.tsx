import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * An anime "scene cut" — a skewed black + red slash sweeps across the
 * screen whenever the route changes, so navigation feels like a cut
 * between scenes rather than a page swap.
 */
const SceneCut: React.FC = () => {
  const location = useLocation();
  const [cutting, setCutting] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setCutting(true);
    const t = window.setTimeout(() => setCutting(false), 520);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  if (!cutting) return null;

  return (
    <div className="scene-cut" aria-hidden="true">
      <div className="bar-black" />
      <div className="bar-red" />
    </div>
  );
};

export default SceneCut;
