/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * EditAllocationModal.tsx: This file contains the EditAllocationModal component
 */

import { useEffect, useState } from 'react';
import {
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
import { Allocation, Categorisation, isAllocation, isCategorisation } from '../app.types';
import { useAPI } from '../hooks';
import { prettyAmount, prettyDate } from '../utils';
import { SourceLogo } from '../components';
import { CreatableSelect } from 'chakra-react-select';

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

   /* Create the api queries */
   const allocationQuery = api.useQuery<Allocation>({
      method: 'GET',
      url: '/api/allocation/' + props.id,
      validate: isAllocation,
   });
   const allocation = allocationQuery.data?.data;

   const categoriseQuery = api.useQuery<Categorisation>({
      method: 'GET',
      url: '/api/categorise/',
      params: new URLSearchParams({
         description: allocation?.description || '',
      }),
      validate: isCategorisation,
      enabled: allocationQuery.isSuccess,
   });
   const { categories, locations } =
      categoriseQuery.isSuccess && categoriseQuery.data ? categoriseQuery.data.data : { categories: null, locations: null };
   const updateQuery = api.useMutationQuery<Allocation>({
      method: 'PUT',
      url: '/api/allocation/',
      onSuccess: () => props.onSave(),
   });
   const splitQuery = api.useMutationQuery<{ amount: number }, Allocation>({
      method: 'PUT',
      url: `/api/allocation/${props.id}/split/`,
      onSuccess: (new_alloc: Allocation) => {
         new_alloc.category = category;
         new_alloc.location = location;
         updateQuery.mutate(new_alloc);
      },
   });

   /* Check for query errors */
   useEffect(() => {
      for (const query of [allocationQuery, categoriseQuery, updateQuery, splitQuery]) {
         if (query.isError) {
            toast({
               title: 'Error',
               description: query.error.message,
               status: 'error',
               duration: 5000,
            });
         }
      }
   }, [allocationQuery, categoriseQuery, updateQuery, splitQuery, toast]);

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
      if (!category) {
         setCategoryErrmsg('Please select a category');
         error = true;
      }
      if (!location) {
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
         allocation.category = category;
         allocation.location = location;
         updateQuery.mutate(allocation);
      }
   };

   return (
      <Modal onClose={props.onClose} size={{ base: 'full', md: 'xl' }} isOpen={props.isOpen}>
         <ModalOverlay />
         <ModalContent>
            <ModalHeader>
               {allocation && <SourceLogo source={allocation.source} mr={4} />}
               Edit Allocation
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
                     {categories ? (
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
                        <Center>
                           <Spinner />
                        </Center>
                     )}
                     <FormErrorMessage>{categoryErrmsg}</FormErrorMessage>
                  </FormControl>
                  <FormControl mt={4} isRequired isInvalid={locationErrmsg !== ''}>
                     <FormLabel>Location</FormLabel>
                     {locations ? (
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
                        <Center>
                           <Spinner />
                        </Center>
                     )}
                     <FormErrorMessage>{locationErrmsg}</FormErrorMessage>
                  </FormControl>
                  <FormControl mt={4} isInvalid={amountErrmsg !== ''}>
                     <FormLabel>Amount</FormLabel>
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
                     <FormErrorMessage>{amountErrmsg}</FormErrorMessage>
                  </FormControl>
               </ModalBody>
            ) : (
               <ModalBody>Unable to find allocation with id {props.id}</ModalBody>
            )}
            <ModalFooter>
               <Button isLoading={updateQuery.isLoading || splitQuery.isLoading} onClick={onSave}>
                  {amount !== '' && +amount !== 0 ? 'Split' : 'Save'}
               </Button>
               <Button isLoading={updateQuery.isLoading || splitQuery.isLoading} ml={6} onClick={props.onClose}>
                  Close
               </Button>
            </ModalFooter>
         </ModalContent>
      </Modal>
   );
};

export default EditAllocationModal;
