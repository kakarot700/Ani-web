import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsArrowLeft, BsHouseDoorFill } from "react-icons/bs";
import Navbar from "@/components/Navbar";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* giant ghost kanji */}
        <p
          className="font-jp pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[46vw] font-bold leading-none text-white/[0.03]"
          aria-hidden="true"
        >
          迷
        </p>

        <div className="relative animate-[fadeup_0.5s_ease]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-red-500">
            Error 404 · ページが見つからない
          </p>

          <h1 className="font-display mt-4 text-8xl leading-none tracking-wide text-white md:text-[11rem]">
            LOST
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
            This page wandered off into the Infinite Tsukuyomi. Let's get you back
            to the real world.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="press flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_30px_-6px_var(--red-glow)] transition hover:bg-red-500"
            >
              <BsHouseDoorFill size={16} />
              Back to Home
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="press flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-bold text-zinc-300 ring-1 ring-zinc-700 transition hover:bg-zinc-800 hover:text-white"
            >
              <BsArrowLeft size={15} />
              Go Back
            </button>
          </div>

          <p className="font-jp mt-10 text-[10px] tracking-[0.5em] text-zinc-600">
            道に迷ったら、ホームへ
          </p>
        </div>
      </div>
    </>
  );
};

export default NotFound;
