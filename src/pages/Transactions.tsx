/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.tsx: This file contains the transactions page component
 */

import { useCallback, useEffect, useState } from 'react';
import { AbsoluteCenter, Avatar, Divider, FormControl, FormLabel, Heading, Spinner, Stack, Text, useToast } from '@chakra-ui/react';
import { TransactionList, isTransactionList, SortOrder } from '../app.types';
import { useAPI } from '../hooks';
import { DateRangePicker, Table, SearchFilter } from '../components';
import { endOfMonth, format, startOfMonth } from 'date-fns';

const Transactions = () => {
   const toast = useToast();
   const api = useAPI();
   const [sortColumn, setSortColumn] = useState<string>('Date');
   const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
   const [dates, setDates] = useState<Date[]>([startOfMonth(new Date()), endOfMonth(new Date())]);
   const [textFilter, setTextFilter] = useState<string>('');
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
         </Stack>
         <Divider marginBottom={2} marginTop={5} />
         {query.isFetching ? (
            <AbsoluteCenter>
               <Spinner />
            </AbsoluteCenter>
         ) : (
            <>
               <Table
                  columns={[
                     {
                        sortable: false,
                        text: '',
                     },
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
                  ]}
                  rows={
                     query.data
                        ? query.data.data.transactions.map((txn) => ({
                             id: txn.id || 0,
                             cells: [
                                <Avatar
                                   src={'/' + txn.source.replaceAll(' ', '') + '.png'}
                                   name={txn.source}
                                   title={txn.source}
                                   size={{ base: 'xs', md: 'sm' }}
                                />,
                                new Date(txn.date).toLocaleDateString(),
                                txn.description,
                                <Text color={txn.amount < 0 ? 'red.500' : 'green.500'}>
                                   {(txn.amount / 100).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}
                                </Text>,
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
