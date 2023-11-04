/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * useNotification.ts: This file contains the useNotification custom hook
 */

import { useState } from 'react';
import { useAPI, useRunOnce } from '.';
import { vapidPublicKey } from '../../backend/budget.json';

const isNotificationsSupported = () => 'serviceWorker' in navigator && 'PushManager' in window;

const urlB64ToUint8Array = (base64String: string) => {
   const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
   const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
   const rawData = atob(base64);
   const outputArray = new Uint8Array(rawData.length);
   for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
   }
   return outputArray;
};

export class NotificationError extends Error {
   constructor(errmsg: string) {
      super(errmsg);
      this.name = 'NotificationError';
   }
}

export const useNotification = () => {
   const api = useAPI();
   const [isEnabled, setEnabled] = useState<boolean>(Notification.permission === 'granted');
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);
   const enableQuery = api.useMutationQuery<PushSubscription>({
      method: 'POST',
      url: '/api/notification/',
      onError: () => {
         setEnabled(false);
         setError('Failed to enable notifications');
      },
      onSuccess: () => setError(null),
   });
   const disableQuery = api.useMutationQuery<PushSubscription>({
      method: 'DELETE',
      url: '/api/notification/',
      onError: () => {
         setError('Failed to disable notifications');
      },
      onSuccess: () => {
         setEnabled(false);
         setError(null);
      },
   });

   /* Do an initial check to see if notifications are enabled */
   useRunOnce({
      fn: async () => {
         if (!isNotificationsSupported()) {
            return;
         }
         const swRegistration = await navigator.serviceWorker.ready;
         const subscription = await swRegistration.pushManager.getSubscription();
         if (subscription) {
            /* Make sure the backend has the correct subscription */
            const apiSub = await api.asyncQuery<PushSubscription | null>({
               method: 'GET',
               url: 'api/notification/',
               params: new URLSearchParams({
                  endpoint: subscription.endpoint,
               }),
            });

            setEnabled(true);
            if (!apiSub.data && enableQuery.isIdle) {
               /* Insert the subscription */
               enableQuery.mutate(subscription);
            }
         } else {
            setEnabled(false);
         }
         setIsLoading(false);
      },
   });

   const enable = async () => {
      setIsLoading(true);
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
         /* Subscribe to push notifications */
         try {
            const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);
            const options = { applicationServerKey, userVisibleOnly: true };
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.subscribe(options);
            enableQuery.mutate(subscription);
         } catch (err) {
            setError('Failed to subscribe to notifications');
         }
         setEnabled(true);
      } else {
         setError('Failed to enable notifications');
      }
      setIsLoading(false);
   };

   const disable = async () => {
      setIsLoading(true);
      const swRegistration = await navigator.serviceWorker.ready;
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
         await disableQuery.mutate(subscription);
         subscription?.unsubscribe();
      }
      setEnabled(false);
      setIsLoading(false);
   };

   return { error, isEnabled, isLoading, isSupported: isNotificationsSupported(), enable, disable };
};
