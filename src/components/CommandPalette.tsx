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
  BsX,
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
  jp: string;
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
    (!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));

  const actions: Action[] = useMemo(
    () => [
      { id: "home", label: "Home", jp: "ホーム", icon: <BsHouseDoorFill size={15} />, run: () => navigate("/") },
      { id: "seasons", label: "Seasons", jp: "シーズン", icon: <BsCalendar3 size={15} />, run: () => navigate("/seasons") },
      { id: "browse", label: "Browse All", jp: "探す", icon: <BsSearch size={15} />, run: () => navigate("/browse") },
      { id: "popular", label: "Most Popular", jp: "人気", icon: <BsStarFill size={14} />, run: () => navigate("/browse?sort=Popular") },
      { id: "mylist", label: "My List", jp: "マイリスト", icon: <BsBookHalf size={15} />, run: () => navigate("/mylist") },
      { id: "history", label: "History", jp: "履歴", icon: <BsClockHistory size={15} />, run: () => navigate("/history") },
      { id: "stats", label: "Stats", jp: "統計", icon: <BsGraphUpArrow size={15} />, run: () => navigate("/stats") },
      { id: "surprise", label: "Surprise Me", jp: "ランダム", icon: <BsShuffle size={15} />, run: () => navigate("/surprise") },
    ],
    [navigate]
  );

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

  // live search
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

  // flattened navigation list: actions (when not searching) + results
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
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/80 px-4 pt-[10vh] backdrop-blur-sm"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search and navigation"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-[0_40px_120px_-20px_rgba(0,0,0,1)] ring-1 ring-red-600/20 animate-[fadeup_0.22s_ease] outline-none"
      >
        {/* input */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <span className="font-display text-2xl leading-none text-red-600">オ</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search anime, or pick a destination…"
            className="w-full bg-transparent text-lg text-white placeholder-zinc-600 outline-none"
          />
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              aria-label="Voice search"
              title="Voice search"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                listening
                  ? "animate-pulse bg-red-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {listening ? <BsMicMuteFill size={15} /> : <BsMicFill size={15} />}
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition hover:text-white"
          >
            <BsX size={15} />
          </button>
        </div>

        <div className="thin-scroll max-h-[54vh] overflow-y-auto py-2">
          {!isSearching && (
            <>
              {/* recent searches */}
              {history.length > 0 && (
                <div className="px-5 pb-3 pt-1">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">
                    Recent · 最近
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h) => (
                      <button
                        key={h}
                        onClick={() => setQuery(h)}
                        className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-400 transition hover:border-red-600 hover:text-white"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="px-5 pb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600">
                Go to · 移動
              </p>
              {actions.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => selectIndex(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition ${
                    i === active ? "bg-red-600/15" : "hover:bg-zinc-900"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-md ${
                      i === active ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {a.icon}
                  </span>
                  <span className={`flex-1 text-sm font-bold ${i === active ? "text-white" : "text-zinc-300"}`}>
                    {a.label}
                  </span>
                  <span className="font-jp text-[10px] tracking-[0.25em] text-zinc-600">{a.jp}</span>
                  <BsArrowRight
                    size={12}
                    className={i === active ? "text-red-500" : "text-zinc-700"}
                  />
                </button>
              ))}
            </>
          )}

          {isSearching &&
            (searching && results.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-zinc-500">Searching…</p>
            ) : (
              <>
                {results.map((r, i) => (
                  <button
                    key={r._id}
                    onClick={() => selectIndex(i)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 px-5 py-2 text-left transition ${
                      i === active ? "bg-red-600/15" : "hover:bg-zinc-900"
                    }`}
                  >
                    {r.thumbnail ? (
                      <img
                        src={r.thumbnail}
                        alt=""
                        className="h-14 w-10 shrink-0 rounded-md object-cover ring-1 ring-zinc-800"
                      />
                    ) : (
                      <div className="h-14 w-10 shrink-0 rounded-md bg-zinc-800" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-bold ${
                          i === active ? "text-red-500" : "text-white"
                        }`}
                      >
                        {r.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                        <span className="rounded-sm bg-red-600/90 px-1 py-px font-bold text-white">
                          {r.type ?? "TV"}
                        </span>
                        {typeof r.score === "number" && r.score > 0 && (
                          <span className="flex items-center gap-0.5 text-yellow-400">
                            <BsStarFill size={8} />
                            {r.score.toFixed(1)}
                          </span>
                        )}
                        {r.episodeCount ? <span>{r.episodeCount} eps</span> : null}
                      </span>
                    </span>
                    <BsArrowRight size={12} className={i === active ? "text-red-500" : "text-zinc-700"} />
                  </button>
                ))}
                <button
                  onClick={() => selectIndex(results.length)}
                  onMouseEnter={() => setActive(results.length)}
                  className={`flex w-full items-center gap-3 border-t border-zinc-800 px-5 py-3 text-left text-sm font-bold transition ${
                    active === results.length
                      ? "bg-red-600/15 text-red-500"
                      : "text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  <BsSearch size={14} />
                  Search full catalog for “{query.trim()}”
                </button>
              </>
            ))}
        </div>

        <div className="flex items-center gap-4 border-t border-zinc-800 px-5 py-2.5 text-[10px] text-zinc-600">
          <span>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 font-mono">↵</kbd> open
          </span>
          <span>
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 font-mono">esc</kbd> close
          </span>
          <span className="ml-auto">
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 font-mono">⌘K</kbd> anywhere
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
