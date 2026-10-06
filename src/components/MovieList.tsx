import React from "react";
import MovieCard from "./MovieCard";
import SectionHeader from "./SectionHeader";
import type { Movie } from "@/lib/movies";

interface MovieListProps {
  data: Movie[];
  title: string;
  jp: string;
}

const MovieList: React.FC<MovieListProps> = ({ data, title, jp }) => {
  if (!data || data.length === 0) {
    return null;
  }
  return (
    <div className="px-4 md:px-12">
      <SectionHeader title={title} jp={jp} />
      <div className="grid grid-cols-4 gap-2">
        {data.map((movie) => (
          <MovieCard key={movie.id} data={movie} />
        ))}
      </div>
    </div>
  );
};

export default MovieList;
