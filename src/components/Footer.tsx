import React from "react";
import { Link } from "react-router-dom";
import SystemStatus from "./SystemStatus";

const GENRE_LINKS = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance", "Sci-Fi", "Horror"];
const CATEGORY_LINKS = [
  { label: "Most Popular", to: "/browse?sort=Popular" },
  { label: "Recently Added", to: "/browse?sort=Recent" },
  { label: "Top Rated", to: "/browse?sort=Top" },
  { label: "Movies", to: "/browse?types=Movie" },
  { label: "TV Series", to: "/browse?types=TV" },
  { label: "OVA", to: "/browse?types=OVA" },
  { label: "ONA", to: "/browse?types=ONA" },
  { label: "Specials", to: "/browse?types=Special" },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-zinc-800/80 bg-zinc-950">
      {/* giant ghost wordmark */}
      <p
        className="text-outline font-display pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-[26vw] leading-none opacity-60 md:text-[18rem]"
        aria-hidden="true"
      >
        OTAKU
      </p>

      <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 pb-24 pt-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-12">
        <div>
          <p className="font-display text-4xl tracking-wide">
            <span className="text-red-600">Otaku</span>
            <span className="text-white"> ·</span>{" "}
            <span className="font-jp text-2xl text-zinc-400">オタク</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
            Stream thousands of anime with sub & dub, multiple servers, tracking and more. Built as
            a fan project — a love letter to the sites that raised us.
          </p>
          <p className="mt-4 text-[11px] text-zinc-600">
            Data: AllAnime · Players: MegaPlay, VidSrc, Videasy, Embed.su
          </p>
          <SystemStatus />
        </div>

        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
            Browse
          </p>
          <ul className="grid grid-cols-1 gap-2">
            {CATEGORY_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-sm text-zinc-500 transition hover:text-red-500"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
            Genres
          </p>
          <ul className="grid grid-cols-1 gap-2">
            {GENRE_LINKS.map((g) => (
              <li key={g}>
                <Link
                  to={`/browse?genres=${encodeURIComponent(g)}`}
                  className="text-sm text-zinc-500 transition hover:text-red-500"
                >
                  {g}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
            Library
          </p>
          <ul className="grid grid-cols-1 gap-2 text-sm">
            <li>
              <Link to="/seasons" className="text-zinc-500 transition hover:text-red-500">
                Seasonal Archive
              </Link>
            </li>
            <li>
              <Link to="/mylist" className="text-zinc-500 transition hover:text-red-500">
                My List
              </Link>
            </li>
            <li>
              <Link to="/history" className="text-zinc-500 transition hover:text-red-500">
                Watch History
              </Link>
            </li>
            <li>
              <Link to="/stats" className="text-zinc-500 transition hover:text-red-500">
                Stats
              </Link>
            </li>
            <li>
              <Link to="/browse" className="text-zinc-500 transition hover:text-red-500">
                Advanced Search
              </Link>
            </li>
          </ul>
          <p className="mt-6 text-[11px] leading-relaxed text-zinc-700">
            Otaku does not store any media files on its servers. All content is provided by
            third-party providers. For demonstration purposes only.
          </p>
        </div>
      </div>
      <div className="border-t border-zinc-900 py-4 text-center text-[11px] text-zinc-600">
        © 2026 Otaku — 夢を追い続けろ · Keep chasing the dream
      </div>
    </footer>
  );
};

export default Footer;
