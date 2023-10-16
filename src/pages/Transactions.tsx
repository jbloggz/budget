/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.tsx: This file contains the transactions page component
 */

import { useCallback, useEffect, useState } from 'react';
import { AbsoluteCenter, Divider, FormControl, FormLabel, Heading, Spinner, Stack, Text, useToast } from '@chakra-ui/react';
import { TransactionList, isTransactionList, SortOrder } from '../app.types';
import { Select } from 'chakra-react-select';
import { useAPI } from '../hooks';
import { DateRangePicker, Table, SearchFilter, SourceLogo } from '../components';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { prettyAmount, prettyDate } from '../utils';

const Transactions = () => {
   const toast = useToast();
   const api = useAPI();
   const [sortColumn, setSortColumn] = useState<string>('Date');
   const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
   const [dates, setDates] = useState<Date[]>([startOfMonth(new Date()), endOfMonth(new Date())]);
   const [textFilter, setTextFilter] = useState<string>('');
   const [selectedSources, setSelectedSources] = useState<readonly {label: string, value: string}[]>([]);
   const query = api.useQuery<TransactionList>({
      method: 'GET',
      url: '/api/transaction/',
      params: new URLSearchParams({
         start: format(dates[0], 'yyyy-MM-dd'),
         end: format(dates[1], 'yyyy-MM-dd'),
         filter: textFilter,
         sort_column: sortColumn.toLowerCase(),
         sort_order: sortOrder,
      }),
      validate: isTransactionList,
   });

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

   const setSort = useCallback(
      (col: string, asc: boolean) => {
         setSortColumn(col);
         setSortOrder(asc ? 'asc' : 'desc');
      },
      [setSortColumn, setSortOrder]
   );

   return (
      <>
         <Heading pb="8" size="lg">
            Transactions
         </Heading>
         <Stack direction={{ base: 'column', md: 'row' }}>
            <FormControl>
               <FormLabel>Date Range</FormLabel>
               <DateRangePicker dates={dates} onChange={setDates} />
            </FormControl>
            <FormControl>
               <FormLabel>Search</FormLabel>
               <SearchFilter onChange={setTextFilter} />
            </FormControl>
            <FormControl>
               <FormLabel>Source</FormLabel>
               <Select
                  isMulti
                  options={[...new Set(query.data?.data.transactions.map((txn) => txn.source))].map((src) => ({ label: src, value: src }))}
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
               <Table
                  header={[
                     {
                        sortable: true,
                        text: 'Date',
                     },
                     {
                        sortable: true,
                        text: 'Description',
                     },
                     {
                        sortable: true,
                        text: 'Amount',
                     },
                     {
                        sortable: true,
                        text: 'Balance',
                     },
                     {
                        sortable: false,
                        text: '',
                     },
                  ]}
                  rows={
                     query.data
                        ? query.data.data.transactions
                             .filter((txn) => selectedSources.length == 0 || selectedSources.map((s) => s.value).includes(txn.source))
                             .map((txn) => ({
                                id: txn.id || 0,
                                cells: [
                                   <Text>{prettyDate(txn.date)}</Text>,
                                   <Text>{txn.description}</Text>,
                                   <Text color={txn.amount < 0 ? 'red.500' : 'green.500'}>{prettyAmount(txn.amount)}</Text>,
                                   txn.balance ? (
                                      <Text color={txn.balance < 0 ? 'red.500' : 'green.500'}>{prettyAmount(txn.balance)}</Text>
                                   ) : (
                                      <Text></Text>
                                   ),
                                   <SourceLogo source={txn.source} />,
                                ],
                             }))
                        : []
                  }
                  sortColumn={sortColumn}
                  sortAscending={sortOrder === 'asc'}
                  onSortChanged={setSort}
               />
            </>
         )}
      </>
   );
};

export default Transactions;
