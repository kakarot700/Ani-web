import { Component, useEffect, useState, type ReactNode } from "react";
import { HashRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import BackToTop from "@/components/BackToTop";
import CommandPalette from "@/components/CommandPalette";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import ShortcutsModal from "@/components/ShortcutsModal";
import Toaster from "@/components/Toaster";
import usePalette from "@/lib/palette";
import useApiHealth from "@/server/health";
import { searchShows } from "@/server/allanime";

import AnimeDetailPage from "@/pages/AnimeDetail";
import BrowsePage from "@/pages/Browse";
import HistoryPage from "@/pages/HistoryPage";
import HomePage from "@/pages/Home";
import MyListPage from "@/pages/MyListPage";
import NotFoundPage from "@/pages/NotFound";
import SeasonsPage from "@/pages/SeasonsPage";
import StatsPage from "@/pages/StatsPage";
import WatchPage from "@/pages/Watch";
import WatchAnimePage from "@/pages/WatchAnime";

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      <p className="text-[14px] text-white/60">Finding something for you…</p>
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
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-white">
            Something went wrong
          </h1>
          <p className="max-w-md text-[14px] text-white/60">
            {this.state.error.message || "An unexpected error occurred."} A reload usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[var(--ink)] transition hover:bg-white/90"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const titleFor = (p: string) => {
  if (p === "/") return "Otaku — Stream Anime";
  if (p.startsWith("/browse")) return "Browse — Otaku";
  if (p.startsWith("/anime")) return "Anime — Otaku";
  if (p.startsWith("/watch")) return "Now Watching — Otaku";
  if (p.startsWith("/play")) return "Classic Clips — Otaku";
  if (p.startsWith("/mylist")) return "My List — Otaku";
  if (p.startsWith("/stats")) return "Stats — Otaku";
  if (p.startsWith("/history")) return "History — Otaku";
  if (p.startsWith("/seasons")) return "Seasons — Otaku";
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
    <div id="main" key={location.pathname} className="animate-[fadeup_0.4s_ease]">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/seasons" element={<SeasonsPage />} />
        <Route path="/mylist" element={<MyListPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/surprise" element={<SurpriseRoute />} />
        <Route path="/anime/:id" element={<AnimeDetailPage />} />
        <Route path="/watch/:id/:ep" element={<WatchAnimePage />} />
        <Route path="/play/:movieId" element={<WatchPage />} />
        <Route path="*" element={<NotFoundPage />} />
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

export default function App() {
  return (
    <HashRouter>
      <div className="aurora" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
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
    </HashRouter>
  );
}
