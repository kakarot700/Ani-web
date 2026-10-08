import React from "react";
import useApiHealth from "@/server/health";

const SystemStatus: React.FC = () => {
  const { status, catalog, servers, checkedAt, runChecks } = useApiHealth();
  const okCount = servers.filter((s) => s.ok).length;

  const dot =
    status === "online"
      ? "bg-[var(--success)]"
      : status === "degraded"
        ? "bg-amber-400"
        : status === "offline"
          ? "bg-rose-400"
          : "bg-white/50";

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
        `Catalog: ${catalog === null ? "checking" : catalog ? "online" : "offline"}`,
        ...servers.map((s) => `${s.label}: ${s.ok ? "online" : "offline"}`),
        checkedAt ? `Last check ${new Date(checkedAt).toLocaleTimeString()}` : "",
        "Click to re-check",
      ]
        .filter(Boolean)
        .join("\n")}
      className="glass mt-4 inline-flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-3.5 transition hover:bg-white/20"
    >
      <span className="relative flex h-2 w-2">
        {status !== "offline" && status !== "checking" && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dot}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="text-[11.5px] font-medium text-white/75">{label}</span>
    </button>
  );
};

export default SystemStatus;
