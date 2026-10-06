import React, { useCallback, useMemo } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";
import { AiOutlinePlus, AiOutlineCheck } from "react-icons/ai";

interface FavoriteButtonProps {
  movieId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movieId }) => {
  const { data: currentUser, mutate } = useCurrentUser();

  const isFavorite = useMemo(() => {
    const list = currentUser?.favoriteIds || [];
    return list.includes(movieId);
  }, [currentUser, movieId]);

  const toggleFavorite = useCallback(() => {
    if (!currentUser) {
      return;
    }
    const updatedFavoriteIds = isFavorite
      ? currentUser.favoriteIds.filter((id) => id !== movieId)
      : [...currentUser.favoriteIds, movieId];

    mutate({
      ...currentUser,
      favoriteIds: updatedFavoriteIds,
    });
  }, [movieId, isFavorite, currentUser, mutate]);

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
