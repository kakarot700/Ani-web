// ─────────────────────────────────────────────────────────────
//  Connectivity state — flipped when the API layer has to serve
//  cached data because the network failed.
// ─────────────────────────────────────────────────────────────
import { create } from "zustand";

interface ConnectivityState {
  offline: boolean;
  servedFromCache: boolean;
  setOffline: (offline: boolean, fromCache: boolean) => void;
}

const useConnectivity = create<ConnectivityState>((set) => ({
  offline: false,
  servedFromCache: false,
  setOffline: (offline, servedFromCache) => set({ offline, servedFromCache }),
}));

export default useConnectivity;
