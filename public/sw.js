// public/sw.js
const CACHE_VERSION = "v1";
const STATIC_CACHE = `tournament-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tournament-dynamic-${CACHE_VERSION}`;
const API_CACHE = `tournament-api-${CACHE_VERSION}`;

const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
  NETWORK_ONLY: "network-only",
};

const STATIC_RESOURCES = ["/", "/tournament", "/admin", "/manifest.json"];

const CACHE_RULES = [
  {
    pattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: STATIC_CACHE,
    maxAge: 365 * 24 * 60 * 60,
  },
  {
    pattern: /\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60,
  },
  {
    pattern: /\/api\/(?!version)/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: API_CACHE,
    maxAge: 5 * 60,
  },
  {
    pattern: /firebase|firestore/,
    strategy: CACHE_STRATEGIES.NETWORK_ONLY,
  },
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(async (cache) => {
        for (const url of STATIC_RESOURCES) {
          try {
            await cache.add(url);
          } catch (error) {
            console.error(`Failed to cache ${url}:`, error);
          }
        }
      }),
      self.skipWaiting(),
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("tournament-") &&
                !cacheName.includes(CACHE_VERSION)
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  const rule = CACHE_RULES.find((rule) => rule.pattern.test(request.url));

  if (!rule) {
    event.respondWith(
      caches.match(request).then((response) => response || fetch(request))
    );
    return;
  }

  switch (rule.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(request, rule));
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(request, rule));
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(request, rule));
      break;
    case CACHE_STRATEGIES.NETWORK_ONLY:
      event.respondWith(fetch(request));
      break;
    default:
      event.respondWith(fetch(request));
  }
});

async function cacheFirst(request, rule) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse && !isExpired(cachedResponse, rule.maxAge)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(rule.cache);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error(`Cache-first failed for ${request.url}:`, error);
    return cachedResponse || new Response("Network error", { status: 408 });
  }
}

async function networkFirst(request, rule) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(rule.cache);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error(`Network-first failed for ${request.url}:`, error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response("Network error", { status: 408 });
  }
}

async function staleWhileRevalidate(request, rule) {
  const cachedResponse = await caches.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(rule.cache);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch((error) => {
      console.error(`Stale-while-revalidate failed for ${request.url}:`, error);
      return null;
    });

  return cachedResponse || networkPromise;
}

function isExpired(response, maxAge) {
  if (!maxAge) return false;

  const dateHeader = response.headers.get("date");
  if (!dateHeader) return false;

  const date = new Date(dateHeader);
  const now = new Date();
  const age = (now.getTime() - date.getTime()) / 1000;

  return age > maxAge;
}

self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case "CLEAR_ALL_CACHES":
      event.waitUntil(clearAllCaches());
      break;
    case "CLEAR_CACHE_BY_NAME":
      event.waitUntil(caches.delete(payload.cacheName));
      break;
    case "GET_CACHE_INFO":
      event.waitUntil(
        getCacheInfo().then((info) => {
          event.ports[0]?.postMessage(info);
        })
      );
      break;
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((name) => caches.delete(name)));
}

async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    info[name] = keys.length;
  }

  return info;
}
