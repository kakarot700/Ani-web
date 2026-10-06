import React from "react";
import { BsCheckCircleFill, BsInfoCircleFill, BsXCircleFill } from "react-icons/bs";
import useToasts from "@/lib/toast";

const Toaster: React.FC = () => {
  const { toasts, remove } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => remove(t.id)}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border px-4 py-3 text-left text-sm font-semibold shadow-2xl backdrop-blur animate-[fadeup_0.3s_ease] ${
            t.kind === "success"
              ? "border-emerald-600/40 bg-emerald-950/90 text-emerald-200"
              : t.kind === "error"
                ? "border-red-600/40 bg-red-950/90 text-red-200"
                : "border-zinc-700 bg-zinc-900/95 text-zinc-100"
          }`}
        >
          {t.kind === "success" ? (
            <BsCheckCircleFill className="shrink-0 text-emerald-400" size={16} />
          ) : t.kind === "error" ? (
            <BsXCircleFill className="shrink-0 text-red-400" size={16} />
          ) : (
            <BsInfoCircleFill className="shrink-0 text-red-500" size={16} />
          )}
          <span className="min-w-0">{t.message}</span>
        </button>
      ))}
    </div>
  );
};

export default Toaster;
