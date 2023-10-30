/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Logs.tsx: This file contains the logs page component
 */

import { AbsoluteCenter, Box, Button, Divider, FormControl, FormLabel, Heading, Input, Spinner, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAPI } from '../hooks';

const Logs = () => {
   const toast = useToast();
   const api = useAPI();
   const [lineCount, setLineCount] = useState<number>(200);
   const [filter, setFilter] = useState<string>('');
   const [queryLineCount, setQueryLineCount] = useState<number>(200);
   const [queryFilter, setQueryFilter] = useState<string>('');
   const query = api.useQuery<string[]>({
      method: 'GET',
      url: '/api/logs/',
      params: new URLSearchParams({
         count: queryLineCount.toString(),
         filter: queryFilter,

      }),
   });
   const logLines = query.data?.data;

   useEffect(() => {
      if (query.isError) {
         toast({
            title: 'Error',
            description: query.error.message,
            status: 'error',
            duration: 5000,
         });
      }
   }, [query, toast]);

   const refetch = () => {
      if (filter === queryFilter && lineCount === queryLineCount) {
         query.refetch();
      }
      else {
         setQueryFilter(filter);
         setQueryLineCount(lineCount);
      }
   };

   return (
      <>
         <Heading pb="8" size="lg">
            Logs
         </Heading>
         <FormControl mb={4} alignItems={'center'}>
            <FormLabel htmlFor="theme">Line Count</FormLabel>
            <Input
               type={'number'}
               value={lineCount}
               onChange={(e) => setLineCount(+e.currentTarget.value)}
               onKeyDown={(e) => e.key === 'Enter' && refetch()}
               maxW={'100px'}
            />
         </FormControl>
         <FormControl mb={4} alignItems={'center'}>
            <FormLabel htmlFor="theme">Filter</FormLabel>
            <Input
               type={'text'}
               value={filter}
               onChange={(e) => setFilter(e.currentTarget.value)}
               onKeyDown={(e) => e.key === 'Enter' && refetch()}
               maxW={'300px'}
            />
         </FormControl>
         <Button onClick={() => refetch()}>Search</Button>
         <Divider my={10} />
         {query.isFetching ? (
            <AbsoluteCenter>
               <Spinner />
            </AbsoluteCenter>
         ) : (
            <Box fontSize={'xs'}>
               <pre>{logLines?.join('\n')}</pre>
            </Box>
         )}
      </>
   );
};

export default Logs;
