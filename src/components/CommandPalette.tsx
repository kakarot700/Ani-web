import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BsArrowRight,
  BsBookHalf,
  BsCalendar3,
  BsClockHistory,
  BsGraphUpArrow,
  BsHouseDoorFill,
  BsMicFill,
  BsMicMuteFill,
  BsSearch,
  BsShuffle,
  BsStarFill,
} from "react-icons/bs";
import { searchShows, type ShowSummary } from "@/server/allanime";
import usePalette from "@/lib/palette";
import useFocusTrap from "@/hooks/useFocusTrap";

const HISTORY_KEY = "otaku-search-history";

const getHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const pushHistory = (q: string) => {
  try {
    const list = [q, ...getHistory().filter((x) => x !== q)].slice(0, 8);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  run: () => void;
}

const CommandPalette: React.FC = () => {
  const open = usePalette((s) => s.open);
  const setOpen = usePalette((s) => s.setOpen);
  const navigate = useNavigate();

  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const recognitionRef = useRef<any>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShowSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

  const voiceSupported =
    typeof window !== "undefined" &&
    !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

  const actions: Action[] = useMemo(
    () => [
      { id: "home", label: "Home", icon: <BsHouseDoorFill size={14} />, run: () => navigate("/") },
      { id: "browse", label: "Browse catalog", icon: <BsSearch size={14} />, run: () => navigate("/browse") },
      { id: "seasons", label: "Seasonal archive", icon: <BsCalendar3 size={14} />, run: () => navigate("/seasons") },
      { id: "popular", label: "Most popular", icon: <BsStarFill size={13} />, run: () => navigate("/browse?sort=Popular") },
      { id: "mylist", label: "My list", icon: <BsBookHalf size={14} />, run: () => navigate("/mylist") },
      { id: "history", label: "Watch history", icon: <BsClockHistory size={14} />, run: () => navigate("/history") },
      { id: "stats", label: "Stats & achievements", icon: <BsGraphUpArrow size={14} />, run: () => navigate("/stats") },
      { id: "surprise", label: "Surprise me", icon: <BsShuffle size={14} />, run: () => navigate("/surprise") },
    ],
    [navigate]
  );

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActive(0);
      setHistory(getHistory());
      window.setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      stopVoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleVoice = useCallback(() => {
    if (!voiceSupported) return;
    if (listening) {
      stopVoice();
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      setQuery(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [voiceSupported, listening, stopVoice]);

  useEffect(() => {
    window.clearTimeout(timer.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = window.setTimeout(() => {
      searchShows({ query: q, limit: 7 })
        .then((p) => {
          setResults(p.shows.slice(0, 7));
          setActive(0);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 280);
    return () => window.clearTimeout(timer.current);
  }, [query]);

  const isSearching = query.trim().length > 0;
  const itemCount = isSearching ? results.length + 1 : actions.length;

  const selectResult = useCallback(
    (s: ShowSummary) => {
      pushHistory(s.name);
      stopVoice();
      setOpen(false);
      navigate(`/anime/${s._id}`);
    },
    [navigate, setOpen, stopVoice]
  );

  const fullSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    pushHistory(q);
    stopVoice();
    setOpen(false);
    navigate(`/browse?q=${encodeURIComponent(q)}`);
  }, [query, navigate, setOpen, stopVoice]);

  const selectIndex = useCallback(
    (idx: number) => {
      if (isSearching) {
        if (idx < results.length) selectResult(results[idx]);
        else fullSearch();
      } else {
        const a = actions[idx];
        if (a) {
          stopVoice();
          setOpen(false);
          a.run();
        }
      }
    },
    [isSearching, results, actions, selectResult, fullSearch, setOpen, stopVoice]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, itemCount - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectIndex(active);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [itemCount, active, selectIndex, setOpen]
  );

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/45 px-4 pt-[12vh] backdrop-blur-md"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search and navigation"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="card-light rise w-full max-w-2xl overflow-hidden rounded-[28px] outline-none"
      >
        {/* input */}
        <div className="flex items-center gap-3 border-b border-black/[0.07] px-5 py-4">
          <BsSearch size={16} className="shrink-0 text-[var(--ink-faint)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search anime, or jump somewhere…"
            className="w-full bg-transparent text-[16px] text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none"
          />
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              aria-label="Voice search"
              className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                listening
                  ? "animate-pulse bg-[var(--accent)] text-white"
                  : "bg-black/[0.06] text-[var(--ink-soft)] hover:bg-black/10 hover:text-[var(--ink)]"
              }`}
            >
              {listening ? <BsMicMuteFill size={14} /> : <BsMicFill size={14} />}
            </button>
          )}
          <kbd className="hidden shrink-0 rounded-md bg-black/[0.06] px-1.5 py-1 text-[10px] font-semibold text-[var(--ink-soft)] sm:block">
            esc
          </kbd>
        </div>

        <div className="light-scroll max-h-[52vh] overflow-y-auto py-2">
          {!isSearching && (
            <>
              {history.length > 0 && (
                <div className="px-5 pb-3 pt-1">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                    Recent
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h) => (
                      <button
                        key={h}
                        onClick={() => setQuery(h)}
                        className="press rounded-full bg-black/[0.05] px-3 py-1 text-[12px] text-[var(--ink-soft)] transition hover:bg-black/10 hover:text-[var(--ink)]"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="px-5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                Jump to
              </p>
              {actions.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => selectIndex(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition ${
                    i === active ? "bg-black/[0.05]" : "hover:bg-black/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-[10px] transition ${
                      i === active
                        ? "bg-[#16181f] text-white"
                        : "bg-black/[0.06] text-[var(--ink-soft)]"
                    }`}
                  >
                    {a.icon}
                  </span>
                  <span className="flex-1 text-[13.5px] font-medium text-[var(--ink)]">
                    {a.label}
                  </span>
                  <BsArrowRight
                    size={12}
                    className={i === active ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"}
                  />
                </button>
              ))}
            </>
          )}

          {isSearching &&
            (searching && results.length === 0 ? (
              <p className="px-5 py-12 text-center text-[13.5px] text-[var(--ink-soft)]">
                Searching…
              </p>
            ) : results.length === 0 ? (
              <p className="px-5 py-12 text-center text-[13.5px] text-[var(--ink-soft)]">
                No titles matched "{query.trim()}"
              </p>
            ) : (
              <>
                {results.map((r, i) => (
                  <button
                    key={r._id}
                    onClick={() => selectIndex(i)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition ${
                      i === active ? "bg-black/[0.05]" : "hover:bg-black/[0.03]"
                    }`}
                  >
                    {r.thumbnail ? (
                      <img
                        src={r.thumbnail}
                        alt=""
                        className="h-[54px] w-[38px] shrink-0 rounded-[10px] object-cover"
                      />
                    ) : (
                      <span className="h-[54px] w-[38px] shrink-0 rounded-[10px] bg-black/[0.08]" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-[var(--ink)]">
                        {r.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[var(--ink-soft)]">
                        <span>{r.type ?? "TV"}</span>
                        {typeof r.score === "number" && r.score > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <BsStarFill size={8} />
                            {r.score.toFixed(1)}
                          </span>
                        )}
                        {r.episodeCount ? <span>{r.episodeCount} eps</span> : null}
                      </span>
                    </span>
                    <BsArrowRight
                      size={12}
                      className={i === active ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"}
                    />
                  </button>
                ))}
                <button
                  onClick={() => selectIndex(results.length)}
                  onMouseEnter={() => setActive(results.length)}
                  className={`flex w-full items-center gap-3 border-t border-black/[0.07] px-5 py-3.5 text-left text-[13px] font-medium transition ${
                    active === results.length
                      ? "bg-black/[0.05] text-[var(--accent)]"
                      : "text-[var(--ink-soft)] hover:bg-black/[0.03]"
                  }`}
                >
                  <BsSearch size={14} />
                  Search the full catalog for "{query.trim()}"
                </button>
              </>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
