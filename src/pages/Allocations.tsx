/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Allocations.tsx: This file contains the allocations page component
 */

import { useEffect, useMemo, useState } from 'react';
import { AbsoluteCenter, Avatar, Divider, FormControl, FormLabel, HStack, Heading, Spacer, Spinner, Stack, Text, useToast } from '@chakra-ui/react';
import groupBy from 'object.groupby';
import { MultiSelect, Option } from 'chakra-multiselect';
import { DateRangePicker, SearchFilter, Table, TreeView } from '../components';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Allocation, AllocationList, isAllocationList } from '../app.types';
import { useAPI } from '../hooks';

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
   const [selectedSources, setSelectedSources] = useState<Option[]>([]);
   const [textFilter, setTextFilter] = useState<string>('');
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
   const tree = useMemo(() => {
      return Object.entries(groupBy(allocations, (alloc) => alloc.category)).map(([category, categoryList]) => ({
         content: <AllocationHeader text={category} allocations={categoryList} />,
         childItems: Object.entries(groupBy(categoryList, (alloc) => alloc.location)).map(([location, locationList]) => ({
            content: <AllocationHeader text={location} allocations={locationList} />,
            childItems: [
               {
                  content: (
                     <Table
                        onRowClick={(_, row) => console.log(row.id)}
                        rows={locationList.map((alloc) => ({
                           id: alloc.id || 0,
                           cells: [
                              <Text>{new Date(alloc.date).toLocaleDateString()}</Text>,
                              <Text>{alloc.description}</Text>,
                              <Text color={alloc.amount < 0 ? 'red.500' : 'green.500'}>
                                 {(alloc.amount / 100).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}
                              </Text>,
                              <Avatar
                                 src={'/' + alloc.source.replaceAll(' ', '') + '.png'}
                                 name={alloc.source}
                                 title={alloc.source}
                                 size={{ base: 'xs', md: 'sm' }}
                              />,
                           ],
                        }))}
                     />
                  ),
               },
            ],
         })),
      }));
   }, [allocations]);

   return (
      <>
         <Heading pb="8" size="lg">
            Allocations
         </Heading>
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
               <MultiSelect
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
               <TreeView childItems={tree || []} />
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
      </>
   );
};

export default Allocations;
