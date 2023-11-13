/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * service-worker.js: This file contains the service worker for the PWA.
 */

self.addEventListener('activate', (event) => {
   event.waitUntil(self.clients.claim());
});

self.addEventListener('push', async (event) => {
   const data = event.data.json();
   if (data.type !== 'new_transactions') {
      /* Ignore */
      return;
   }
   const title = 'New Transactions';
   const body = `${data.count} new transaction${data.count > 1 ? 's' : ''} found`;
   const icon = '/favicon.ico';
   const badge = '/badge.png';
   event.waitUntil(self.registration.showNotification(title, { body, icon, badge }));
});

self.addEventListener('notificationclick', (event) => {
   console.log(event);
   event.notification.close();
   event.waitUntil(self.clients.openWindow('/allocations/0'));
});
