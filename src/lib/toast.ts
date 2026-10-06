import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  kind: "info" | "success" | "error";
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, kind?: Toast["kind"]) => void;
  remove: (id: number) => void;
}

let counter = 0;

const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, kind = "info") => {
    const id = ++counter;
    set((state) => ({ toasts: [...state.toasts.slice(-3), { id, message, kind }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export default useToasts;
