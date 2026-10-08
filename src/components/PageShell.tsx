import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { LabelPill } from "./ui";

/**
 * Standard page chrome: floating navbar, a centred max-width column,
 * and a quiet header (eyebrow pill → tight display title → subtitle).
 * Keeps every secondary page composed the same way.
 */
const PageShell: React.FC<{
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** narrow reading column (library pages) or wide grid (browse) */
  width?: "narrow" | "wide";
  footer?: boolean;
}> = ({ eyebrow, title, subtitle, action, children, width = "wide", footer = true }) => (
  <>
    <Navbar />
    <main
      className={`mx-auto w-full px-4 pb-24 pt-28 md:px-6 ${
        width === "wide" ? "max-w-[1400px]" : "max-w-[1080px]"
      }`}
    >
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5 pt-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-3">
              <LabelPill>{eyebrow}</LabelPill>
            </div>
          )}
          <h1 className="text-[34px] font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-[44px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-white/60">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </main>
    {footer && <Footer />}
  </>
);

export default PageShell;
