interface LogoProps {
  className?: string;
}

/**
 * Otaku brand mark — a dusk-gradient app tile (echoing the aurora
 * backdrop and the periwinkle→peach ramp) with a soft top sheen and a
 * white play glyph. Used as the navbar brand and beside the footer
 * wordmark; the same artwork is the site favicon (see index.html).
 */
export default function Logo({ className = "h-9 w-9" }: LogoProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Otaku">
      <defs>
        <linearGradient id="otakuLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a3b0fc" />
          <stop offset="0.55" stopColor="#7f8ef9" />
          <stop offset="1" stopColor="#e9bd9c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#otakuLogoGrad)" />
      {/* soft glass sheen across the top */}
      <path
        d="M0 16C0 7.2 7.2 0 16 0h32c8.8 0 16 7.2 16 16v10C40 37 24 37 0 26z"
        fill="#fff"
        opacity="0.1"
      />
      {/* play glyph */}
      <path
        d="M23 21.8 41 32 23 42.2Z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
