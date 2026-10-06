import aotPoster from "@/assets/aot.jpg";
import deathNotePoster from "@/assets/deathnote.jpg";
import demonSlayerPoster from "@/assets/demonslayer.jpg";
import narutoPoster from "@/assets/naruto.jpg";
import onePiecePoster from "@/assets/onepiece.jpg";

import aotEn from "@/assets/subs/attack-on-titan.en.vtt?raw";
import aotJa from "@/assets/subs/attack-on-titan.ja.vtt?raw";
import deathNoteEn from "@/assets/subs/death-note.en.vtt?raw";
import deathNoteJa from "@/assets/subs/death-note.ja.vtt?raw";
import demonSlayerEn from "@/assets/subs/demon-slayer.en.vtt?raw";
import demonSlayerJa from "@/assets/subs/demon-slayer.ja.vtt?raw";
import narutoEn from "@/assets/subs/naruto.en.vtt?raw";
import narutoJa from "@/assets/subs/naruto.ja.vtt?raw";
import onePieceEn from "@/assets/subs/one-piece.en.vtt?raw";
import onePieceJa from "@/assets/subs/one-piece.ja.vtt?raw";

import type { SubtitleTrack } from "@/components/OtakuPlayer";

const vttUrlCache = new Map<string, string>();
const vttUrl = (content: string): string => {
  let url = vttUrlCache.get(content);
  if (!url) {
    url = URL.createObjectURL(new Blob([content], { type: "text/vtt" }));
    vttUrlCache.set(content, url);
  }
  return url;
};

const VIDEO_BASE =
  "https://raw.githubusercontent.com/NegativE333/Otaku/main/public/videos";

export interface Movie {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  genre: string;
  duration: string;
  year: string;
  rating: string;
  malId?: number;
  subtitles: SubtitleTrack[];
}

const cc = (en: string, ja: string): SubtitleTrack[] => [
  { label: "English (SDH)", lang: "en", src: vttUrl(en) },
  { label: "日本語", lang: "ja", src: vttUrl(ja) },
];

export const movies: Movie[] = [
  {
    id: "attack-on-titan",
    title: "Attack on Titan",
    description:
      "Eren Yeager lives in a world where humanity hides behind giant walls from man-eating Titans. After his home is destroyed, he vows revenge and joins the elite Scout Regiment to take back the world outside the walls.",
    videoUrl: `${VIDEO_BASE}/aot2.mp4`,
    thumbnailUrl: aotPoster,
    genre: "Action · Dark Fantasy",
    duration: "89",
    year: "2013",
    rating: "R",
    subtitles: cc(aotEn, aotJa),
  },
  {
    id: "death-note",
    title: "Death Note",
    description:
      "Genius high school student Light Yagami discovers a supernatural notebook that grants him the power to kill anyone whose name he writes in it. As he cleanses the world of criminals, the world's greatest detective is hot on his trail.",
    videoUrl: `${VIDEO_BASE}/deathNote2.mp4`,
    thumbnailUrl: deathNotePoster,
    genre: "Thriller · Supernatural",
    duration: "37",
    year: "2006",
    rating: "TV-14",
    subtitles: cc(deathNoteEn, deathNoteJa),
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    description:
      "When demons slaughter his family and turn his sister into one of them, Tanjiro Kamado joins the Demon Slayer Corps. He fights to find a cure for his sister and avenge his fallen loved ones.",
    videoUrl: `${VIDEO_BASE}/demonSlayer2.mp4`,
    thumbnailUrl: demonSlayerPoster,
    genre: "Action · Adventure",
    duration: "55",
    year: "2019",
    rating: "TV-14",
    subtitles: cc(demonSlayerEn, demonSlayerJa),
  },
  {
    id: "naruto",
    title: "Naruto",
    description:
      "Naruto Uzumaki, a young ninja shunned by his village for the Nine-Tailed Fox sealed inside him, dreams of earning everyone's respect and one day becoming the Hokage — the leader of the Hidden Leaf Village.",
    videoUrl: `${VIDEO_BASE}/naruto2.mp4`,
    thumbnailUrl: narutoPoster,
    genre: "Action · Adventure",
    duration: "220",
    year: "2002",
    rating: "TV-14",
    subtitles: cc(narutoEn, narutoJa),
  },
  {
    id: "one-piece",
    title: "One Piece",
    description:
      "Monkey D. Luffy and his ragtag pirate crew sail the Grand Line in search of the legendary One Piece, the treasure that will crown its finder as the King of the Pirates.",
    videoUrl: `${VIDEO_BASE}/onePiece2.mp4`,
    thumbnailUrl: onePiecePoster,
    genre: "Adventure · Comedy",
    duration: "1090",
    year: "1999",
    rating: "TV-14",
    subtitles: cc(onePieceEn, onePieceJa),
  },
];

export const getMovie = (id?: string): Movie | undefined =>
  movies.find((movie) => movie.id === id);

export const getRandomMovie = (): Movie =>
  movies[Math.floor(Math.random() * movies.length)];
