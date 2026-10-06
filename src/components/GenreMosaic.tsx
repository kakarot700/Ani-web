import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import Img from "./Img";
import { searchShows } from "@/server/allanime";

const MOSAIC_GENRES = [
  { genre: "Action", jp: "アクション" },
  { genre: "Fantasy", jp: "ファンタジー" },
  { genre: "Romance", jp: "ロマンス" },
  { genre: "Sci-Fi", jp: "SF" },
  { genre: "Comedy", jp: "コメディ" },
  { genre: "Horror", jp: "ホラー" },
  { genre: "Sports", jp: "スポーツ" },
  { genre: "Mystery", jp: "ミステリー" },
];

interface Tile {
  genre: string;
  jp: string;
  thumb: string | null;
}

const GenreMosaic: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all(
      MOSAIC_GENRES.map((g) =>
        searchShows({ genres: g.genre, types: "TV", sortBy: "Popular", limit: 3 })
          .then((p) => ({
            genre: g.genre,
            jp: g.jp,
            thumb: p.shows.find((s) => s.thumbnail)?.thumbnail ?? null,
          }))
          .catch(() => ({ genre: g.genre, jp: g.jp, thumb: null }))
      )
    ).then((t) => alive && setTiles(t));
    return () => {
      alive = false;
    };
  }, []);

  if (tiles.length === 0) {
    return (
      <section className="px-4 md:px-12">
        <div className="grid h-40 grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-12">
      <SectionHeader title="Browse by Genre" jp="ジャンルで探す" to="/browse" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.genre}
            to={`/browse?genres=${encodeURIComponent(t.genre)}`}
            className="group relative aspect-[16/9] overflow-hidden rounded-xl ring-1 ring-zinc-800 transition hover:-translate-y-1 hover:ring-red-600/70"
          >
            <Img
              src={t.thumb}
              alt={`${t.genre} anime`}
              className="absolute inset-0"
              imgClassName="transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-display text-xl tracking-wide text-white transition group-hover:text-red-500">
                {t.genre}
              </p>
              <p className="font-jp text-[10px] tracking-[0.3em] text-zinc-400">{t.jp}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GenreMosaic;
