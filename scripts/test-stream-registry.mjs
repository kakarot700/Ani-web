// Functional sanity tests for the ad-mitigation server registry.
// Bundles src/server/stream.ts and asserts URL builders, trusted-first
// ranking, resume-at-time params, and probe ordering — no real network.
import { build } from "esbuild";
import { readFileSync } from "fs";

// pingServer uses window.* timers; provide them under Node.
globalThis.window = { setTimeout, clearTimeout };

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
const { STREAM_SERVERS, getServer, appendResume, probeServers } = mod;

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
check("19 servers", STREAM_SERVERS.length === 19, `got ${STREAM_SERVERS.length}`);
check("unique ids", new Set(STREAM_SERVERS.map((s) => s.id)).size === STREAM_SERVERS.length);
check("every server has build()", STREAM_SERVERS.every((s) => typeof s.build === "function"));
check(
  "no sandbox anywhere (providers detect and refuse it)",
  STREAM_SERVERS.every((s) => s.sandbox === undefined)
);

console.log("── trusted-first ranking ──");
const trusted = STREAM_SERVERS.filter((s) => (s.priority ?? 1) === 0).map((s) => s.id);
check(
  "priority-0 = anixo, anixo-mal, vidlink, vidplus, vidy",
  JSON.stringify(trusted.sort()) ===
    JSON.stringify(["anixo", "anixo-mal", "vidlink", "vidplus", "vidy"]),
  JSON.stringify(trusted)
);
check("legacy servers default to priority 1", (getServer("megaplay").priority ?? 1) === 1);

console.log("── resume-at-time support (verified against provider docs) ──");
check("vidlink resumeKey = startAt", getServer("vidlink").resumeKey === "startAt");
check("vidplus resumeKey = progress", getServer("vidplus").resumeKey === "progress");
check("vidy resumeKey = progress", getServer("vidy").resumeKey === "progress");
check(
  "appendResume → vidlink ?startAt=90",
  appendResume(getServer("vidlink"), "https://vidlink.pro/anime/21/1/sub?fallback=true", 90.7) ===
    "https://vidlink.pro/anime/21/1/sub?fallback=true&startAt=90"
);
check(
  "appendResume → vidplus ?dub=true&progress=600",
  appendResume(getServer("vidplus"), "https://player.vidplus.to/embed/anime/1/1?dub=true", 600) ===
    "https://player.vidplus.to/embed/anime/1/1?dub=true&progress=600"
);
check(
  "appendResume → anixo unchanged (no resume param in its docs)",
  appendResume(getServer("anixo"), "https://anixo.buzz/embed/ani/1/1?track=sub", 120) ===
    "https://anixo.buzz/embed/ani/1/1?track=sub"
);
check(
  "appendResume ignores tiny positions (<5s)",
  appendResume(getServer("vidlink"), "https://vidlink.pro/anime/21/1/sub", 3) ===
    "https://vidlink.pro/anime/21/1/sub"
);

console.log("── URL builders ──");
check(
  "anixo  → /embed/ani/{al}/{ep}?track=sub",
  getServer("anixo").build(ids, 1, "sub") === "https://anixo.buzz/embed/ani/1/1?track=sub"
);
check(
  "anixo dub track",
  getServer("anixo").build(ids, 2, "dub") === "https://anixo.buzz/embed/ani/1/2?track=dub"
);
check(
  "anixo-mal → /embed/mal/{mal}/{ep}?track=sub",
  getServer("anixo-mal").build(ids, 1, "sub") === "https://anixo.buzz/embed/mal/21/1?track=sub"
);
check(
  "vidlink → /anime/{mal}/{ep}/{lang}?fallback=true",
  getServer("vidlink").build(ids, 1, "sub") === "https://vidlink.pro/anime/21/1/sub?fallback=true"
);
check(
  "vidplus sub → no dub param",
  getServer("vidplus").build(ids, 1, "sub") === "https://player.vidplus.to/embed/anime/1/1"
);
check(
  "vidplus dub → ?dub=true",
  getServer("vidplus").build(ids, 1, "dub") === "https://player.vidplus.to/embed/anime/1/1?dub=true"
);
check(
  "vidy sub-only, AniList route",
  getServer("vidy").build(ids, 1, "sub") === "https://www.vidy.st/anime/1/1?nextEpisode=true" &&
    getServer("vidy").langs.join(",") === "sub"
);

console.log("── null-id guards ──");
const noIds = { malId: null, aniListId: null };
check(
  "all builders return null without ids",
  STREAM_SERVERS.every((s) => s.build(noIds, 1, "sub") === null)
);

console.log("── probe ordering: trusted first, then latency ──");
// All servers answer OK, but the NON-trusted ones respond fastest.
// Ranking must still put trusted servers first.
const realFetch = globalThis.fetch;
globalThis.fetch = (url) => {
  const u = String(url);
  const delay = u.includes("vidlink") ? 60 : u.includes("anixo") ? 90 : 5;
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), delay));
};
const results = await probeServers(ids, 1, "sub");
globalThis.fetch = realFetch;
const head = results.slice(0, 5).map((r) => r.id);
check(
  "top 5 = the trusted set (even when slower)",
  JSON.stringify([...head].sort()) === JSON.stringify(["anixo", "anixo-mal", "vidlink", "vidplus", "vidy"]),
  JSON.stringify(head)
);
check(
  "within trusted, faster wins first",
  results[0].id === "vidplus" || results[0].id === "vidy",
  `first=${results[0].id}`
);
check(
  "non-trusted follow after trusted",
  results.slice(5).every((r) => (STREAM_SERVERS.find((s) => s.id === r.id).priority ?? 1) === 1)
);
check("every probed server reported ok", results.every((r) => r.ok));

console.log("── legacy builders untouched ──");
check(
  "megaplay unchanged",
  getServer("megaplay").build(ids, 5, "dub") === "https://megaplay.buzz/stream/mal/21/5/dub"
);
check(
  "tryembed unchanged",
  getServer("tryembed").build(ids, 1, "sub") ===
    "https://tryembed.us.cc/embed/anime/1/1/sub?autoNext=false"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
