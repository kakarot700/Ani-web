import { useMemo, useState } from "react";
import { getMovie, getRandomMovie, movies, type Movie } from "@/lib/movies";
import useFavoriteIds from "@/lib/favorites";

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
  const ids = useFavoriteIds((s) => s.ids);
  const data = useMemo(
    () => movies.filter((movie) => ids.includes(movie.id)),
    [ids]
  );
  return { data, error: null, isLoading: false };
};
