// ─────────────────────────────────────────────────────────────
//  UI primitives
//
//  The Hark vocabulary, in the order it appears on screen:
//    · glass chrome that floats on the gradient (top bar, pills)
//    · near-white information cards: icon badge → title/meta →
//      right-aligned action, then hairline label/value rows
//    · one black pill per card for the primary act
//    · small uppercase group labels, tabular numerals, green ✓
// ─────────────────────────────────────────────────────────────
import React from "react";
import { BsArrowUp, BsCheckLg, BsMicFill, BsSearch } from "react-icons/bs";
import { cn } from "@/utils/cn";

/* ── icon badge ────────────────────────────────────────────── */
export const IconBadge: React.FC<{
  children: React.ReactNode;
  tone?: "accent" | "ink" | "warm" | "success" | "glass";
  className?: string;
}> = ({ children, tone = "ink", className }) => {
  const tones = {
    accent: "bg-[var(--accent)] text-white",
    ink: "bg-[#16181f] text-white",
    warm: "bg-gradient-to-br from-[#f0a870] to-[#df7f5c] text-white",
    success: "bg-[var(--success)] text-white",
    glass: "glass text-white",
  };
  return <span className={cn("icon-badge", tones[tone], className)}>{children}</span>;
};

/* ── pills ─────────────────────────────────────────────────── */
export const BlackPill: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...rest
}) => (
  <button
    {...rest}
    className={cn(
      "press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#16181f] px-4 py-2",
      "text-[13px] font-semibold text-white transition hover:bg-[#242833] disabled:opacity-40",
      className
    )}
  >
    {children}
  </button>
);

/** quiet ink-fill pill, sized for card headers */
export const LightPill: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...rest
}) => (
  <button
    {...rest}
    className={cn(
      "press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#16181f] px-3.5 py-1.5",
      "text-[12px] font-semibold text-white transition hover:bg-[#242833] disabled:opacity-40",
      className
    )}
  >
    {children}
  </button>
);

/** quiet grey pill, sized for card headers */
export const GhostPill: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...rest
}) => (
  <button
    {...rest}
    className={cn(
      "press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-black/[0.05] px-3.5 py-1.5",
      "text-[12px] font-semibold text-[var(--ink-soft)] transition hover:bg-black/[0.09] hover:text-[var(--ink)]",
      "disabled:opacity-40",
      className
    )}
  >
    {children}
  </button>
);

/** glass pill on the gradient */
export const GlassPill: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...rest
}) => (
  <button
    {...rest}
    className={cn(
      "press glass inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2",
      "text-[13px] font-semibold text-white transition hover:bg-white/20 disabled:opacity-40",
      className
    )}
  >
    {children}
  </button>
);

/** circular glass icon button */
export const CircleButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
> = ({ label, className, children, ...rest }) => (
  <button
    {...rest}
    aria-label={label}
    title={label}
    className={cn(
      "glass press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/85",
      "transition hover:bg-white/20 hover:text-white",
      className
    )}
  >
    {children}
  </button>
);

/* ── chips & labels ────────────────────────────────────────── */
export const Chip: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <span className={cn("chip", className)}>{children}</span>;

export const SuccessChip: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <span className={cn("chip-success", className)}>
    <BsCheckLg size={9} strokeWidth={1.2} />
    {children}
  </span>
);

export const DarkChip: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <span className={cn("chip-dark", className)}>{children}</span>;

export const LabelPill: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <span className={cn("label-pill", className)}>{children}</span>;

/** tiny uppercase group label that sits above a card or rail */
export const GroupLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <p
    className={cn(
      "text-[11px] font-semibold uppercase tracking-[0.11em] text-white/45",
      className
    )}
  >
    {children}
  </p>
);

/* ── the white information card ────────────────────────────────
   badge · title / meta · right-aligned action, then whatever the
   card is actually about. `flush` drops the body padding so lists
   can own their own rows. */
export const Card: React.FC<{
  title?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  flush?: boolean;
  className?: string;
  /** tighter radius + softer shadow for nested/stacked cards */
  nested?: boolean;
}> = ({ title, meta, badge, action, children, flush, className, nested }) => (
  <section
    className={cn(
      "card-light overflow-hidden",
      nested ? "rounded-[18px] shadow-none ring-1 ring-black/[0.05]" : "rounded-[22px]",
      className
    )}
  >
    {(title || badge || action) && (
      <header
        className={cn(
          "flex flex-wrap items-center gap-3 px-5",
          flush ? "pb-3 pt-5" : "pb-1 pt-5",
          !children && "pb-5"
        )}
      >
        {badge}
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
              {title}
            </h3>
          )}
          {meta && <p className="mt-0.5 truncate text-[12px] text-[var(--ink-soft)]">{meta}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
    )}
    {children && <div className={cn(flush ? "pb-1" : "px-5 pb-5 pt-3")}>{children}</div>}
  </section>
);

/* ── hairline label/value row (Hark's data rows) ───────────── */
export const InfoRow: React.FC<{
  label: React.ReactNode;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  strong?: boolean;
}> = ({ label, value, icon, className, strong }) => (
  <div
    className={cn(
      "flex items-center justify-between gap-4 border-t py-2.5 text-[13px] first:border-t-0",
      "border-black/[0.06]",
      className
    )}
  >
    <span className="flex min-w-0 items-center gap-2 text-[var(--ink-soft)]">
      {icon}
      <span className="truncate">{label}</span>
    </span>
    {value !== undefined && (
      <span
        className={cn(
          "tnum shrink-0 tabular-nums",
          strong ? "text-[15px] font-semibold text-[var(--ink)]" : "font-semibold text-[var(--ink)]"
        )}
      >
        {value}
      </span>
    )}
  </div>
);

/** a list row inside a light card: thumb · title/meta · right slot */
export const ListRow: React.FC<{
  thumb?: string | null;
  title: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  to?: string;
  className?: string;
}> = ({ thumb, title, meta, right, onClick, className }) => (
  <div
    className={cn(
      "flex items-center gap-3.5 rounded-[16px] px-3 py-2.5 transition",
      (onClick || className?.includes("cursor")) && "hover:bg-black/[0.035]",
      className
    )}
  >
    {thumb !== undefined && (
      <span className="h-[56px] w-10 shrink-0 overflow-hidden rounded-[10px] bg-black/[0.06]">
        {thumb && <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </span>
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
        {title}
      </p>
      {meta && <p className="mt-0.5 truncate text-[12px] text-[var(--ink-soft)]">{meta}</p>}
    </div>
    {right}
  </div>
);

/* ── mini panel: the small live card of the dashboard ──────── */
export const Panel: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ icon, label, value, meta, onClick, className }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "glass flex w-full flex-col items-start rounded-[20px] p-4 text-left transition",
        onClick && "press hover:bg-white/[0.16]",
        className
      )}
    >
      <div className="flex w-full items-center gap-2">
        {icon && <span className="text-white/70">{icon}</span>}
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">
          {label}
        </span>
      </div>
      <span className="tnum mt-2.5 text-[27px] font-semibold leading-none tracking-[-0.03em] text-white">
        {value}
      </span>
      {meta && <span className="mt-1.5 w-full truncate text-[12px] text-white/55">{meta}</span>}
    </Tag>
  );
};

/* ── actionable card ───────────────────────────────────────── */
export const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div className={cn("glass rounded-[20px] p-4 transition hover:bg-white/[0.16]", className)}>
    <div className="flex items-start gap-3">
      <IconBadge tone="glass">{icon}</IconBadge>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-snug tracking-[-0.015em] text-white">
          {title}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/60">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  </div>
);

/* ── segmented control ─────────────────────────────────────── */
export interface Segment<T extends string> {
  id: T;
  label: string;
}

export function Segmented<T extends string>({
  segments,
  value,
  onChange,
  className,
  size = "md",
  label,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("glass inline-flex items-center gap-0.5 rounded-full p-1", className)}
    >
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            className={cn(
              "press rounded-full font-medium transition",
              size === "md" ? "px-4 py-1.5 text-[13px]" : "px-3 py-1 text-[12px]",
              active
                ? "bg-white text-[var(--ink)] shadow-[0_1px_2px_rgba(10,12,24,0.18)]"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** segmented control for use inside white cards */
export function LightSegmented<T extends string>({
  segments,
  value,
  onChange,
  className,
  label,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-black/[0.055] p-0.5",
        className
      )}
    >
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            className={cn(
              "press rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition",
              active
                ? "bg-white text-[var(--ink)] shadow-[0_1px_2px_rgba(10,12,24,0.14)]"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── the composer ──────────────────────────────────────────────
   The signature element: one wide frosted pill, leading glyph,
   trailing mic and a white action disc. */
export const Composer: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  actionLabel?: string;
}> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search anime, or ask for something to watch",
  className,
  autoFocus,
  actionLabel = "Search",
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={cn(
        "glass-strong flex w-full items-center gap-2.5 rounded-full py-2.5 pl-5 pr-2",
        "shadow-[0_24px_60px_-28px_rgba(10,12,24,0.9)] transition focus-within:bg-white/20",
        className
      )}
    >
      <BsSearch size={15} className="shrink-0 text-white/65" />
      <input
        ref={inputRef}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14.5px] text-white placeholder-white/50 outline-none"
      />
      <button
        type="button"
        aria-label="Voice search"
        title="Voice search"
        className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
        onClick={() => inputRef.current?.focus()}
      >
        <BsMicFill size={13} />
      </button>
      <button
        type="submit"
        aria-label={actionLabel}
        className="press flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[var(--ink)] transition hover:bg-white/90"
      >
        <BsArrowUp size={13} strokeWidth={0.7} />
        <span className="hidden sm:inline">{actionLabel}</span>
      </button>
    </form>
  );
};

/* ── empty state ───────────────────────────────────────────── */
export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <div className="card-light flex flex-col items-center gap-3 rounded-[22px] px-6 py-14 text-center">
    {icon && <IconBadge tone="accent">{icon}</IconBadge>}
    <p className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--ink)]">{title}</p>
    <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-soft)]">{description}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

/* ── skeletons ─────────────────────────────────────────────── */
export const PosterSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("aspect-[2/3] w-full rounded-[18px] bg-white/[0.07]", className)} />
);

export const LineSkeleton: React.FC<{ className?: string; dark?: boolean }> = ({
  className,
  dark,
}) => (
  <div
    className={cn(
      "h-3 rounded-full",
      dark ? "animate-pulse bg-black/[0.07]" : "animate-pulse bg-white/[0.09]",
      className
    )}
  />
);
