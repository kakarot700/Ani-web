import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BsBell,
  BsBookmarkHeart,
  BsCalendar3,
  BsGraphUpArrow,
  BsGrid3X3Gap,
  BsHouseDoor,
  BsSearch,
} from "react-icons/bs";
import AccountMenu from "./AccountMenu";
import ProfileAvatar from "./ProfileAvatar";
import usePalette from "@/lib/palette";
import { Segmented } from "./ui";
import { searchShows, type ShowSummary } from "@/server/allanime";

type Section = "discover" | "library" | "seasons";

const SECTION_TABS = [
  { id: "discover" as const, label: "Discover" },
  { id: "library" as const, label: "Library" },
  { id: "seasons" as const, label: "Seasons" },
];

/** mobile bottom bar — one black pill, Hark-style */
const BOTTOM_NAV = [
  { label: "Home", to: "/", icon: <BsHouseDoor size={17} /> },
  { label: "Browse", to: "/browse", icon: <BsGrid3X3Gap size={15} /> },
  { label: "Seasons", to: "/seasons", icon: <BsCalendar3 size={15} /> },
  { label: "My list", to: "/mylist", icon: <BsBookmarkHeart size={15} /> },
  { label: "Stats", to: "/stats", icon: <BsGraphUpArrow size={15} /> },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setPaletteOpen = usePalette((s) => s.setOpen);

  const [scrolled, setScrolled] = useState(false);
  const [runway, setRunway] = useState(0);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [updates, setUpdates] = useState<ShowSummary[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const section: Section = location.pathname.startsWith("/seasons")
    ? "seasons"
    : location.pathname.startsWith("/mylist") ||
        location.pathname.startsWith("/history") ||
        location.pathname.startsWith("/stats")
      ? "library"
      : "discover";

  // the bar dissolves as you leave the top of the page instead of
  // hiding outright — Hark's chrome never jumps
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      setRunway(Math.min(1, Math.max(0, (y - 24) / 120)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setShowAccountMenu(false);
    setShowNotifs(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifs(false);
        setShowAccountMenu(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const toggleNotifs = useCallback(() => {
    setShowNotifs((open) => {
      const next = !open;
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

  const goSection = (s: Section) => {
    if (s === "discover") navigate("/");
    else if (s === "seasons") navigate("/seasons");
    else navigate("/mylist");
  };

  return (
    <>
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-5 md:pt-4">
        <div
          className="pointer-events-auto mx-auto flex max-w-[1400px] items-center gap-3 rounded-full px-2.5 py-2 transition-all duration-500"
          style={{
            backdropFilter: scrolled ? "blur(28px) saturate(150%)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(28px) saturate(150%)" : "none",
            background: `rgba(255,255,255,${0.09 * runway})`,
            border: `1px solid rgba(255,255,255,${0.16 * runway})`,
            boxShadow: scrolled
              ? `inset 0 1px 0 rgba(255,255,255,${0.1 * runway}), 0 10px 30px -18px rgba(10,12,24,${0.6 * runway})`
              : "none",
          }}
        >
          <Link
            to="/"
            aria-label="Otaku home"
            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/25"
          >
            <BsHouseDoor size={15} />
          </Link>

          {/* centred section control */}
          <div className="mx-auto hidden md:block">
            <Segmented segments={SECTION_TABS} value={section} onChange={goSection} />
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <button
              onClick={() => setPaletteOpen(true)}
              className="glass press flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Search"
            >
              <BsSearch size={13} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/70 lg:inline">
                ⌘K
              </kbd>
            </button>

            <div ref={notifRef} className="relative hidden sm:block">
              <button
                onClick={toggleNotifs}
                aria-label="Recently updated"
                className={`press relative flex h-9 w-9 items-center justify-center rounded-full transition ${
                  showNotifs
                    ? "bg-white/25 text-white"
                    : "bg-white/12 text-white/85 hover:bg-white/20 hover:text-white"
                }`}
              >
                <BsBell size={14} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--success)] ring-2 ring-[#3c3f5e]" />
              </button>

              {showNotifs && (
                <div className="card-light rise absolute right-0 top-12 w-[330px] overflow-hidden rounded-[22px]">
                  <div className="px-5 pb-3 pt-4">
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                      Recently updated
                    </p>
                    <p className="text-[12px] text-[var(--ink-soft)]">
                      New episodes in the catalog
                    </p>
                  </div>
                  <div className="light-scroll max-h-80 overflow-y-auto border-t border-black/[0.06] pb-1">
                    {updatesLoading && updates.length === 0 ? (
                      <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-soft)]">
                        Loading…
                      </p>
                    ) : updates.length === 0 ? (
                      <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-soft)]">
                        Nothing new right now.
                      </p>
                    ) : (
                      updates.map((u) => (
                        <button
                          key={u._id}
                          onClick={() => navigate(`/anime/${u._id}`)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-black/[0.04]"
                        >
                          <img
                            src={u.thumbnail ?? undefined}
                            alt=""
                            className="h-[52px] w-9 shrink-0 rounded-[10px] object-cover"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-medium text-[var(--ink)]">
                              {u.name}
                            </span>
                            <span className="block text-[12px] text-[var(--ink-soft)]">
                              {u.type ?? "TV"}
                              {u.episodeCount ? ` · ${u.episodeCount} eps` : ""}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowAccountMenu((o) => !o)}
                aria-label="Profile"
                className="press flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/25 transition hover:ring-white/60"
              >
                <ProfileAvatar />
              </button>
              <AccountMenu visable={showAccountMenu} />
            </div>
          </div>
        </div>
      </nav>

      {/* mobile: one floating black pill at the bottom, like Hark's app */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:hidden">
        <div className="press flex items-center gap-0.5 rounded-full bg-[#16181f]/92 p-1.5 shadow-[0_18px_40px_-16px_rgba(10,12,24,0.9)] backdrop-blur-xl">
          {BOTTOM_NAV.map((l) => {
            const active =
              l.to === "/" ? location.pathname === "/" : location.pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-label={l.label}
                className={`flex h-10 w-11 items-center justify-center rounded-full transition ${
                  active ? "bg-white text-[var(--ink)]" : "text-white/60 hover:text-white"
                }`}
              >
                {l.icon}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
