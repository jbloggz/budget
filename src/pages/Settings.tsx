/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Settings.tsx: This file contains the settings page component
 */

import { FormControl, FormHelperText, FormLabel, Heading, Select, Switch, useToast } from '@chakra-ui/react';
import { themes } from '../theme';
import { ThemeContext, useContext } from '../providers';
import { Theme } from '../app.types';
import { useState } from 'react';
import { urlB64ToUint8Array } from '../utils';
import { useAPI } from '../hooks';

const Settings = () => {
   const { theme, setTheme } = useContext(ThemeContext);
   const toast = useToast();
   const api = useAPI();
   const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(self.Notification.permission === 'granted');
   const addNotificationQuery = api.useMutationQuery<PushSubscription>({
      method: 'POST',
      url: '/api/notification/',
      onError: (error) => {
         toast({
            title: 'Error',
            description: error.message,
            status: 'error',
            duration: 5000,
         });
      },
   });

   const toggleNotifications = async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
         setNotificationsEnabled(true);

         /* Subscribe to push notifications */
         try {
            const applicationServerKey = urlB64ToUint8Array(
               'BJH23VfZlRydff75qOh4y3fwBzT1XvKf3mg6lYcOlI1uIRPdScKX4EmXrdqgMZke83jAagAtjY80NTfTCFXY91U'
            );
            const options = { applicationServerKey, userVisibleOnly: true };
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.subscribe(options);
            addNotificationQuery.mutate(subscription);
         } catch (err) {
            toast({
               title: 'Error',
               description: 'Failed to subscribe to notifications. Please check your application settings: ' + err,
               status: 'error',
               duration: 5000,
            });
         }
      } else {
         toast({
            description: 'Failed to enable notifications. Please check your application settings',
            status: 'error',
            duration: 5000,
         });
      }
   };

   return (
      <>
         <Heading pb="8" size="lg">
            Settings
         </Heading>
         <FormControl display={'flex'} mb={4} alignItems={'center'}>
            <FormLabel htmlFor="theme" mb={0}>
               Theme
            </FormLabel>
            <Select w={'200px'} placeholder="Select theme..." value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
               {themes.map((theme) => (
                  <option key={theme} value={theme}>
                     {theme}
                  </option>
               ))}
            </Select>
         </FormControl>
         <FormControl display={'flex'} mb={4} alignItems={'center'}>
            <FormLabel htmlFor="notifications" mb={0}>
               Notifications
            </FormLabel>
            <Switch
               colorScheme={theme === 'dark' ? 'blue' : undefined}
               id="notifications"
               isChecked={notificationsEnabled}
               disabled={notificationsEnabled}
               onChange={toggleNotifications}
            />
            {notificationsEnabled && (
               <FormHelperText pl={4} mt={0}>
                  Notifications must be disabled from your application settings
               </FormHelperText>
            )}
         </FormControl>
      </>
   );
};

export default Settings;
