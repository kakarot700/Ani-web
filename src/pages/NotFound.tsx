import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsArrowLeft, BsHouseDoorFill, BsShuffle } from "react-icons/bs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlassPill, LabelPill } from "@/components/ui";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main className="page-content-compact mx-auto flex min-h-[78svh] max-w-[720px] flex-col items-center justify-center px-4 text-center">
        <div className="mb-5">
          <LabelPill>Error 404</LabelPill>
        </div>

        <p className="text-[80px] font-semibold leading-none tracking-[-0.06em] text-white/90 md:text-[120px]">
          404
        </p>

        <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white md:text-[32px]">
          This page went missing
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-white/60">
          The link may be broken, or the title might have been removed from the catalog. Let's get
          you back to something watchable.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/"
            className="press inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[var(--ink)] transition hover:bg-white/90"
          >
            <BsHouseDoorFill size={13} />
            Back home
          </Link>
          <Link
            to="/surprise"
            className="press glass inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-white/20"
          >
            <BsShuffle size={13} />
            Surprise me
          </Link>
          <GlassPill onClick={() => navigate(-1)}>
            <BsArrowLeft size={12} />
            Go back
          </GlassPill>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default NotFound;
