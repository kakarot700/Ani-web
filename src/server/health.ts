// ─────────────────────────────────────────────────────────────
//  System health monitor — probes the catalog API and every
//  streaming server on boot so the UI can show real status.
// ─────────────────────────────────────────────────────────────
import { create } from "zustand";
import { pingCatalog } from "./allanime";
import { STREAM_SERVERS } from "./stream";

export interface ServerPing {
  id: string;
  label: string;
  ok: boolean;
}

export type HealthStatus = "checking" | "online" | "degraded" | "offline";

interface ApiHealthState {
  status: HealthStatus;
  catalog: boolean | null;
  servers: ServerPing[];
  checkedAt: number | null;
  runChecks: () => Promise<void>;
}

const useApiHealth = create<ApiHealthState>((set, get) => ({
  status: "checking",
  catalog: null,
  servers: STREAM_SERVERS.map((s) => ({ id: s.id, label: s.label, ok: false })),
  checkedAt: null,
  runChecks: async () => {
    if (get().status === "checking" && get().checkedAt !== null) return;
    set({ status: "checking" });

    const probe = (s: (typeof STREAM_SERVERS)[number]): Promise<ServerPing> => {
      const url = s.build({ malId: 20, aniListId: 21 }, 1, "sub");
      if (!url) return Promise.resolve({ id: s.id, label: s.label, ok: false });
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 7000);
      return fetch(url, { mode: "no-cors", signal: controller.signal, cache: "no-store" })
        .then(() => ({ id: s.id, label: s.label, ok: true }))
        .catch(() => ({ id: s.id, label: s.label, ok: false }))
        .finally(() => window.clearTimeout(timer));
    };

    const [catalog, ...pings] = await Promise.all([
      pingCatalog(),
      ...STREAM_SERVERS.map(probe),
    ]);
    const servers = pings as ServerPing[];
    const okCount = servers.filter((s) => s.ok).length;
    const status: HealthStatus = !catalog
      ? "offline"
      : okCount === servers.length
        ? "online"
        : okCount > 0
          ? "degraded"
          : "offline";
    set({ catalog, servers, checkedAt: Date.now(), status });
  },
}));

export default useApiHealth;
