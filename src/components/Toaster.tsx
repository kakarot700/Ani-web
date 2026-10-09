import React from "react";
import { BsCheckCircleFill, BsInfoCircleFill, BsXCircleFill } from "react-icons/bs";
import useToasts from "@/lib/toast";

const Toaster: React.FC = () => {
  const { toasts, remove } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[90] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2 md:bottom-6">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => remove(t.id)}
          className="glass-strong pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-3 text-left text-[13px] font-medium text-white shadow-[0_18px_50px_-24px_rgba(10,12,24,0.9)] animate-[fadeup_0.3s_ease]"
        >
          {t.kind === "success" ? (
            <BsCheckCircleFill className="shrink-0 text-[var(--success)]" size={15} />
          ) : t.kind === "error" ? (
            <BsXCircleFill className="shrink-0 text-rose-300" size={15} />
          ) : (
            <BsInfoCircleFill className="shrink-0 text-white/70" size={15} />
          )}
          <span className="min-w-0">{t.message}</span>
        </button>
      ))}
    </div>
  );
};

export default Toaster;
