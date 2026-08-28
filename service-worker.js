const CACHE_NAME = "shushi-wakarukun-v6";
const APP_SHELL = [
    "./", "./index.html", "./style.css", "./config.js",
    "./lib/calculations.js", "./lib/legacy-migration.js", "./manifest.webmanifest",
    "./icons/icon_no1.png", "./icons/app-icon-192.png",
    "./icons/app-icon-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
    event.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
        .then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
    if(event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    const isAppFile = url.origin === self.location.origin;
    const isTrustedCdn = url.hostname === "cdn.jsdelivr.net";
    if(!isAppFile && !isTrustedCdn) return;

    if(isAppFile && url.pathname.endsWith("/config.js")){
        event.respondWith(fetch(event.request).then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            return response;
        }).catch(() => caches.match(event.request)));
        return;
    }

    if(event.request.mode === "navigate"){
        event.respondWith(fetch(event.request).then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
            return response;
        }).catch(() => caches.match("./index.html")));
        return;
    }

    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
    })));
});
