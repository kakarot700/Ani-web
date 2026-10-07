import { Component, useEffect, useState, type ReactNode } from "react";
import { HashRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ShortcutsModal from "@/components/ShortcutsModal";
import CommandPalette from "@/components/CommandPalette";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import { searchShows } from "@/server/allanime";
import useApiHealth from "@/server/health";
import usePalette from "@/lib/palette";

const SurpriseRoute = () => {
  const navigate = useNavigate();
  useEffect(() => {
    let alive = true;
    searchShows({ sortBy: "Random", types: "TV", limit: 1 })
      .then((p) => {
        if (!alive) return;
        const pick = p.shows[0];
        if (pick) navigate(`/anime/${pick._id}`, { replace: true });
        else navigate("/", { replace: true });
      })
      .catch(() => alive && navigate("/", { replace: true }));
    return () => {
      alive = false;
    };
  }, [navigate]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-800 border-t-red-600" />
      <p className="font-display text-2xl tracking-widest text-zinc-400">
        Summoning something great<span className="animate-pulse">…</span>
      </p>
    </div>
  );
};

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
          <p className="font-jp text-sm tracking-[0.4em] text-red-600">エラー</p>
          <h1 className="font-display text-5xl tracking-wide text-white">Something broke</h1>
          <p className="max-w-md text-sm text-zinc-500">
            {this.state.error.message || "An unexpected error occurred."} A reload usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
          >
            Reload Otaku
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const titleFor = (p: string) => {
  if (p === "/") return "Otaku — Stream Anime";
  if (p.startsWith("/browse")) return "Browse Anime — Otaku";
  if (p.startsWith("/anime")) return "Anime — Otaku";
  if (p.startsWith("/watch")) return "Now Watching — Otaku";
  if (p.startsWith("/play")) return "Otaku Classics — Otaku";
  if (p.startsWith("/mylist")) return "My List — Otaku";
  if (p.startsWith("/stats")) return "Stats — Otaku";
  if (p.startsWith("/history")) return "History — Otaku";
  if (p.startsWith("/surprise")) return "Surprise — Otaku";
  return "Otaku";
};

const AnimatedRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = titleFor(location.pathname);
  }, [location.pathname]);

  return (
    <div id="main" key={location.pathname} className="animate-[fadeup_0.45s_ease]">
      <Routes location={location}>
        <Route path="/" element={<HomeLazy />} />
        <Route path="/browse" element={<BrowseLazy />} />
        <Route path="/seasons" element={<SeasonsLazy />} />
        <Route path="/mylist" element={<MyListLazy />} />
        <Route path="/stats" element={<StatsLazy />} />
        <Route path="/history" element={<HistoryLazy />} />
        <Route path="/surprise" element={<SurpriseRoute />} />
        <Route path="/anime/:id" element={<AnimeDetailLazy />} />
        <Route path="/watch/:id/:ep" element={<WatchAnimeLazy />} />
        <Route path="/play/:movieId" element={<WatchLazy />} />
        <Route path="*" element={<NotFoundLazy />} />
      </Routes>
    </div>
  );
};

const GlobalShortcuts = () => {
  const [open, setOpen] = useState(false);
  const setPaletteOpen = usePalette((s) => s.setOpen);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if (e.key === "?") setOpen((o) => !o);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);
  return <ShortcutsModal open={open} onClose={() => setOpen(false)} />;
};

const HealthBootstrap = () => {
  const runChecks = useApiHealth((s) => s.runChecks);
  useEffect(() => {
    void runChecks();
  }, [runChecks]);
  return null;
};

import BackToTop from "@/components/BackToTop";
import Toaster from "@/components/Toaster";
import HomeLazy from "@/pages/Home";
import BrowseLazy from "@/pages/Browse";
import MyListLazy from "@/pages/MyListPage";
import StatsLazy from "@/pages/StatsPage";
import HistoryLazy from "@/pages/HistoryPage";
import AnimeDetailLazy from "@/pages/AnimeDetail";
import WatchAnimeLazy from "@/pages/WatchAnime";
import WatchLazy from "@/pages/Watch";
import SeasonsLazy from "@/pages/SeasonsPage";
import NotFoundLazy from "@/pages/NotFound";
import BootScreen from "@/components/BootScreen";
import SceneCut from "@/components/SceneCut";
import CustomCursor from "@/components/CustomCursor";

export default function App() {
  const [booting, setBooting] = useState(true);

  return (
    <HashRouter>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgressBar />
      <ErrorBoundary>
        <HealthBootstrap />
        <AnimatedRoutes />
      </ErrorBoundary>
      <Toaster />
      <BackToTop />
      <GlobalShortcuts />
      <CommandPalette />
      <SceneCut />
      <CustomCursor />
      {booting && <BootScreen onDone={() => setBooting(false)} />}
    </HashRouter>
  );
}
