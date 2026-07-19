/**
 * Concurrency benchmark for the resize API.
 *
 * Fires N resize requests all at once and measures how the server copes:
 * success rate, throughput, and latency distribution. Because the API caps
 * concurrent resizes with a semaphore, requests beyond the cap queue up and
 * wait instead of overwhelming the server — so nothing fails and latency
 * degrades gracefully rather than the whole thing collapsing.
 *
 * Usage:
 *   node benchmark/run.mjs [--url http://localhost:5080] [--n 200] [--size 1500] [--pct 50]
 *
 * Requires the API running and Node 18+ (global fetch/FormData/Blob).
 */

import zlib from "node:zlib";
import { performance } from "node:perf_hooks";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const URL = args.url ?? "http://localhost:5080";
const N = Number(args.n ?? 200);
const SIZE = Number(args.size ?? 1500);
const PCT = Number(args.pct ?? 50);

// --- Minimal, dependency-free PNG encoder (so we generate real load) ---
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const makePng = (size) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 2; // truecolor RGB
  const rowLen = size * 3;
  const raw = Buffer.alloc((rowLen + 1) * size);
  for (let y = 0; y < size; y++) {
    const off = y * (rowLen + 1); // leading filter byte (0 = none)
    for (let x = 0; x < size; x++) {
      const p = off + 1 + x * 3;
      raw[p] = (x * 3) & 0xff;
      raw[p + 1] = (y * 5) & 0xff;
      raw[p + 2] = ((x + y) * 7) & 0xff;
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
};

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

const sendOne = async (bytes) => {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "image/png" }), "load.png");
  form.append("percentage", String(PCT));
  const start = performance.now();
  const res = await fetch(`${URL}/api/resize`, { method: "POST", body: form });
  await res.arrayBuffer(); // drain the body so timing includes the full response
  return { ok: res.ok, status: res.status, ms: performance.now() - start };
};

const main = async () => {
  console.log(`\nConcurrency benchmark → ${URL}`);
  console.log(`Generating a ${SIZE}×${SIZE} PNG and firing ${N} parallel resize requests @ ${PCT}%…\n`);

  const bytes = makePng(SIZE);
  const wallStart = performance.now();
  const results = await Promise.all(Array.from({ length: N }, () => sendOne(bytes)));
  const wallMs = performance.now() - wallStart;

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);

  console.log(`Payload size    : ${(bytes.length / 1024).toFixed(0)} KB`);
  console.log(`Total wall time : ${(wallMs / 1000).toFixed(2)} s`);
  console.log(`Succeeded       : ${ok.length}/${N}`);
  console.log(`Failed          : ${failed.length}`);
  console.log(`Throughput      : ${(N / (wallMs / 1000)).toFixed(1)} req/s`);
  console.log(`Latency p50     : ${percentile(latencies, 50).toFixed(0)} ms`);
  console.log(`Latency p95     : ${percentile(latencies, 95).toFixed(0)} ms`);
  console.log(`Latency max     : ${latencies.at(-1).toFixed(0)} ms`);
  if (failed.length) console.log(`Failure codes   : ${[...new Set(failed.map((r) => r.status))].join(", ")}`);
  console.log("");
};

main().catch((err) => {
  console.error("Benchmark failed:", err.message);
  process.exit(1);
});
