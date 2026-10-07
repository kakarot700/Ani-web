import { BsBell, BsBookmarkHeartFill, BsChevronDown, BsSearch, BsShuffle } from "react-icons/bs";
import MobileMenu from "./MobileMenu";
import usePalette from "@/lib/palette";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { searchShows, type ShowSummary } from "@/server/allanime";

const TOP_OFFSET = 66;

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Seasons", to: "/seasons" },
  { label: "Most Popular", to: "/browse?sort=Popular" },
  { label: "Movies", to: "/browse?types=Movie" },
  { label: "My List", to: "/mylist" },
  { label: "History", to: "/history" },
  { label: "Stats", to: "/stats" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const setPaletteOpen = usePalette((s) => s.setOpen);
  const [updates, setUpdates] = useState<ShowSummary[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowBackground(y >= TOP_OFFSET);
      // hide on scroll down (past the hero), reveal on scroll up
      if (y > 240 && y > lastY.current + 6) setHidden(true);
      else if (y < lastY.current - 6 || y < 120) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Escape closes dropdowns
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifs(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // close notifs on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleNotifs = useCallback(() => {
    setShowNotifs((c) => {
      const next = !c;
      if (next && updates.length === 0 && !updatesLoading) {
        setUpdatesLoading(true);
        searchShows({ sortBy: "Latest_Update", limit: 7 })
          .then((p) => setUpdates(p.shows.filter((s) => s.thumbnail)))
          .catch(() => setUpdates([]))
          .finally(() => setUpdatesLoading(false));
      }
      return next;
    });
  }, [updates.length, updatesLoading]);

  const surpriseMe = useCallback(() => {
    navigate("/surprise");
  }, [navigate]);

  // live Japan Standard Time clock
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
    })
  );
  useEffect(() => {
    const id = window.setInterval(
      () =>
        setClock(
          new Date().toLocaleTimeString("en-GB", {
            timeZone: "Asia/Tokyo",
            hour: "2-digit",
            minute: "2-digit",
          })
        ),
      20000
    );
    return () => window.clearInterval(id);
  }, []);

  const toggleMobileMenu = useCallback(() => setShowMobileMenu((c) => !c), []);

  const anyMenuOpen = showMobileMenu || showNotifs;
  const navHidden = hidden && !anyMenuOpen;

  return (
    <nav
      className="fixed z-40 w-full transition-transform duration-300"
      style={{ transform: navHidden ? "translateY(-110%)" : "translateY(0)" }}
    >
      <div
        className={`flex flex-row items-center px-4 py-4 transition duration-500 md:px-16 md:py-6 ${
          showBackground
            ? "bg-zinc-950/80 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgba(255,255,255,0.06)]"
            : "bg-gradient-to-b from-zinc-950/85 to-transparent"
        }`}
      >
        <Link to="/" className="shrink-0">
          <h3 className="text-2xl font-bold text-white md:text-3xl">
            <span className="text-red-600">Otaku</span>
          </h3>
        </Link>

        <div className="ml-8 hidden flex-row gap-6 lg:flex">
          {LINKS.map((l) => {
            const isActive =
              l.to === "/"
                ? location.pathname === "/"
                : (location.pathname + location.search).startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`group relative py-1 text-sm font-semibold transition ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left rounded-full bg-red-600 transition-all duration-300 ${
                    isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-40"
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        <div
          onClick={toggleMobileMenu}
          className="relative ml-8 flex cursor-pointer flex-row items-center gap-2 lg:hidden"
        >
          <p className="text-sm text-white">Browse</p>
          <BsChevronDown
            className={`text-white transition ${showMobileMenu ? "rotate-180" : "rotate-0"}`}
          />
          <MobileMenu visible={showMobileMenu} />
        </div>

        <div className="ml-auto flex flex-row items-center gap-3 md:gap-5">
          {/* search launcher */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex items-center gap-2.5 rounded-lg bg-zinc-800/80 px-3 py-2 ring-1 ring-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:ring-red-600/60"
            aria-label="Open search"
          >
            <BsSearch size={14} className="text-zinc-400 transition group-hover:text-red-500" />
            <span className="hidden text-sm text-zinc-500 transition group-hover:text-zinc-300 md:inline">
              Search…
            </span>
            <kbd className="hidden rounded border border-zinc-600 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 md:inline">
              ⌘K
            </kbd>
          </button>

          {/* JST clock */}
          <div
            className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 xl:flex"
            title="Japan Standard Time"
          >
            <span className="breathe h-1.5 w-1.5 rounded-full bg-red-600" />
            <span className="font-mono text-xs font-bold tabular-nums text-zinc-300">{clock}</span>
            <span className="font-jp text-[9px] tracking-[0.25em] text-zinc-600">日本時間</span>
          </div>

          {/* notifications — recently updated */}
          <div ref={notifRef} className="relative hidden sm:block">
            <button
              onClick={toggleNotifs}
              aria-label="Recently updated anime"
              title="Recently updated"
              className={`relative flex h-9 w-9 items-center justify-center rounded-md transition ${
                showNotifs ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
              }`}
            >
              <BsBell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-600" />
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
                <p className="border-b border-zinc-800 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Recently Updated · 最近更新
                </p>
                <div className="thin-scroll max-h-80 overflow-y-auto">
                  {updatesLoading && updates.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-zinc-500">Loading…</p>
                  ) : updates.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-zinc-500">Nothing new yet.</p>
                  ) : (
                    updates.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => {
                          setShowNotifs(false);
                          navigate(`/anime/${u._id}`);
                        }}
                        className="flex w-full items-center gap-3 border-b border-zinc-800/60 px-3 py-2 text-left transition last:border-0 hover:bg-zinc-800"
                      >
                        <img
                          src={u.thumbnail ?? undefined}
                          alt=""
                          className="h-12 w-9 shrink-0 rounded object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {u.type ?? "TV"}
                            {u.episodeCount ? ` · ${u.episodeCount} eps` : ""}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={surpriseMe}
            title="Surprise me — random anime"
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/70 px-2.5 py-1.5 text-xs font-bold text-zinc-200 transition hover:-translate-y-0.5 hover:border-red-600/70 hover:text-white"
          >
            <BsShuffle size={13} />
            <span className="hidden lg:inline">Random</span>
          </button>

          <Link
            to="/mylist"
            title="My List"
            aria-label="My List"
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition hover:bg-zinc-800/70 hover:text-white"
          >
            <BsBookmarkHeartFill size={16} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
