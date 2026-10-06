import useInfoModal from "@/hooks/useInfoModal";
import { useNavigate } from "react-router-dom";
import React from "react";
import { BsFillPlayFill } from "react-icons/bs";
import FavoriteButton from "./FavoriteButton";
import { BiChevronDown } from "react-icons/bi";
import type { Movie } from "@/lib/movies";

interface MovieCardProps {
  data: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ data }) => {
  const navigate = useNavigate();
  const { openModal } = useInfoModal();
  return (
    <div className="group bg-zinc-900 col-span relative h-[12vw]">
      <img
        className="cursor-pointer object-cover transition duration shadow-xl rounded-md group-hover:opacity-90 sm:group-hover:opacity-0 delay-300 w-full h-[12vw]"
        src={data?.thumbnailUrl}
        alt="Thumbnail"
      />
      <div className="opacity-0 absolute top-0 transition duration-200 z-10 invisible sm:visible delay-300 w-full scale-0 group-hover:scale-110 group-hover:-translate-y-[6vw] group-hover:translate-x-[2vw] group-hover:opacity-100">
        <img
          className="cursor-pointer object-cover transition duration shadow-xl rounded-t-md w-full h-[12vw]"
          src={data?.thumbnailUrl}
          alt="Thumbnail"
        />
        <div className="z-10 bg-zinc-900/95 p-2 lg:p-4 absolute w-full transition shadow-xl rounded-b-md ring-1 ring-zinc-700">
          <div className="flex flex-row items-center gap-3">
            <div
              className="cursor-pointer w-6 h-6 lg:w-10 lg:h-10 bg-white rounded-full flex justify-center items-center transition hover:bg-neutral-300"
              onClick={() => navigate(`/play/${data?.id}`)}
            >
              <BsFillPlayFill size={30} />
            </div>
            <FavoriteButton movieId={data.id} />
            <div
              onClick={() => openModal(data?.id)}
              className="cursor-pointer ml-auto group/item w-6 h-6 lg:w-10 lg:h-10 border-white border-2 rounded-full flex justify-center items-center transition hover:border-neutral-300"
            >
              <BiChevronDown
                className="text-white group-hover/item:text-neutral-300 w-4"
                size={30}
              />
            </div>
          </div>
          <p className="text-white font-bold mt-4 leading-tight">{data.title}</p>
          <div className="flex flex-row mt-3 gap-2 items-center">
            <span className="rounded-sm bg-red-600/90 px-1 py-px text-[8px] font-extrabold uppercase text-white">
              Clip
            </span>
            <p className="text-zinc-400 text-[10px] lg:text-xs">{data.duration} episodes</p>
          </div>
          <div className="flex flex-row mt-2 gap-2 items-center">
            <p className="text-zinc-500 text-[10px] lg:text-xs">{data.genre}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
