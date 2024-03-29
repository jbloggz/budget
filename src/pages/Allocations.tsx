/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Allocations.tsx: This file contains the allocations page component
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
   AbsoluteCenter,
   Divider,
   FormControl,
   FormLabel,
   HStack,
   Heading,
   IconButton,
   Spacer,
   Spinner,
   Stack,
   Text,
   useToast,
} from '@chakra-ui/react';
import groupBy from 'object.groupby';
import { Select } from 'chakra-react-select';
import { DateRangePicker, SearchFilter, SourceLogo, Table, TreeView } from '../components';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Allocation, AllocationList, isAllocationList } from '../app.types';
import useAPI from '@jbloggz/use-api';
import { prettyAmount, prettyDate } from '../utils';
import { Outlet, useNavigate } from 'react-router-dom';
import { BellIcon } from '@chakra-ui/icons';

interface AllocationHeaderProps {
   text: string;
   allocations: Allocation[];
   strong?: boolean;
}

const AllocationHeader = (props: AllocationHeaderProps) => {
   const total = props.allocations.reduce((total, alloc) => total + alloc.amount, 0);
   return (
      <HStack>
         <Text as={props.strong ? 'b' : undefined}>{props.text}</Text>
         <Spacer />
         <Text as={props.strong ? 'b' : undefined} mr={{ base: '0px', md: '400px', xl: '400px' }} color={total < 0 ? 'red.500' : 'green.500'}>
            {(total / 100).toLocaleString('en-AU', {
               style: 'currency',
               currency: 'AUD',
            })}
         </Text>
      </HStack>
   );
};

const Allocations = () => {
   const toast = useToast();
   const api = useAPI();
   const [dates, setDates] = useState<Date[]>([startOfMonth(new Date()), endOfMonth(new Date())]);
   const [selectedSources, setSelectedSources] = useState<readonly { label: string; value: string }[]>([]);
   const [textFilter, setTextFilter] = useState<string>('');
   const navigate = useNavigate();
   const query = api.useQuery<AllocationList>({
      method: 'GET',
      url: '/api/allocation/',
      params: new URLSearchParams([
         ['start', format(dates[0], 'yyyy-MM-dd')],
         ['end', format(dates[1], 'yyyy-MM-dd')],
         ['filter', textFilter],
         ['sort_column', 'date'],
         ['sort_order', 'desc'],
      ]),
      validate: isAllocationList,
   });

   const onDateChange = (dates: Date[]) => {
      setDates(dates);
   };

   const onAllocationChange = useCallback(() => {
      query.refetch();
   }, [query]);

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

   /* Get the allocations for the selected sources */
   const allocations = useMemo(() => {
      if (!query.data) {
         return [];
      }
      return query.data.data.allocations.filter((alloc) => selectedSources.length == 0 || selectedSources.map((s) => s.value).includes(alloc.source));
   }, [query.data, selectedSources]);

   /* Build the tree of allocations */
   const buildTree = useCallback(
      (alloc_list: Allocation[]) => {
         return Object.entries(groupBy(alloc_list, (alloc) => alloc.category))
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([category, categoryList]) => ({
               content: <AllocationHeader text={category} allocations={categoryList} />,
               childItems: Object.entries(groupBy(categoryList, (alloc) => alloc.location))
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([location, locationList]) => ({
                     content: <AllocationHeader text={location} allocations={locationList} />,
                     childItems: [
                        {
                           content: (
                              <Table
                                 highlightHover
                                 onRowClick={(_, row) => !isNaN(+row.id) && navigate(`/allocations/${+row.id}`, { state: 'modal' })}
                                 rows={locationList.map((alloc) => ({
                                    id: alloc.id || 0,
                                    cells: [
                                       <Text opacity={alloc.pending ? '0.65' : undefined} color={alloc.pending ? 'orange.500' : undefined}>{prettyDate(alloc.date)}</Text>,
                                       <Text opacity={alloc.pending ? '0.65' : undefined} color={alloc.pending ? 'orange.500' : undefined}>{alloc.description}</Text>,
                                       <Text opacity={alloc.pending ? '0.65' : undefined} color={alloc.amount < 0 ? 'red.500' : 'green.500'}>{prettyAmount(alloc.amount)}</Text>,
                                       <SourceLogo source={alloc.source} />,
                                    ],
                                 }))}
                              />
                           ),
                        },
                     ],
                  })),
            }));
      },
      [navigate]
   );

   const tree = useMemo(() => buildTree(allocations.filter((alloc) => alloc.category !== 'Unknown')), [allocations, buildTree]);
   const unknownTree = useMemo(() => buildTree(allocations.filter((alloc) => alloc.category === 'Unknown')), [allocations, buildTree]);

   return (
      <>
         <HStack pb="8">
            <Heading size="lg">Allocations</Heading>
            <Spacer />
            {api.readwrite && unknownTree.length > 0 && (
               <IconButton
                  title={'New'}
                  color={'red.300'}
                  variant={'ghost'}
                  aria-label={'new'}
                  icon={<BellIcon />}
                  onClick={() => navigate('/allocations/0', { state: 'modal' })}
               />
            )}
         </HStack>
         <Stack direction={{ base: 'column', md: 'row' }}>
            <FormControl>
               <FormLabel>Date Range</FormLabel>
               <DateRangePicker dates={dates} onChange={onDateChange} />
            </FormControl>
            <FormControl>
               <FormLabel>Search</FormLabel>
               <SearchFilter onChange={setTextFilter} />
            </FormControl>
            <FormControl>
               <FormLabel>Source</FormLabel>
               <Select
                  isMulti
                  options={[...new Set(query.data?.data.allocations.map((alloc) => alloc.source))].map((src) => ({ label: src, value: src }))}
                  value={selectedSources}
                  onChange={setSelectedSources}
               />
            </FormControl>
         </Stack>
         <Divider marginBottom={2} marginTop={5} />
         {query.isFetching ? (
            <AbsoluteCenter>
               <Spinner />
            </AbsoluteCenter>
         ) : (
            <>
               {unknownTree.length > 0 && (
                  <>
                     <TreeView childItems={unknownTree} />
                     <Divider marginBottom={2} marginTop={2} />
                  </>
               )}
               <TreeView childItems={tree} />
               <Divider marginBottom={2} marginTop={2} />
               <TreeView
                  childItems={[
                     {
                        content: <AllocationHeader strong text={'Total Debit'} allocations={allocations.filter((alloc) => alloc.amount < 0)} />,
                     },
                     {
                        content: <AllocationHeader strong text={'Total Credit'} allocations={allocations.filter((alloc) => alloc.amount > 0)} />,
                     },
                     {
                        content: <AllocationHeader strong text={'Balance'} allocations={allocations} />,
                     },
                  ]}
               />
            </>
         )}
         <Outlet context={onAllocationChange} />
      </>
   );
};

export default Allocations;
