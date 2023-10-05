/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.tsx: This file contains the transactions page component
 */

import { Dispatch, useCallback, useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@chakra-ui/icons';
import {
   AbsoluteCenter,
   Avatar,
   Button,
   Divider,
   FormControl,
   FormLabel,
   Heading,
   Input,
   InputGroup,
   InputLeftElement,
   Spinner,
   Stack,
   Table,
   TableContainer,
   Tbody,
   Td,
   Text,
   Th,
   Thead,
   Tr,
   useToast,
} from '@chakra-ui/react';
import { TransactionList, Transaction, isTransactionList } from '../app.types';
import { useAPI } from '../hooks';
import { DateRangePicker } from '../components';
import { endOfMonth, format, startOfMonth } from 'date-fns';

type SortColumn = 'date' | 'description' | 'amount';
type SortOrder = 'asc' | 'desc';

interface TransactionsTableProps {
   transactions: Transaction[];
   sortColumn: SortColumn;
   sortOrder: SortOrder;
   setSort: (col: SortColumn, order: SortOrder) => void;
}

interface TransactionsTableFiltersProps {
   filters: {
      dates: Date[];
      setDates: Dispatch<React.SetStateAction<Date[]>>;
      textFilter: string;
      setTextFilter: Dispatch<React.SetStateAction<string>>;
   };
}

const TransactionsTableFilters = ({ filters }: TransactionsTableFiltersProps) => {
   const [filterQuery, setFilterQuery] = useState<string>(filters.textFilter);

   const onBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilterQuery(e.currentTarget.value);
      filters.setTextFilter(e.currentTarget.value);
   };

   const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
         filters.setTextFilter(filterQuery);
      }
   };

   return (
      <Stack direction={{ base: 'column', md: 'row' }}>
         <FormControl>
            <FormLabel>Date Range</FormLabel>
            <DateRangePicker dates={filters.dates} onDateChange={filters.setDates} />
         </FormControl>
         <FormControl>
            <FormLabel>Search</FormLabel>
            <InputGroup>
               <InputLeftElement pointerEvents="none">
                  <SearchIcon />
               </InputLeftElement>
               <Input
                  type="text"
                  placeholder="Enter a regex"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.currentTarget.value)}
                  onBlur={onBlur}
                  onKeyDown={onKeyDown}
               />
            </InputGroup>
         </FormControl>
      </Stack>
   );
};

const TransactionsTable = (props: TransactionsTableProps) => {
   const sortIcon = props.sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />;
   return (
      <TableContainer>
         <Table variant="striped" size={{ base: 'sm', md: 'md' }} whiteSpace="normal">
            <Thead>
               <Tr>
                  <Th></Th>
                  <Th>
                     <Button
                        variant={'ghost'}
                        size={'sm'}
                        onClick={() => props.setSort('date', props.sortColumn === 'date' && props.sortOrder === 'desc' ? 'asc' : 'desc')}
                     >
                        Date {props.sortColumn === 'date' ? sortIcon : ''}
                     </Button>
                  </Th>
                  <Th>
                     <Button
                        variant={'ghost'}
                        size={'sm'}
                        onClick={() =>
                           props.setSort('description', props.sortColumn === 'description' && props.sortOrder === 'desc' ? 'asc' : 'desc')
                        }
                     >
                        Description {props.sortColumn === 'description' ? sortIcon : ''}
                     </Button>
                  </Th>
                  <Th>
                     <Button
                        variant={'ghost'}
                        size={'sm'}
                        onClick={() => props.setSort('amount', props.sortColumn === 'amount' && props.sortOrder === 'desc' ? 'asc' : 'desc')}
                     >
                        Amount {props.sortColumn === 'amount' ? sortIcon : ''}
                     </Button>
                  </Th>
               </Tr>
            </Thead>
            <Tbody>
               {props.transactions.map((txn) => (
                  <Tr key={txn.id}>
                     <td>
                        <Avatar
                           src={'/' + txn.source.replaceAll(' ', '') + '.png'}
                           name={txn.source}
                           title={txn.source}
                           size={{ base: 'xs', md: 'sm' }}
                        />
                     </td>
                     <Td>{new Date(txn.date).toLocaleDateString()}</Td>
                     <Td>{txn.description}</Td>
                     <Td>
                        <Text color={txn.amount < 0 ? 'red.500' : 'green.500'}>
                           {(txn.amount / 100).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })}
                        </Text>
                     </Td>
                  </Tr>
               ))}
            </Tbody>
         </Table>
      </TableContainer>
   );
};

const Transactions = () => {
   const toast = useToast();
   const api = useAPI();
   const [sortColumn, setSortColumn] = useState<SortColumn>('date');
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
         sort_column: sortColumn,
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
      (col: SortColumn, order: SortOrder) => {
         setSortColumn(col);
         setSortOrder(order);
      },
      [setSortColumn, setSortOrder]
   );

   return (
      <>
         <Heading pb="8" size="lg">
            Transactions
         </Heading>
         <TransactionsTableFilters
            filters={{
               dates,
               setDates,
               textFilter,
               setTextFilter,
            }}
         />
         <Divider marginBottom={2} marginTop={5} />
         {query.isFetching ? (
            <AbsoluteCenter>
               <Spinner />
            </AbsoluteCenter>
         ) : (
            <>
               <TransactionsTable
                  transactions={query.data ? query.data.data.transactions : []}
                  sortOrder={sortOrder}
                  sortColumn={sortColumn}
                  setSort={setSort}
               />
            </>
         )}
      </>
   );
};

export default Transactions;
