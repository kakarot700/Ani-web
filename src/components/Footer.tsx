import React from "react";
import { Link } from "react-router-dom";
import SystemStatus from "./SystemStatus";

const LINKS = [
  { label: "Browse", to: "/browse" },
  { label: "Seasons", to: "/seasons" },
  { label: "My list", to: "/mylist" },
  { label: "History", to: "/history" },
  { label: "Stats", to: "/stats" },
];

const NOTES = ["Catalog: AllAnime", "Players: MegaPlay · VidSrc · Videasy · Embed.su"];

/** Quiet footer: wordmark, one row of links, and the live status pill. */
const Footer: React.FC = () => (
  <footer className="px-4 pb-28 md:px-6 md:pb-12">
    <div className="mx-auto max-w-[1400px] border-t border-white/12 pt-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[16px] font-semibold tracking-[-0.02em] text-white">
            otaku<span className="text-[var(--accent)]">.</span>
          </p>
          <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-white/50">
            A fan project — no account, no server-side profile. Everything you track lives in this
            browser.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[12.5px] font-medium text-white/60 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
        <SystemStatus />
        <p className="text-[11.5px] text-white/35">© 2026 Otaku</p>
        {NOTES.map((n) => (
          <p key={n} className="text-[11.5px] text-white/35">
            {n}
          </p>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
