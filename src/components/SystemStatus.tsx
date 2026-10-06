import React from "react";
import useApiHealth from "@/server/health";

const SystemStatus: React.FC = () => {
  const { status, catalog, servers, checkedAt, runChecks } = useApiHealth();
  const okCount = servers.filter((s) => s.ok).length;

  const dot =
    status === "online"
      ? "bg-emerald-500"
      : status === "degraded"
        ? "bg-yellow-500"
        : status === "offline"
          ? "bg-red-600"
          : "bg-zinc-500";

  const label =
    status === "online"
      ? "All systems operational"
      : status === "degraded"
        ? `${servers.length - okCount} server${servers.length - okCount > 1 ? "s" : ""} degraded`
        : status === "offline"
          ? catalog === false
            ? "Catalog unreachable"
            : "Streaming servers down"
          : "Checking systems…";

  return (
    <button
      onClick={() => void runChecks()}
      title={[
        `Catalog API: ${catalog === null ? "checking" : catalog ? "online" : "offline"}`,
        ...servers.map((s) => `${s.label}: ${s.ok ? "online" : "offline"}`),
        checkedAt ? `Last check ${new Date(checkedAt).toLocaleTimeString()}` : "",
        "Click to re-check",
      ]
        .filter(Boolean)
        .join("\n")}
      className="group mt-4 inline-flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/80 py-1.5 pl-2.5 pr-3.5 transition hover:border-zinc-600"
    >
      <span className="relative flex h-2 w-2">
        {status !== "offline" && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot} ${status === "checking" ? "animate-pulse" : ""}`} />
      </span>
      <span className="text-[11px] font-semibold text-zinc-400 transition group-hover:text-zinc-200">
        {label}
      </span>
      <span className="font-jp text-[9px] tracking-[0.25em] text-zinc-600">接続状態</span>
    </button>
  );
};

export default SystemStatus;
