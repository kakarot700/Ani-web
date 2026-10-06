import React, { useEffect, useMemo, useState } from "react";
import { BsFillStarFill, BsHandThumbsUp, BsHandThumbsUpFill } from "react-icons/bs";
import SectionHeader from "./SectionHeader";
import useToasts from "@/lib/toast";
import useReviews, { sortReviews, type ReviewSort } from "@/lib/reviews";
import useCurrentUser from "@/hooks/useCurrentUser";

interface ReviewsSectionProps {
  animeId: string;
  title: string;
}

const SORTS: { id: ReviewSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "top", label: "Top Rated" },
  { id: "liked", label: "Most Liked" },
];

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ animeId, title }) => {
  const push = useToasts((s) => s.push);
  const { data: user } = useCurrentUser();
  const seed = useReviews((s) => s.seed);
  const list = useReviews((s) => s.list);
  const add = useReviews((s) => s.add);
  const toggleLike = useReviews((s) => s.toggleLike);

  const [sort, setSort] = useState<ReviewSort>("newest");
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");

  useEffect(() => {
    seed(animeId, title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId]);

  const reviews = useMemo(() => sortReviews(list(animeId), sort), [list, animeId, sort]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((a, r) => a + r.stars, 0) / reviews.length;
  }, [reviews]);

  const submit = () => {
    const t = text.trim();
    if (!t) {
      push("Write a short review first", "error");
      return;
    }
    add(animeId, {
      user: user?.name ?? "You",
      stars,
      text: t,
    });
    setText("");
    setStars(5);
    push("Review posted ⭐", "success");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader title="Community Reviews" jp="レビュー" />
        <div className="mb-3 flex overflow-hidden rounded-md ring-1 ring-zinc-700">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`px-3.5 py-1.5 text-xs font-bold transition ${
                sort === s.id ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* composer */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="p-0.5 transition hover:scale-125"
            >
              <BsFillStarFill size={22} className={n <= stars ? "text-yellow-400" : "text-zinc-700"} />
            </button>
          ))}
          <span className="ml-2 text-xs font-bold text-zinc-400">{stars}/5</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={`Share your thoughts on ${title}…`}
          className="w-full resize-none rounded-md bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-zinc-700 focus:ring-red-600"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={submit}
            className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-red-500"
          >
            Post Review
          </button>
        </div>
      </div>

      {avg !== null && (
        <p className="mb-3 text-xs text-zinc-500">
          <span className="font-bold text-yellow-400">★ {avg.toFixed(1)}</span> average across{" "}
          {reviews.length} review{reviews.length > 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/20 text-sm font-bold text-red-400 ring-1 ring-red-600/40">
                {r.user.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{r.user}</p>
                <p className="text-[10px] text-zinc-600">
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <BsFillStarFill
                    key={n}
                    size={12}
                    className={n <= r.stars ? "text-yellow-400" : "text-zinc-700"}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{r.text}</p>
            <button
              onClick={() => toggleLike(animeId, r.id)}
              className={`mt-3 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold ring-1 transition ${
                r.likedByMe
                  ? "bg-red-600/15 text-red-400 ring-red-600/40"
                  : "text-zinc-500 ring-zinc-700 hover:text-white"
              }`}
            >
              {r.likedByMe ? <BsHandThumbsUpFill size={12} /> : <BsHandThumbsUp size={12} />}
              {r.likes}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;
