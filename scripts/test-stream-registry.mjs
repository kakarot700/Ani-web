// Functional sanity tests for the ad-mitigation server registry.
// Bundles src/server/stream.ts and asserts URL builders, sandbox
// config, and trusted-first ranking — no network needed.
import { build } from "esbuild";
import { readFileSync } from "fs";

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
const { STREAM_SERVERS, getServer, DEFAULT_IFRAME_SANDBOX } = mod;

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
const ids2 = STREAM_SERVERS.map((s) => s.id);
check("unique ids", new Set(ids2).size === STREAM_SERVERS.length);
check("every server has build()", STREAM_SERVERS.every((s) => typeof s.build === "function"));

console.log("── trusted-first ranking ──");
const trusted = STREAM_SERVERS.filter((s) => (s.priority ?? 1) === 0).map((s) => s.id);
check(
  "priority-0 = anixo, anixo-mal, vidlink, vidplus",
  JSON.stringify(trusted.sort()) === JSON.stringify(["anixo", "anixo-mal", "vidlink", "vidplus"]),
  JSON.stringify(trusted)
);
check("legacy servers default to priority 1", (getServer("megaplay").priority ?? 1) === 1);

console.log("── sandbox policy ──");
for (const s of STREAM_SERVERS) {
  if (s.id === "anixo" || s.id === "anixo-mal") {
    check(`${s.id} opts out of sandbox (Anixo refuses sandboxed embeds)`, s.sandbox === null);
  } else {
    const effective = s.sandbox === undefined ? DEFAULT_IFRAME_SANDBOX : s.sandbox;
    check(
      `${s.id} sandboxed (no popups / no top-navigation)`,
      effective === DEFAULT_IFRAME_SANDBOX &&
        !effective.includes("allow-popups") &&
        !effective.includes("allow-top-navigation")
    );
  }
}

console.log("── new URL builders (verified against provider docs) ──");
check(
  "anixo  → /embed/ani/{al}/{ep}?track=sub",
  getServer("anixo").build(ids, 1, "sub") === "https://anixo.buzz/embed/ani/1/1?track=sub",
  getServer("anixo").build(ids, 1, "sub")
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
  getServer("vidlink").build(ids, 1, "sub") ===
    "https://vidlink.pro/anime/21/1/sub?fallback=true",
  getServer("vidlink").build(ids, 1, "sub")
);
check(
  "vidlink dub",
  getServer("vidlink").build(ids, 4, "dub") === "https://vidlink.pro/anime/21/4/dub?fallback=true"
);
check(
  "vidplus sub → no dub param",
  getServer("vidplus").build(ids, 1, "sub") ===
    "https://player.vidplus.to/embed/anime/1/1",
  getServer("vidplus").build(ids, 1, "sub")
);
check(
  "vidplus dub → ?dub=true",
  getServer("vidplus").build(ids, 1, "dub") ===
    "https://player.vidplus.to/embed/anime/1/1?dub=true"
);

console.log("── null-id guards (server unavailable → skipped by auto-pilot) ──");
const noIds = { malId: null, aniListId: null };
check("all builders return null without ids", STREAM_SERVERS.every((s) => s.build(noIds, 1, "sub") === null));

console.log("── legacy builders untouched ──");
check(
  "megaplay unchanged",
  getServer("megaplay").build(ids, 5, "dub") === "https://megaplay.buzz/stream/mal/21/5/dub"
);
check(
  "vidy unchanged (sub-only)",
  getServer("vidy").build(ids, 1, "sub") === "https://www.vidy.st/anime/1/1?nextEpisode=true" &&
    getServer("vidy").langs.join(",") === "sub"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
