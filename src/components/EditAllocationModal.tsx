/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * EditAllocationModal.tsx: This file contains the EditAllocationModal component
 */

import { useEffect, useState } from 'react';
import {
   AbsoluteCenter,
   Button,
   Center,
   FormControl,
   FormErrorMessage,
   FormHelperText,
   FormLabel,
   HStack,
   Input,
   Modal,
   ModalBody,
   ModalCloseButton,
   ModalContent,
   ModalFooter,
   ModalHeader,
   ModalOverlay,
   Spacer,
   Spinner,
   Tag,
   Text,
   useToast,
} from '@chakra-ui/react';
import { Allocation, Categorisation, Transaction, TransactionList, isAllocation, isCategorisation, isTransactionList } from '../app.types';
import { useAPI } from '../hooks';
import { prettyAmount, prettyDate } from '../utils';
import { SourceLogo, Table } from '../components';
import { CreatableSelect } from 'chakra-react-select';
import { format } from 'date-fns';

interface EditAllocationModalProps {
   id: string;
   isOpen: boolean;
   onClose: () => void;
   onSave: () => void;
}

interface SelectOptionProps {
   name: string;
   score: number;
   tagOpacity?: number;
}

interface OverwriteModalProps {
   transaction: Transaction;
   isOpen: boolean;
   onClose: () => void;
   onSelect: (id: number) => void;
}

const OverwriteModal = (props: OverwriteModalProps) => {
   const start = new Date(props.transaction.date);
   start.setDate(start.getDate() - 10);
   const end = new Date();

   const api = useAPI();
   const query = api.useQuery<TransactionList>({
      method: 'GET',
      url: '/api/transaction/',
      params: new URLSearchParams({
         start: format(start, 'yyyy-MM-dd'),
         end: format(end, 'yyyy-MM-dd'),
         sort_column: 'date',
         sort_order: 'desc',
      }),
      validate: isTransactionList,
   });

   const possible_transactions = query.isSuccess ? query.data.data.transactions : [];

   return (
      <Modal onClose={props.onClose} size={{ base: 'full', md: 'xl' }} isOpen={props.isOpen}>
         <ModalOverlay />
         <ModalContent>
            {query.isFetching ? (
               <AbsoluteCenter>
                  <Spinner />
               </AbsoluteCenter>
            ) : (
               <>
                  <ModalHeader>Select an existing transaction</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                     <Table
                        highlightHover
                        header={[
                           {
                              sortable: false,
                              text: 'Date',
                           },
                           {
                              sortable: false,
                              text: 'Description',
                           },
                           {
                              sortable: false,
                              text: 'Amount',
                           },
                        ]}
                        rows={possible_transactions
                           .filter((txn) => txn.source === props.transaction.source && txn.id !== props.transaction.id)
                           .map((txn) => ({
                              id: txn.id || 0,
                              cells: [
                                 <Text opacity={txn.pending ? '0.65' : undefined} color={txn.pending ? 'orange.500' : undefined}>{prettyDate(txn.date)}</Text>,
                                 <Text opacity={txn.pending ? '0.65' : undefined} color={txn.pending ? 'orange.500' : undefined}>{txn.description}</Text>,
                                 <Text opacity={txn.pending ? '0.65' : undefined} color={txn.amount < 0 ? 'red.500' : 'green.500'}>{prettyAmount(txn.amount)}</Text>,
                              ],
                           }))}
                        onRowClick={(_, row) => props.onSelect(+row.id)}
                     />
                  </ModalBody>
               </>
            )}
         </ModalContent>
      </Modal>
   );
};

const SelectOption = (props: SelectOptionProps) => {
   const tagOpacity = typeof props.tagOpacity === 'undefined' ? 1 : props.tagOpacity;
   return (
      <HStack w={'100%'}>
         <Text>{props.name}</Text>
         <Spacer />
         <Tag color={'black'} backgroundColor={`hsla(${props.score * 120},100%,50%,${tagOpacity})`}>
            {(props.score * 100).toFixed(1)}%
         </Tag>
      </HStack>
   );
};

const EditAllocationModal = (props: EditAllocationModalProps) => {
   const toast = useToast();
   const api = useAPI();
   const [categoryErrmsg, setCategoryErrmsg] = useState('');
   const [locationErrmsg, setLocationErrmsg] = useState('');
   const [amountErrmsg, setAmountErrmsg] = useState('');
   const [amount, setAmount] = useState('');
   const [category, setCategory] = useState('');
   const [location, setLocation] = useState('');
   const [isOverwriteModalOpen, setOverwriteModalOpen] = useState(false);

   /* This query will retrieve the allocation from the database */
   const allocationQuery = api.useQuery<Allocation | undefined>({
      method: 'GET',
      url: '/api/allocation/' + props.id,
      validateOptional: isAllocation,
      onSuccess: (alloc?: Allocation) => {
         if (alloc) {
            /* Update category/location when allocation is loaded */
            if (alloc.category !== 'Unknown') {
               setCategory(alloc.category);
            }
            if (alloc.location !== 'Unknown') {
               setLocation(alloc.location);
            }
         } else {
            toast({
               title: 'Complete',
               description: 'All allocations have been successfully processed',
               status: 'success',
               duration: 5000,
            });
            props.onSave();
         }
      },
   });
   const allocation = allocationQuery.data?.data;

   /* This query retrieves the list possible of categories/locations for the allocation */
   const categoriseQuery = api.useQuery<Categorisation>({
      method: 'GET',
      url: '/api/categorise/',
      params: new URLSearchParams({
         description: allocation?.description || '',
      }),
      validate: isCategorisation,
      enabled: allocationQuery.isSuccess && !allocationQuery.isFetching,
   });
   const { categories, locations } =
      categoriseQuery.isSuccess && categoriseQuery.data ? categoriseQuery.data.data : { categories: [], locations: [] };

   /* This query is used to update the allocation with a new category/location */
   const updateQuery = api.useMutationQuery<Allocation>({
      method: 'PUT',
      url: '/api/allocation/',
      onSuccess: () => props.id !== '0' && props.onSave(),
   });

   /* This query is used to split an allocation into 2 allocations */
   const splitQuery = api.useMutationQuery<{ amount: number }, Allocation>({
      method: 'PUT',
      url: allocation ? `/api/allocation/${allocation.id}/split/` : '',
      onSuccess: (new_alloc: Allocation) => {
         new_alloc.category = category;
         new_alloc.location = location;
         updateQuery.mutate(new_alloc);
      },
   });

   /* This query is used to overwrite an existing transaction */
   const overwriteQuery = api.useMutationQuery<{ txn_id: number }>({
      method: 'PUT',
      url: allocation ? `/api/allocation/${allocation.id}/overwrite/` : '',
      onSuccess: () => props.id !== '0' && props.onSave(),
   });

   /* Check for successful updates */
   useEffect(() => {
      if (props.id === '0') {
         /* 0 is the special "any unknown" entry */
         if (allocation?.id !== 0 && (updateQuery.isSuccess || overwriteQuery.isSuccess)) {
            updateQuery.reset();
            overwriteQuery.reset();
            allocationQuery.refetch();
            setCategory('');
            setLocation('');
         }
      }
   }, [allocation, props, allocationQuery, updateQuery, overwriteQuery]);

   /* Check for query errors */
   useEffect(() => {
      for (const query of [allocationQuery, categoriseQuery, updateQuery, splitQuery, overwriteQuery]) {
         if (query.isError) {
            toast({
               title: 'Error',
               description: query.error.message,
               status: 'error',
               duration: 5000,
            });
            if ('reset' in query) {
               query.reset();
            }
         }
      }
   }, [allocationQuery, categoriseQuery, updateQuery, splitQuery, overwriteQuery, toast]);

   /* Update category/location when allocation is loaded */
   useEffect(() => {
      if (allocation) {
         if (allocation.category !== 'Unknown') {
            setCategory(allocation.category);
         }
         if (allocation.location !== 'Unknown') {
            setLocation(allocation.location);
         }
      }
   }, [allocation]);

   /* Run when user clicks the save button */
   const onSave = async () => {
      let error = false;
      if (!allocation) {
         toast({
            title: 'Error',
            description: 'No allocation is selected',
            status: 'error',
            duration: 5000,
         });
         return;
      }
      if (!category && categories.length === 0) {
         setCategoryErrmsg('Please select a category');
         error = true;
      }
      if (!location && locations.length === 0) {
         setLocationErrmsg('Please select a location');
         error = true;
      }
      const intAmount = Math.trunc(Math.abs(parseFloat(amount || '0') * 100));
      if (intAmount > Math.abs(allocation?.amount || 0)) {
         setAmountErrmsg('Cannot split more than total amount');
         error = true;
      }

      if (error) {
         return;
      }

      if (intAmount > 0) {
         /* Split the allocation */
         splitQuery.mutate({ amount: intAmount });
      } else {
         /* Update the allocation */
         allocation.category = category || categories[0].name;
         allocation.location = location || locations[0].name;
         updateQuery.mutate(allocation);
      }
   };

   /* Run when user clicks the overwrite button */
   const onOverwriteTransaction = async (txn_id: number) => {
      setOverwriteModalOpen(false);
      /* Overwrite the transaction */
      overwriteQuery.mutate({ txn_id });
   };

   const isLoading = updateQuery.isLoading || splitQuery.isLoading || overwriteQuery.isLoading;

   return (
      <Modal onClose={props.onClose} size={{ base: 'full', md: 'xl' }} isOpen={props.isOpen}>
         <ModalOverlay />
         <ModalContent>
            <ModalHeader>
               {allocation && <SourceLogo source={allocation.source} mr={4} />}
               {api.readwrite ? 'Edit' : 'View'} Allocation
            </ModalHeader>
            <ModalCloseButton />
            {allocationQuery.isFetching ? (
               <Center>
                  <Spinner />
               </Center>
            ) : allocation ? (
               <ModalBody>
                  <FormControl>
                     <FormLabel>Date</FormLabel>
                     <Text pl={4} color={'GrayText'}>
                        {prettyDate(allocation.date)}
                     </Text>
                  </FormControl>
                  <FormControl mt={4}>
                     <FormLabel>Description</FormLabel>
                     <Text pl={4} color={'GrayText'}>
                        {allocation.description}
                     </Text>
                  </FormControl>
                  <FormControl mt={4} isRequired isInvalid={categoryErrmsg !== ''}>
                     <FormLabel>Category</FormLabel>
                     {categoriseQuery.isFetching ? (
                        <Center>
                           <Spinner />
                        </Center>
                     ) : api.readwrite ? (
                        <CreatableSelect
                           blurInputOnSelect
                           defaultInputValue={category}
                           placeholder={
                              category || categories.length === 0 ? (
                                 'Select a category...'
                              ) : (
                                 <SelectOption name={categories[0].name} score={categories[0].score} tagOpacity={0.5} />
                              )
                           }
                           options={categories.map((v) => ({
                              label: <SelectOption name={v.name} score={v.score} />,
                              value: v.name,
                           }))}
                           onChange={(v) => setCategory(v?.value || '')}
                        />
                     ) : (
                        <Input disabled value={category} />
                     )}
                     <FormErrorMessage>{categoryErrmsg}</FormErrorMessage>
                  </FormControl>
                  <FormControl mt={4} isRequired isInvalid={locationErrmsg !== ''}>
                     <FormLabel>Location</FormLabel>
                     {categoriseQuery.isFetching ? (
                        <Center>
                           <Spinner />
                        </Center>
                     ) : api.readwrite ? (
                        <CreatableSelect
                           blurInputOnSelect
                           defaultInputValue={location}
                           placeholder={
                              location || locations.length === 0 ? (
                                 'Select a location...'
                              ) : (
                                 <SelectOption name={locations[0].name} score={locations[0].score} tagOpacity={0.5} />
                              )
                           }
                           options={locations.map((v) => ({
                              label: <SelectOption name={v.name} score={v.score} />,
                              value: v.name,
                           }))}
                           onChange={(v) => setLocation(v?.value || '')}
                        />
                     ) : (
                        <Input disabled value={location} />
                     )}
                     <FormErrorMessage>{locationErrmsg}</FormErrorMessage>
                  </FormControl>
                  <FormControl mt={4} isInvalid={amountErrmsg !== ''}>
                     <FormLabel>Amount</FormLabel>
                     {api.readwrite ? (
                        <>
                           <Input
                              type={'number'}
                              step={'any'}
                              placeholder={prettyAmount(allocation.amount)}
                              value={amount}
                              onChange={(e) => {
                                 setAmountErrmsg('');
                                 setAmount(e.currentTarget.value);
                              }}
                           />
                           <FormHelperText>Set an amount to split the allocation</FormHelperText>
                        </>
                     ) : (
                        <Input disabled value={prettyAmount(allocation.amount)} />
                     )}
                     <FormErrorMessage>{amountErrmsg}</FormErrorMessage>
                  </FormControl>
                  {isOverwriteModalOpen && (
                     <OverwriteModal
                        transaction={{
                           id: allocation.txn_id,
                           date: allocation.date,
                           amount: allocation.amount,
                           description: allocation.description,
                           source: allocation.source,
                           pending: allocation.pending,
                        }}
                        isOpen={isOverwriteModalOpen}
                        onSelect={onOverwriteTransaction}
                        onClose={() => setOverwriteModalOpen(false)}
                     />
                  )}
               </ModalBody>
            ) : (
               <ModalBody>Unable to find allocation with id {props.id}</ModalBody>
            )}
            <ModalFooter>
               {api.readwrite && (
                  <>
                     {category === '' && (
                        <>
                           <Button isLoading={isLoading} onClick={() => setOverwriteModalOpen(true)}>
                              Overwrite
                           </Button>
                           <Spacer />
                        </>
                     )}
                     <Button isLoading={isLoading} onClick={onSave}>
                        {amount !== '' && +amount !== 0 ? 'Split' : 'Save'}
                     </Button>
                  </>
               )}
               <Button isLoading={isLoading} ml={6} onClick={props.onClose}>
                  Close
               </Button>
            </ModalFooter>
         </ModalContent>
      </Modal>
   );
};

export default EditAllocationModal;
