import React, { useCallback } from "react";
import { AiOutlinePlus, AiOutlineCheck } from "react-icons/ai";
import useFavoriteIds from "@/lib/favorites";
import useToasts from "@/lib/toast";

interface FavoriteButtonProps {
  movieId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movieId }) => {
  const ids = useFavoriteIds((s) => s.ids);
  const toggle = useFavoriteIds((s) => s.toggle);
  const push = useToasts((s) => s.push);

  const isFavorite = ids.includes(movieId);

  const onToggle = useCallback(() => {
    toggle(movieId);
    push(
      isFavorite ? "Removed from Favorites" : "Added to Favorites",
      isFavorite ? "info" : "success"
    );
  }, [movieId, isFavorite, toggle, push]);

  const Icon = isFavorite ? AiOutlineCheck : AiOutlinePlus;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className="group/item flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-white transition hover:border-neutral-300 lg:h-10 lg:w-10"
    >
      <Icon className="text-white" size={25} />
    </button>
  );
};

export default FavoriteButton;
