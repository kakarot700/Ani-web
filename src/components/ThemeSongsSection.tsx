import React, { useRef, useState } from "react";
import { BsFillPauseFill, BsFillPlayFill, BsMusicNoteBeamed } from "react-icons/bs";
import SectionHeader from "./SectionHeader";
import type { ThemeSong } from "@/server/allanime";

interface ThemeSongsSectionProps {
  themes: ThemeSong[];
}

const ThemeSongsSection: React.FC<ThemeSongsSectionProps> = ({ themes }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  if (themes.length === 0) return null;

  const toggle = (idx: number, song: ThemeSong) => {
    const url = song.audioUrl;
    if (!url) return;
    if (playingIdx === idx) {
      audioRef.current?.pause();
      setPlayingIdx(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingIdx(null);
    audio.onerror = () => setPlayingIdx(null);
    void audio.play();
    setPlayingIdx(idx);
  };

  const openings = themes.filter((t) => /opening/i.test(t.type));
  const endings = themes.filter((t) => /ending/i.test(t.type));
  const groups: { label: string; jp: string; items: ThemeSong[] }[] = [
    { label: "Openings", jp: "OP", items: openings },
    { label: "Endings", jp: "ED", items: endings },
  ].filter((g) => g.items.length > 0);

  return (
    <div>
      <SectionHeader title="Theme Songs" jp="主題歌" />
      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
              {group.label} <span className="text-red-500">· {group.jp}</span>
            </p>
            <div className="space-y-2">
              {group.items.map((song) => {
                const idx = themes.indexOf(song);
                const isPlaying = playingIdx === idx;
                return (
                  <button
                    key={`${group.label}-${song.title}-${idx}`}
                    onClick={() => toggle(idx, song)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${
                      isPlaying
                        ? "border-red-600 bg-red-600/10"
                        : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                        isPlaying ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {isPlaying ? (
                        <BsFillPauseFill size={14} className={playingIdx === idx ? "animate-pulse" : ""} />
                      ) : (
                        <BsFillPlayFill size={14} className="ml-0.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{song.title}</span>
                      <span className="block text-[10px] text-zinc-500">{group.label} theme</span>
                    </span>
                    <BsMusicNoteBeamed size={14} className="shrink-0 text-zinc-600" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSongsSection;
