/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * service-worker.js: This file contains the service worker for the PWA. It is
 *                    based on the 'basic' template provided by PWABuilder. See
 *                    https://github.com/pwa-builder/PWABuilder/blob/main/docs/sw.js
 *                    for more info.
 */

const HOSTNAME_WHITELIST = [self.location.hostname, 'fonts.gstatic.com', 'fonts.googleapis.com', 'cdn.jsdelivr.net'];

const getFixedUrl = (req) => {
   var now = Date.now();
   var url = new URL(req.url);
   url.protocol = self.location.protocol;
   if (url.hostname === self.location.hostname) {
      url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
   }
   return url.href;
};

self.addEventListener('activate', (event) => {
   event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
   if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) > -1) {
      const cached = caches.match(event.request);
      const fixedUrl = getFixedUrl(event.request);
      const fetched = fetch(fixedUrl, { cache: 'no-store' });
      const fetchedCopy = fetched.then((resp) => resp.clone());

      event.respondWith(
         Promise.race([fetched.catch((_) => cached), cached]) /* eslint-disable-line @typescript-eslint/no-unused-vars */
            .then((resp) => resp || fetched)
            .catch((_) => { /* eslint-disable-line @typescript-eslint/no-unused-vars */
               /* eat any errors */
            })
      );

      event.waitUntil(
         Promise.all([fetchedCopy, caches.open('pwa-cache')])
            .then(([response, cache]) => response.ok && cache.put(event.request, response))
            .catch((_) => { /* eslint-disable-line @typescript-eslint/no-unused-vars */
               /* eat any errors */
            })
      );
   }
});
