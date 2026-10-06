import { create } from "zustand";

interface PaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const usePalette = create<PaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

export default usePalette;
