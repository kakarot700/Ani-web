import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BsArrowRepeat,
  BsArrowRight,
  BsBookmarkHeart,
  BsCheckLg,
  BsChevronDown,
  BsClock,
  BsFillPlayFill,
  BsGraphUpArrow,
  BsLightningChargeFill,
  BsShuffle,
  BsStarFill,
} from "react-icons/bs";
import AnimeCard from "@/components/AnimeCard";
import Footer from "@/components/Footer";
import Img from "@/components/Img";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";
import Row from "@/components/Row";
import SectionHeader from "@/components/SectionHeader";
import {
  ActionCard,
  BlackPill,
  Card,
  Composer,
  GhostPill,
  IconBadge,
  InfoRow,
  ListRow,
  Panel,
  PosterSkeleton,
  SuccessChip,
} from "@/components/ui";
import useConnectivity from "@/lib/connectivity";
import useUserList from "@/lib/userlist";
import {
  GENRES,
  getAiringSchedule,
  searchShows,
  type AiringEntry,
  type SearchParams,
  type ShowSummary,
} from "@/server/allanime";
import { getWatchProgress } from "@/server/stream";

/* ── data helpers ──────────────────────────────────────────── */

function useRail(params: SearchParams, limit = 18) {
  const key = JSON.stringify({ ...params, limit });
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    searchShows({ ...params, limit })
      .then((p) => alive && setShows(p.shows))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { shows, loading, error };
}

function Rail({
  title,
  to,
  params,
  limit = 18,
}: {
  title: string;
  to?: string;
  params: SearchParams;
  limit?: number;
}) {
  const { shows, loading, error } = useRail(params, limit);
  if (error && shows.length === 0) return null;
  const items = shows.filter((s) => s.thumbnail).slice(0, limit);
  if (!loading && items.length === 0) return null;

  return (
    <Reveal>
      <Row title={title} to={to}>
        {loading && items.length === 0
          ? Array.from({ length: 7 }).map((_, i) => (
              <PosterSkeleton key={i} className="w-36 shrink-0 md:w-44" />
            ))
          : items.map((s) => (
              <div key={s._id} className="w-36 shrink-0 md:w-44">
                <AnimeCard show={s} />
              </div>
            ))}
      </Row>
    </Reveal>
  );
}

const countdown = (sec: number) => {
  const diff = sec * 1000 - Date.now();
  if (diff <= 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.floor(hours / 24)}d`;
};

const clockTime = (sec: number) =>
  new Date(sec * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const greetingFor = (h: number) =>
  h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

/* ── page ──────────────────────────────────────────────────── */

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [trending, setTrending] = useState<ShowSummary[]>([]);
  const [schedule, setSchedule] = useState<AiringEntry[]>([]);
  const [continueWatching] = useState(getWatchProgress);
  const offline = useConnectivity((s) => s.offline);
  const servedFromCache = useConnectivity((s) => s.servedFromCache);

  const entries = useUserList((s) => s.entries);
  const watched = useUserList((s) => s.watched);
  const events = useUserList((s) => s.events);

  useEffect(() => {
    let alive = true;
    searchShows({ sortBy: "Trending", dateRangeStart: 1, limit: 12 })
      .then((p) => alive && setTrending(p.shows.filter((s) => s.thumbnail)))
      .catch(() => undefined);
    getAiringSchedule()
      .then((e) => alive && setSchedule(e))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const submit = () => {
    const q = query.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : "/surprise");
  };

  const activity = useMemo(() => {
    const episodes = Object.values(watched).reduce((a, l) => a + l.length, 0);
    const titles = Object.keys(entries).filter((k) => entries[k]?.status).length;
    const days = new Set(events.map((ts) => new Date(ts).toDateString())).size;
    return { episodes, titles, days, hours: Math.round((episodes * 24) / 60) };
  }, [entries, watched, events]);

  const today = new Date().toDateString();
  const airingToday = useMemo(
    () => schedule.filter((e) => new Date(e.airingAt * 1000).toDateString() === today),
    [schedule, today]
  );
  const upcoming = airingToday[0] ?? schedule[0];
  const last = continueWatching[0];
  const topRated = trending[0];
  const greeting = greetingFor(new Date().getHours());

  const quickFilters = [
    { label: "Trending", to: "/browse?sort=Trending" },
    { label: "Airing today", to: "/browse?sort=Latest_Update" },
    { label: "Top rated", to: "/browse?sort=Top" },
    { label: "Movies", to: "/browse?types=Movie" },
  ];

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-32 pt-24 md:px-6 md:pb-24">
        {/* ══════════════ the canvas — one centred column ══════════════ */}
        <div className="mx-auto max-w-[880px]">
          {/* ── hero ── */}
          <section className="flex min-h-[calc(100svh-15rem)] flex-col justify-center text-center">
            <p className="text-[13.5px] text-white/65">{greeting}</p>
            <h1 className="mx-auto mt-2.5 max-w-[16ch] text-[34px] font-semibold leading-[1.06] tracking-[-0.04em] text-white md:text-[46px]">
              What do you want to watch?
            </h1>
            <Composer value={query} onChange={setQuery} onSubmit={submit} className="mt-8" />

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickFilters.map((c) => (
                <Link
                  key={c.label}
                  to={c.to}
                  className="label-pill press transition hover:bg-white/25"
                >
                  {c.label}
                </Link>
              ))}
              <Link to="/surprise" className="label-pill press transition hover:bg-white/25">
                <BsShuffle size={10} />
                Surprise me
              </Link>
            </div>

            {(offline || servedFromCache) && (
              <p className="glass mx-auto mt-7 inline-block rounded-full px-4 py-2 text-[12.5px] text-white/80">
                Showing your cached library — the catalog is unreachable right now.
              </p>
            )}

            <button
              onClick={() =>
                window.scrollTo({ top: window.innerHeight * 0.88, behavior: "smooth" })
              }
              aria-label="Scroll to your dashboard"
              className="press mx-auto mt-14 flex flex-col items-center gap-1.5 text-white/40 transition hover:text-white/80"
            >
              <span className="hidden text-[10.5px] font-semibold uppercase tracking-[0.14em] sm:block">
                Your dashboard
              </span>
              <BsChevronDown size={13} />
            </button>
          </section>

          {/* ── panels ── */}
          <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Panel
              icon={<BsLightningChargeFill size={13} />}
              label="Airing today"
              value={airingToday.length || "—"}
              meta={upcoming ? `Next ${clockTime(upcoming.airingAt)}` : "Nothing scheduled"}
              onClick={() => navigate("/browse?sort=Latest_Update")}
            />
            <Panel
              icon={<BsFillPlayFill size={13} />}
              label="Episodes"
              value={activity.episodes}
              meta={activity.episodes ? "Watched on this device" : "Start watching"}
              onClick={() => navigate("/history")}
            />
            <Panel
              icon={<BsClock size={13} />}
              label="Time"
              value={`${activity.hours}h`}
              meta="≈ 24 min per episode"
              onClick={() => navigate("/stats")}
            />
            <Panel
              icon={<BsGraphUpArrow size={13} />}
              label="Tracked"
              value={activity.titles}
              meta={activity.days ? `Active ${activity.days} days` : "In your list"}
              onClick={() => navigate("/mylist")}
            />
          </section>

          {/* ── continue watching ── */}
          {continueWatching.length > 0 && (
            <div className="mt-5">
              <Card
                title="Continue watching"
                meta={`${continueWatching.length} in progress`}
                badge={
                  <IconBadge tone="accent">
                    <BsFillPlayFill size={14} />
                  </IconBadge>
                }
                action={
                  <GhostPill onClick={() => navigate("/history")}>
                    History
                    <BsArrowRight size={10} />
                  </GhostPill>
                }
                flush
                className="rise"
              >
                <div className="px-2 pb-2">
                  {continueWatching.slice(0, 4).map((p) => (
                    <ListRow
                      key={`${p.id}-${p.ep}`}
                      thumb={p.poster}
                      title={p.title}
                      meta={`Episode ${p.ep} · ${p.lang.toUpperCase()}`}
                      className="cursor-pointer"
                      onClick={() => navigate(`/watch/${p.id}/${p.ep}?lang=${p.lang}`)}
                      right={
                        <BlackPill
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/watch/${p.id}/${p.ep}?lang=${p.lang}`);
                          }}
                        >
                          Resume
                        </BlackPill>
                      }
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── trending collage ── */}
          {trending.length >= 3 && (
            <div className="mt-5">
              <Card
                title="Trending now"
                meta="Popular this week"
                badge={
                  <IconBadge tone="warm">
                    <BsStarFill size={13} />
                  </IconBadge>
                }
                action={
                  <GhostPill onClick={() => navigate("/browse?sort=Trending")}>See all</GhostPill>
                }
                className="rise"
              >
                <div className="flex items-end justify-center py-5">
                  {trending.slice(0, 3).map((s, i) => (
                    <Link
                      key={s._id}
                      to={`/anime/${s._id}`}
                      className="group relative shrink-0 transition-transform duration-500 ease-out hover:z-30 hover:-translate-y-3"
                      style={{
                        transform: `rotate(${[-7, 0, 7][i]}deg)`,
                        marginLeft: i ? -30 : 0,
                        zIndex: i === 1 ? 20 : 10,
                      }}
                    >
                      <Img
                        src={s.thumbnail}
                        alt={s.name}
                        className="h-[188px] w-[133px] rounded-[18px] shadow-[0_18px_44px_-18px_rgba(10,12,24,0.8)] ring-1 ring-black/10"
                      />
                      <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#16181f] text-[11px] font-bold text-white shadow-lg">
                        {i + 1}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 border-t border-black/[0.06] pt-3.5">
                  {trending.slice(0, 3).map((s) => (
                    <Link
                      key={s._id}
                      to={`/anime/${s._id}`}
                      className="max-w-[180px] truncate rounded-full px-2.5 py-1 text-[11.5px] text-[var(--ink-soft)] transition hover:bg-black/[0.04] hover:text-[var(--ink)]"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── for you ── */}
          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {last ? (
              <ActionCard
                icon={<BsArrowRepeat size={14} />}
                title="Pick up where you left off"
                description={`${last.title} · episode ${last.ep} (${last.lang.toUpperCase()})`}
                action={
                  <button
                    onClick={() => navigate(`/watch/${last.id}/${last.ep}?lang=${last.lang}`)}
                    className="press glass-strong inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/25"
                  >
                    <BsFillPlayFill size={12} />
                    Resume
                  </button>
                }
              />
            ) : (
              <ActionCard
                icon={<BsShuffle size={14} />}
                title="Nothing in progress"
                description="Let us pick something for you, or browse the catalog."
                action={
                  <button
                    onClick={() => navigate("/surprise")}
                    className="press glass-strong inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/25"
                  >
                    Surprise me
                  </button>
                }
              />
            )}

            {upcoming && (
              <ActionCard
                icon={<BsClock size={14} />}
                title={`${upcoming.show.name} ${countdown(upcoming.airingAt)}`}
                description={
                  upcoming.episode
                    ? `Episode ${upcoming.episode} is next up.`
                    : "A new episode is on the way."
                }
                action={
                  <button
                    onClick={() => navigate(`/anime/${upcoming.show._id}`)}
                    className="press glass-strong inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/25"
                  >
                    Open series
                  </button>
                }
              />
            )}

            <ActionCard
              icon={<BsBookmarkHeart size={14} />}
              title="Your list"
              description={
                activity.titles > 0
                  ? `${activity.titles} title${activity.titles > 1 ? "s" : ""} saved on this device.`
                  : "Save titles and they'll show up here."
              }
              action={
                activity.titles > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <SuccessChip>{activity.episodes} watched</SuccessChip>
                    <button
                      onClick={() => navigate("/mylist")}
                      className="press glass-strong inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/25"
                    >
                      Open
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/browse")}
                    className="press glass-strong inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/25"
                  >
                    Browse catalog
                  </button>
                )
              }
            />
          </section>

          {/* ── airing + top rated ── */}
          <section className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
            {schedule.length > 0 && (
              <Card
                title="Airing today"
                meta={airingToday.length ? `${airingToday.length} episodes` : "Next up this week"}
                badge={
                  <IconBadge tone="ink">
                    <BsClock size={14} />
                  </IconBadge>
                }
                action={
                  <GhostPill onClick={() => navigate("/browse?sort=Latest_Update")}>Browse</GhostPill>
                }
                className="rise"
              >
                {(airingToday.length ? airingToday : schedule).slice(0, 5).map((e) => (
                  <InfoRow
                    key={`${e.show._id}-${e.airingAt}`}
                    label={
                      <Link to={`/anime/${e.show._id}`} className="transition hover:text-[var(--ink)]">
                        {e.show.name}
                        {e.episode ? (
                          <span className="text-[var(--ink-faint)]"> · Ep {e.episode}</span>
                        ) : null}
                      </Link>
                    }
                    value={
                      <span className="flex items-center gap-2">
                        <span className="text-[var(--ink-soft)]">{clockTime(e.airingAt)}</span>
                        <span className="chip-dark">{countdown(e.airingAt)}</span>
                      </span>
                    }
                  />
                ))}
              </Card>
            )}

            {topRated && (
              <div className="card-light rise flex flex-col rounded-[22px] p-4">
                <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-faint)]">
                  <BsStarFill size={9} className="text-amber-400" />
                  Top rated
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={topRated.thumbnail ?? undefined}
                    alt=""
                    className="h-[74px] w-[52px] shrink-0 rounded-[12px] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold tracking-[-0.015em] text-[var(--ink)]">
                      {topRated.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--ink-soft)]">
                      {topRated.type ?? "TV"}
                      {topRated.score ? ` · ★ ${topRated.score.toFixed(1)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <BlackPill
                    className="w-full"
                    onClick={() => navigate(`/anime/${topRated._id}`)}
                  >
                    View series
                    <BsArrowRight size={10} />
                  </BlackPill>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ══════════════ rails ══════════════ */}
        <div className="mt-16 space-y-10">
          <Rail
            title="Recently updated"
            to="/browse?sort=Latest_Update"
            params={{ sortBy: "Latest_Update" }}
          />
          <Rail title="New releases" to="/browse?sort=Recent" params={{ sortBy: "Recent" }} />
          <Rail
            title="This season"
            to="/seasons"
            params={{ season: "Fall", year: 2026, sortBy: "Popular" }}
          />
          <Rail
            title="Top movies"
            to="/browse?types=Movie"
            params={{ types: "Movie", sortBy: "Popular" }}
          />
        </div>

        {/* ══════════════ genres ══════════════ */}
        <Reveal>
          <section className="mt-16">
            <SectionHeader title="Browse by genre" to="/browse" />
            <div className="flex flex-wrap gap-2">
              {GENRES.slice(0, 20).map((g) => (
                <Link
                  key={g}
                  to={`/browse?genres=${encodeURIComponent(g)}`}
                  className="glass press rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  {g}
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        <div className="mt-8 flex items-center gap-2.5">
          <SuccessChip>Catalog live</SuccessChip>
          <Link
            to="/browse"
            className="press glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-white/20"
          >
            <BsCheckLg size={10} strokeWidth={1.2} />
            Browse everything
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
