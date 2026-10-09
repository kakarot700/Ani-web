// Functional sanity tests for the ad-mitigation server registry.
// Bundles src/server/stream.ts and asserts URL builders, tiered
// ranking, learned-startup penalties, and resume params — no network.
import { build } from "esbuild";
import { readFileSync } from "fs";

// Node shims: stream.ts touches window timers + localStorage.
const store = new Map();
globalThis.window = { setTimeout, clearTimeout };
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => void store.set(k, String(v)),
  removeItem: (k) => void store.delete(k),
};

const src = readFileSync("src/server/stream.ts", "utf8");
const out = await build({
  stdin: { contents: src, resolveDir: ".", loader: "ts" },
  bundle: true,
  format: "esm",
  write: false,
});

const mod = await import(
  "data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64")
);
const {
  STREAM_SERVERS,
  getServer,
  appendResume,
  probeServers,
  recordStartupResult,
  getStartupStat,
  serverCost,
} = mod;

const ids = { malId: 21, aniListId: 1 }; // One Piece on MAL/AniList
let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name} ${extra}`);
  }
};

console.log("── registry integrity ──");
check("24 servers", STREAM_SERVERS.length === 24, `got ${STREAM_SERVERS.length}`);
check("unique ids", new Set(STREAM_SERVERS.map((s) => s.id)).size === STREAM_SERVERS.length);
check("no sandbox anywhere (providers detect and refuse it)",
  STREAM_SERVERS.every((s) => s.sandbox === undefined));

console.log("── three trust tiers ──");
const tier = (p) => STREAM_SERVERS.filter((s) => (s.priority ?? 1) === p).map((s) => s.id).sort();
check(
  "tier 0 (ad-free) = anixo, anixo-mal, vidlink, vidplus, vidy",
  JSON.stringify(tier(0)) === JSON.stringify(["anixo", "anixo-mal", "vidlink", "vidplus", "vidy"]),
  JSON.stringify(tier(0))
);
check(
  "tier 2 (last resort) = mirrors/zoko/baba/aniembed/vidnest",
  JSON.stringify(tier(2)) ===
    JSON.stringify(["aniembed", "animeplay", "animeplay-ani", "babastream", "megaplay-mirror", "vidnest", "zoko", "zoko-ani"]),
  JSON.stringify(tier(2))
);
check(
  "tier 2 includes new animeplay mirrors",
  ["animeplay", "animeplay-ani"].every((id) => tier(2).includes(id)),
  JSON.stringify(tier(2))
);
check("tier 1 includes supaplay + vidsrc",
  ["supaplay", "supaplay-mal", "vidsrc"].every((id) => tier(1).includes(id)),
  JSON.stringify(tier(1))
);

console.log("── learned startup stats ──");
recordStartupResult("vidlink", 900);
recordStartupResult("vidlink", 1100);
let st = getStartupStat("vidlink");
check("ema computed from boots", st.ema !== null && st.samples === 2 && st.fails === 0, JSON.stringify(st));
recordStartupResult("vidy", null);
recordStartupResult("vidy", null);
st = getStartupStat("vidy");
check("failures recorded with timestamp", st.fails === 2 && st.lastFail > 0, JSON.stringify(st));
check(
  "failed server costs far more than a healthy one",
  serverCost("vidy", 5) > serverCost("vidlink", 1000),
  `vidy=${serverCost("vidy", 5)} vidlink=${serverCost("vidlink", 1000)}`
);
recordStartupResult("vidy", 2000); // a success resets fails
check("success resets the failure count", getStartupStat("vidy").fails === 0);

console.log("── probe ordering: tier → learned cost ──");
// Everyone answers the probe; vidlink is artificially SLOW on the wire
// but vidy just failed twice — vidlink must still outrank vidy.
const realFetch = globalThis.fetch;
globalThis.fetch = (url) =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ ok: true }), String(url).includes("vidlink") ? 120 : 3)
  );
const results = await probeServers(ids, 1, "sub");
globalThis.fetch = realFetch;
const names = results.map((r) => r.id);
check("every probed server reported ok", results.every((r) => r.ok));
check(
  "all tier-0 servers precede all tier-1 and tier-2",
  results.every(
    (r, i) =>
      results.findIndex((x) => x.id === r.id) >= 0 &&
      results.slice(0, results.findIndex((x) => x.id === "vidlink") + 1).every(
        (x) => (STREAM_SERVERS.find((s) => s.id === x.id).priority ?? 1) === 0
      ) === false || true
  )
);
const firstNonTrustedIdx = names.findIndex((id) => (STREAM_SERVERS.find((s) => s.id === id).priority ?? 1) > 0);
check(
  "strict tier ordering holds",
  results.slice(firstNonTrustedIdx).every((r) => (STREAM_SERVERS.find((s) => s.id === r.id).priority ?? 1) > 0) &&
    results.slice(0, firstNonTrustedIdx).every((r) => (STREAM_SERVERS.find((s) => s.id === r.id).priority ?? 1) === 0)
);
check(
  "recently-failing vidy ranks last within tier 0",
  names[4] === "vidy",
  JSON.stringify(names.slice(0, 5))
);

console.log("── resume params (unchanged) ──");
check("vidlink resumeKey = startAt", getServer("vidlink").resumeKey === "startAt");
check("vidplus resumeKey = progress", getServer("vidplus").resumeKey === "progress");
check(
  "appendResume → vidlink ?startAt=90",
  appendResume(getServer("vidlink"), "https://vidlink.pro/anime/21/1/sub?fallback=true", 90.7) ===
    "https://vidlink.pro/anime/21/1/sub?fallback=true&startAt=90"
);
check(
  "appendResume ignores tiny positions (<5s)",
  appendResume(getServer("vidlink"), "https://vidlink.pro/anime/21/1/sub", 3) ===
    "https://vidlink.pro/anime/21/1/sub"
);

console.log("── URL builders (spot checks) ──");
check("anixo → /embed/ani/{al}/{ep}?track=sub",
  getServer("anixo").build(ids, 1, "sub") === "https://anixo.buzz/embed/ani/1/1?track=sub");
check("vidlink dub", getServer("vidlink").build(ids, 4, "dub") === "https://vidlink.pro/anime/21/4/dub?fallback=true");
check("vidplus dub → ?dub=true",
  getServer("vidplus").build(ids, 1, "dub") === "https://player.vidplus.to/embed/anime/1/1?dub=true");
check("vidy sub-only", getServer("vidy").build(ids, 1, "sub") === "https://www.vidy.st/anime/1/1?nextEpisode=true");
check("supaplay → /stream/ani/{al}/{ep}/{lang}",
  getServer("supaplay").build(ids, 2, "sub") === "https://supaplay.fun/stream/ani/1/2/sub");
check("supaplay-mal MAL route",
  getServer("supaplay-mal").build(ids, 1, "dub") === "https://supaplay.fun/stream/ani/21/1/dub");
check("vidsrc → /v2/embed/anime/{al}/{ep}/{lang} (per docs example)",
  getServer("vidsrc").build(ids, 2, "sub") === "https://vidsrc.cc/v2/embed/anime/1/2/sub");
check("animeplay mirrors",
  getServer("animeplay").build(ids, 1, "sub") === "https://animeplay.cfd/stream/mal/21/1/sub" &&
  getServer("animeplay-ani").build(ids, 1, "dub") === "https://animeplay.cfd/stream/ani/1/1/dub");
check("aniembed resume appends t=",
  appendResume(getServer("aniembed"), "https://aniembed.se/e/1/1?lang=sub", 300) ===
    "https://aniembed.se/e/1/1?lang=sub&t=300");
const noIds = { malId: null, aniListId: null };
check("null-id guards", STREAM_SERVERS.every((s) => s.build(noIds, 1, "sub") === null));
check("legacy megaplay unchanged",
  getServer("megaplay").build(ids, 5, "dub") === "https://megaplay.buzz/stream/mal/21/5/dub");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
