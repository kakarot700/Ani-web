import React, { useCallback, useMemo } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";
import { AiOutlinePlus, AiOutlineCheck } from "react-icons/ai";

interface FavoriteButtonProps {
  movieId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movieId }) => {
  const { data: currentUser, setFavorites } = useCurrentUser();

  const isFavorite = useMemo(
    () => (currentUser.favoriteIds ?? []).includes(movieId),
    [currentUser, movieId]
  );

  const toggleFavorite = useCallback(() => {
    const list = currentUser.favoriteIds ?? [];
    setFavorites(isFavorite ? list.filter((id) => id !== movieId) : [...list, movieId]);
  }, [movieId, isFavorite, currentUser, setFavorites]);

  const Icon = isFavorite ? AiOutlineCheck : AiOutlinePlus;

  return (
    <div
      onClick={toggleFavorite}
      className="cursor-pointer group/item w-6 h-6 lg:w-10 lg:h-10 border-white border-2 rounded-full flex justify-center items-center transition hover:border-neutral-300"
    >
      <Icon className="text-white" size={25} />
    </div>
  );
};

export default FavoriteButton;
