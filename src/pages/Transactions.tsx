/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.tsx: This file contains the transactions page component
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
   AbsoluteCenter,
   AlertDialog,
   AlertDialogBody,
   AlertDialogContent,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogOverlay,
   Button,
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
import { CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Select } from 'chakra-react-select';
import { TransactionList, isTransactionList, SortOrder } from '../app.types';
import { useAPI } from '../hooks';
import { DateRangePicker, Table, SearchFilter, SourceLogo } from '../components';
import { prettyAmount, prettyDate } from '../utils';

interface DeleteDialogProps {
   isOpen: boolean;
   ids: Set<number | string>;
   onClose: (reload: boolean) => void;
}

function DeleteDialog(props: DeleteDialogProps) {
   const cancelRef = useRef<HTMLButtonElement>(null);
   const api = useAPI();
   const toast = useToast();

   const deleteQuery = api.useMutationQuery<void>({
      method: 'DELETE',
      url: '/api/transaction/',
      params: new URLSearchParams([...props.ids].map((v) => ['id', v.toString()])),
      onSuccess: () => props.onClose(true),
      onError: (error) => {
         toast({
            title: 'Error',
            description: error.message,
            status: 'error',
            duration: 5000,
         });
      },
   });

   return (
      <>
         <AlertDialog isOpen={props.isOpen} leastDestructiveRef={cancelRef} onClose={() => props.onClose(false)}>
            <AlertDialogOverlay>
               <AlertDialogContent>
                  <AlertDialogHeader fontSize="lg" fontWeight="bold">
                     Delete Transaction{props.ids.size > 1 ? 's' : ''}
                  </AlertDialogHeader>
                  <AlertDialogBody>
                     Are you sure you want to delete {props.ids.size} transaction{props.ids.size > 1 ? 's' : ''}? This action cannot be undone.
                  </AlertDialogBody>
                  <AlertDialogFooter>
                     <Button ref={cancelRef} onClick={() => props.onClose(false)}>
                        Cancel
                     </Button>
                     <Button isLoading={deleteQuery.isLoading} colorScheme="red" onClick={() => deleteQuery.mutate()} ml={3}>
                        Delete
                     </Button>
                  </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialogOverlay>
         </AlertDialog>
      </>
   );
}

const Transactions = () => {
   const toast = useToast();
   const api = useAPI();
   const [sortColumn, setSortColumn] = useState<string>('Date');
   const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
   const [dates, setDates] = useState<Date[]>([startOfMonth(new Date()), endOfMonth(new Date())]);
   const [textFilter, setTextFilter] = useState<string>('');
   const [selectedSources, setSelectedSources] = useState<readonly { label: string; value: string }[]>([]);
   const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
   const [isEditMode, setEditMode] = useState<boolean>(false);
   const [isDeleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

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
         <HStack pb="8">
            <Heading size="lg">Transactions</Heading>
            <Spacer />
            {api.readwrite &&
               (isEditMode ? (
                  <>
                     {selectedRows.size > 0 && (
                        <IconButton
                           title={'Delete'}
                           variant={'ghost'}
                           color={'red.300'}
                           aria-label={'delete'}
                           icon={<DeleteIcon />}
                           onClick={() => setDeleteDialogOpen(true)}
                        />
                     )}
                     <IconButton
                        title={'Cancel'}
                        variant={'ghost'}
                        aria-label={'cancel'}
                        icon={<CloseIcon />}
                        onClick={() => {
                           setEditMode(false);
                           setSelectedRows(new Set());
                        }}
                     />
                  </>
               ) : (
                  <IconButton title={'Edit'} variant={'ghost'} aria-label={'edit'} icon={<EditIcon />} onClick={() => setEditMode(true)} />
               ))}
         </HStack>
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
                  highlightHover={isEditMode}
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
                                   <Text opacity={txn.pending ? '0.65' : undefined} color={txn.pending ? 'orange.500' : undefined}>
                                      {prettyDate(txn.date)}
                                   </Text>,
                                   <Text opacity={txn.pending ? '0.65' : undefined} color={txn.pending ? 'orange.500' : undefined}>
                                      {txn.description}
                                   </Text>,
                                   <Text opacity={txn.pending ? '0.65' : undefined} color={txn.amount < 0 ? 'red.500' : 'green.500'}>
                                      {prettyAmount(txn.amount)}
                                   </Text>,
                                   txn.balance ? (
                                      <Text opacity={txn.pending ? '0.65' : undefined} color={txn.balance < 0 ? 'red.500' : 'green.500'}>
                                         {prettyAmount(txn.balance)}
                                      </Text>
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
                  selectedRows={isEditMode ? selectedRows : undefined}
                  onRowSelection={
                     isEditMode
                        ? (_, row) => {
                             setSelectedRows((oldSet) => {
                                const newSet = new Set(oldSet);
                                if (newSet.has(row.id)) {
                                   newSet.delete(row.id);
                                } else {
                                   newSet.add(row.id);
                                }
                                return newSet;
                             });
                          }
                        : undefined
                  }
               />
            </>
         )}
         <DeleteDialog
            isOpen={isDeleteDialogOpen}
            ids={selectedRows}
            onClose={(reload: boolean) => {
               setDeleteDialogOpen(false);
               if (reload) {
                  query.refetch();
               }
            }}
         />
      </>
   );
};

export default Transactions;
