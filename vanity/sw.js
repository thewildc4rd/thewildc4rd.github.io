// Lets the website open without a connection. The app's own files are kept as they're fetched: the page itself
// is always asked for fresh first (so a new version is picked up straight away) and the saved copy is only used
// when that fails; the scripts, fonts and images it loads have names that change with every version, so a saved
// one is always the right one. Nothing from Supabase (your data and photos) goes through here.

const CACHE = 'wardrobe-site-v1';
// The app's own page: the folder this file is served from (the site may live in a folder of its address).
const HOME = self.registration.scope;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

async function save(request, response) {
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Every page of the app is the same file.
    event.respondWith(
      fetch(request)
        .then((response) => save(HOME, response))
        .catch(async () => (await caches.match(HOME)) ?? Response.error()),
    );
    return;
  }
  event.respondWith(caches.match(request).then((saved) => saved ?? fetch(request).then((response) => save(request, response))));
});
