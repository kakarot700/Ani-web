#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  Probe every streaming server registered in src/server/stream.ts.
//
//  Embed hosts disappear and start serving error pages without any
//  status-code change, so a plain 200 is not proof. This checks the
//  response *body* for the usual soft-failure shapes as well.
//
//  Usage:
//    npm run check:servers
//    npm run check:servers -- --mal=20 --ep=1
//    npm run check:servers -- --anilist=1735
// ─────────────────────────────────────────────────────────────
import { STREAM_SERVERS } from "../src/server/stream.ts";

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};

const ids = {
  malId: Number(arg("mal", "20")) || null, // 20 = Naruto
  aniListId: Number(arg("anilist", "1735")) || null, // 1735 = Naruto
};
const ep = arg("ep", "1");
const timeoutMs = Number(arg("timeout", "15000"));

// Hosts gate on a Referer, which a real iframe always sends.
const HEADERS = {
  Referer: arg("referer", "https://otaku.example/"),
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

// A response is only "ok" if the body does not look like a failure page.
const FAILURE_SHAPES = [
  /<title>[^<]*\b(error|404|not found|unavailable)\b[^<]*<\/title>/i,
  /\b(error code|file you are looking for|video not found|no video|try again later)\b/i,
  /\battention required\b|\bjust a moment\.\.\.\b/i, // Cloudflare interstitial
];

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal, redirect: "follow" });
    const body = await res.text();
    const ms = Math.round(performance.now() - started);
    const soft = FAILURE_SHAPES.find((re) => re.test(body));
    const ok = res.ok && !soft;
    return { ok, ms, note: res.ok ? (soft ? "soft-error page" : "") : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, ms: Math.round(performance.now() - started), note: err?.name === "AbortError" ? "timeout" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

console.log(`\nProbing ${STREAM_SERVERS.length} servers (MAL ${ids.malId}, AniList ${ids.aniListId}, ep ${ep})\n`);

const rows = [];
for (const server of STREAM_SERVERS) {
  for (const lang of server.langs) {
    const url = server.build(ids, ep, lang);
    if (!url) {
      rows.push([server.label, lang, "-", "no id"].map(String));
      continue;
    }
    const r = await probe(url);
    rows.push([server.label, lang, r.ok ? `${r.ms}ms` : "DOWN", r.ok ? "ok" : r.note].map(String));
  }
}

const width = rows.reduce((w, r) => Math.max(w, r[0].length), 5);
for (const [label, lang, timing, note] of rows) {
  const mark = note === "ok" ? "\u2713" : "\u2717";
  console.log(`  ${mark} ${label.padEnd(width)}  ${lang.padEnd(4)} ${timing.padStart(7)}  ${note}`);
}

const good = rows.filter((r) => r[3] === "ok").length;
console.log(`\n  ${good}/${rows.length} sub/dub combinations healthy\n`);
process.exit(good === 0 ? 1 : 0);
