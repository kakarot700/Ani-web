import React, { useEffect, useMemo, useState } from "react";
import { BsFillStarFill, BsHandThumbsUp, BsHandThumbsUpFill } from "react-icons/bs";
import { BlackPill, IconBadge, LightSegmented } from "./ui";
import useToasts from "@/lib/toast";
import useReviews, { sortReviews, type ReviewSort } from "@/lib/reviews";
import useCurrentUser from "@/hooks/useCurrentUser";

interface ReviewsSectionProps {
  animeId: string;
  title: string;
}

const ReviewSkeleton: React.FC = () => (
  <div className="animate-pulse px-5 py-4">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-black/[0.07]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 rounded-full bg-black/[0.07]" />
        <div className="h-2.5 w-16 rounded-full bg-black/[0.05]" />
      </div>
    </div>
    <div className="mt-3 h-3 w-full rounded-full bg-black/[0.05]" />
    <div className="mt-1.5 h-3 w-2/3 rounded-full bg-black/[0.05]" />
  </div>
);

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const t = window.setTimeout(() => {
      seed(animeId, title);
      setMounted(true);
    }, 320);
    return () => window.clearTimeout(t);
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
    add(animeId, { user: user?.name ?? "You", stars, text: t });
    setText("");
    setStars(5);
    push("Review posted ⭐", "success");
  };

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="card-light overflow-hidden rounded-[26px]">
        <header className="flex flex-wrap items-center gap-3 px-5 pb-4 pt-5 md:px-6">
          <IconBadge tone="accent">
            <BsFillStarFill size={13} />
          </IconBadge>
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
              Community reviews
            </h2>
            <p className="text-[12.5px] text-[var(--ink-soft)]">
              {avg !== null
                ? `★ ${avg.toFixed(1)} average across ${reviews.length} review${
                    reviews.length > 1 ? "s" : ""
                  }`
                : "Be the first to review this title"}
            </p>
          </div>
          <LightSegmented
            label="Sort reviews"
            segments={[
              { id: "newest", label: "Newest" },
              { id: "top", label: "Top rated" },
              { id: "liked", label: "Most liked" },
            ]}
            value={sort}
            onChange={setSort}
          />
        </header>

        {/* composer */}
        <div className="px-5 pb-5 md:px-6">
          <div className="rounded-[20px] bg-black/[0.035] p-4">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="press p-0.5"
                >
                  <BsFillStarFill
                    size={19}
                    className={n <= stars ? "text-amber-400" : "text-black/15"}
                  />
                </button>
              ))}
              <span className="tnum ml-1.5 text-[12px] font-semibold text-[var(--ink-soft)]">
                {stars}/5
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder={`Share your thoughts on ${title}…`}
              className="mt-3 w-full resize-none rounded-[16px] bg-white px-3.5 py-3 text-[13.5px] text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none ring-1 ring-black/[0.07] transition focus:ring-[var(--accent)]"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-[var(--ink-faint)]">
                Saved to this browser only — no account needed
              </p>
              <BlackPill onClick={submit}>Post review</BlackPill>
            </div>
          </div>
        </div>

        {/* list */}
        <div className="border-t border-black/[0.07]">
          {!mounted ? (
            <>
              <ReviewSkeleton />
              <div className="border-t border-black/[0.07]">
                <ReviewSkeleton />
              </div>
            </>
          ) : (
            reviews.map((r, i) => (
              <article
                key={r.id}
                className={`px-5 py-4 md:px-6 ${i > 0 ? "border-t border-black/[0.07]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[13px] font-bold text-[var(--accent)]">
                    {r.user.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">
                      {r.user}
                    </p>
                    <p className="text-[11px] text-[var(--ink-faint)]">
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <BsFillStarFill
                        key={n}
                        size={11}
                        className={n <= r.stars ? "text-amber-400" : "text-black/12"}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{r.text}</p>
                <button
                  onClick={() => toggleLike(animeId, r.id)}
                  className={`press mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                    r.likedByMe
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "bg-black/[0.05] text-[var(--ink-soft)] hover:bg-black/10 hover:text-[var(--ink)]"
                  }`}
                >
                  {r.likedByMe ? <BsHandThumbsUpFill size={11} /> : <BsHandThumbsUp size={11} />}
                  <span className="tnum">{r.likes}</span>
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
