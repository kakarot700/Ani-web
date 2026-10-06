import { useMemo, useState } from "react";
import { getMovie, getRandomMovie, movies, type Movie } from "@/lib/movies";
import useCurrentUser from "./useCurrentUser";

export const useMoviesList = () => ({
  data: movies,
  error: null,
  isLoading: false,
});

export const useMovie = (id?: string) => ({
  data: (id ? getMovie(id) : undefined) as Movie | undefined,
  error: null,
  isLoading: false,
});

export const useBillboard = () => {
  const [data] = useState<Movie>(() => getRandomMovie());
  return { data, error: null, isLoading: false };
};

export const useFavorites = () => {
  const { data: user } = useCurrentUser();
  const data = useMemo(
    () =>
      user
        ? movies.filter((movie) =>
            (user.favoriteIds ?? []).includes(movie.id)
          )
        : [],
    [user]
  );
  return { data, error: null, isLoading: false };
};
