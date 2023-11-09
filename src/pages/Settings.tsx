/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Settings.tsx: This file contains the settings page component
 */

import { useEffect, useState } from 'react';
import { Button, FormControl, FormHelperText, FormLabel, Heading, Select, Spinner, Switch, useToast } from '@chakra-ui/react';
import useAPI from '@jbloggz/use-api';
import { themes } from '../theme';
import { ThemeContext, useContext } from '../providers';
import { Theme } from '../app.types';
import { useNotification } from '../hooks/useNotification';

const Settings = () => {
   const { theme, setTheme } = useContext(ThemeContext);
   const notifications = useNotification();
   const toast = useToast();
   const api = useAPI();
   const [waitForScraper, setWaitForScraper] = useState(false);
   const scraperGETQuery = api.useQuery<{ state: string }>({
      method: 'GET',
      url: '/api/scraper/',
   });
   const scraperPUTQuery = api.useMutationQuery<{ state: string }>({
      method: 'PUT',
      url: '/api/scraper/',
      onSuccess: () => {
         /* Wait 5 seconds and check if the scraper is running */
         setWaitForScraper(true);
         setTimeout(() => {
            scraperGETQuery.refetch();
            setWaitForScraper(false);
         }, 5000);
      }
   });

   useEffect(() => {
      if (notifications.error) {
         toast({
            title: 'Error',
            description: notifications.error,
            status: 'error',
            duration: 5000,
         });
      }
   }, [notifications.error, toast]);

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
            {notifications.isLoading ? (
               <Spinner />
            ) : (
               <>
                  <Switch
                     colorScheme={theme === 'dark' ? 'blue' : undefined}
                     id="notifications"
                     isDisabled={!notifications.isSupported}
                     isChecked={notifications.isEnabled}
                     onChange={(e) => (e.currentTarget.checked ? notifications.enable() : notifications.disable())}
                  />
                  {notifications.isSupported || (
                     <FormHelperText pl={4} mt={0}>
                        Notifications are not supported by your application
                     </FormHelperText>
                  )}
               </>
            )}
         </FormControl>
         <FormControl display={'flex'} mb={4} alignItems={'center'}>
            {scraperGETQuery.data?.data.state === 'running' ? (
               <Button isDisabled>Scraper is Running</Button>
            ) : (
               <Button
                  isLoading={scraperGETQuery.isFetching || scraperPUTQuery.isPending || waitForScraper}
                  onClick={() => scraperPUTQuery.mutate({ state: 'running' })}
               >
                  Run Scrapers
               </Button>
            )}
         </FormControl>
      </>
   );
};

export default Settings;
