import React, { useCallback, useEffect, useState } from "react";

import { AiOutlineClose } from "react-icons/ai";
import { HiOutlineChatAlt2 } from "react-icons/hi";

import PlayButton from "./PlayButton";
import FavoriteButton from "./FavoriteButton";
import useInfoModal from "@/hooks/useInfoModal";
import { useMovie } from "@/hooks/useMovies";
import useFocusTrap from "@/hooks/useFocusTrap";

interface InfoModalProps {
  visable: boolean;
  onClose: any;
}

const InfoModal: React.FC<InfoModalProps> = ({ visable, onClose }) => {
  const [isVisable, setIsVisable] = useState(!!visable);
  const trapRef = useFocusTrap<HTMLDivElement>(visable);

  const { movidId } = useInfoModal();
  const { data } = useMovie(movidId);

  useEffect(() => {
    setIsVisable(!!visable);
  }, [visable]);

  const handleClose = useCallback(() => {
    setIsVisable(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  if (!visable) {
    return null;
  }

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/85 p-4 backdrop-blur-sm transition duration-300"
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={data?.title ? `${data.title} details` : "Anime details"}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl outline-none"
      >
        <div
          className={`${
            isVisable ? "scale-100 opacity-100" : "scale-95 opacity-0"
          } relative flex-auto transform bg-zinc-950 shadow-[0_40px_120px_-20px_rgba(0,0,0,1)] ring-1 ring-zinc-700 transition duration-300`}
        >
          <div className="relative h-72 md:h-96">
            <video
              className="h-full w-full object-cover brightness-[55%]"
              autoPlay
              muted
              loop
              playsInline
              poster={data?.thumbnailUrl}
              src={data?.videoUrl}
            ></video>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40" />
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/70 text-zinc-300 ring-1 ring-white/10 backdrop-blur transition hover:bg-red-600 hover:text-white"
            >
              <AiOutlineClose size={18} />
            </button>
            <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-red-500">
                Classic Clip · 名場面
              </p>
              <p className="font-display mt-1 text-4xl tracking-wide text-white drop-shadow-xl md:text-6xl">
                {data?.title}
              </p>
              <div className="mt-4 flex flex-row items-center gap-3">
                <PlayButton movieId={data?.id as string} />
                <FavoriteButton movieId={data?.id as string} />
              </div>
            </div>
          </div>
          <div className="px-6 py-6 md:px-10 md:py-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-md bg-red-600 px-2 py-0.5 font-bold uppercase tracking-wider text-white">
                New
              </span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">
                {data?.duration} Episodes
              </span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">{data?.year}</span>
              <span className="rounded-md border border-zinc-600 px-2 py-0.5 text-zinc-400">
                {data?.rating}
              </span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">{data?.genre}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">{data?.description}</p>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500">
              <HiOutlineChatAlt2 size={14} className="text-red-500" />
              Full player with CC subtitles, speed control &amp; fullscreen — press Play.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
