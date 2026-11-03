// SPDX-License-Identifier: GPL-3.0-only
// FOUROBOROS V1 installer — the page without internet (same pattern as the
// SLOOP site's sw.js): opened once online, the installer page, its exact
// firmware package and the manual are kept by the browser and work offline,
// still on https (on Android a downloaded file opens as content://, where
// Chrome refuses MIDI). Online the network always wins; the copy is only
// the fallback. Any change to the kept files makes a new stamp below.
const STAMP = "fouroboros-v1-04d0e62-installer-1.0.0";
const CACHE = "fouroboros-site-" + STAMP;
const FILES = [
  "./", "index.html", "manual.html", "gate.js", "release-manifest.json",
  "felucca-04d0e62.fwsc", "fouroboros.webmanifest",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png",
  "assets/attract-host-render.png", "assets/board-host-render.png",
  "../web/fm1ota.js", "../web/fm1pkg.js",
];
const KEEP = new Set(FILES.map((f) => new URL(f, self.location).href));

const key = (url) => {
  const u = new URL(url);
  u.search = "";
  u.hash = "";
  if (u.pathname.endsWith("/index.html")) u.pathname = u.pathname.slice(0, -10);
  return u.href;
};

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })));   // all or nothing
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys())
      if (k.startsWith("fouroboros-site-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const k = key(req.url);
  if (!KEEP.has(k)) return;
  e.respondWith((async () => {
    try {
      const r = await fetch(req.url, { cache: "no-cache" });
      if (r.ok) {
        const copy = r.clone();
        e.waitUntil(caches.open(CACHE).then((c) => c.put(k, copy)).catch(() => {}));
      }
      return r;
    } catch (err) {
      const hit = await caches.match(k, { cacheName: CACHE });
      if (hit) return hit;
      throw err;
    }
  })());
});
