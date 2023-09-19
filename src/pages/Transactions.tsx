/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.tsx: This file contains the transactions page component
 */

import { ChevronDownIcon } from '@chakra-ui/icons';
import { Avatar, Button, Center, Heading, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { APIError, apiResponseType, useAPI } from '../hooks';
import { transactionType } from '../app.types';
import { useCallback } from 'react';

const TransactionsTable = (props: { transactions: transactionType[] }) => {
   return (
      <TableContainer>
         <Table variant="striped" size={{ base: 'sm', md: 'md' }} whiteSpace="normal">
            <Thead>
               <Tr>
                  <Th></Th>
                  <Th>
                     <Button variant={'ghost'} size={'sm'}>
                        Date <ChevronDownIcon />
                     </Button>
                  </Th>
                  <Th>
                     <Button variant={'ghost'} size={'sm'}>
                        Description
                     </Button>
                  </Th>
                  <Th>
                     <Button variant={'ghost'} size={'sm'}>
                        Amount
                     </Button>
                  </Th>
               </Tr>
            </Thead>
            <Tbody>
               {props.transactions.map((txn) => (
                  <Tr>
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
   const api = useAPI();
   const toast = useToast();
   const query = useQuery<apiResponseType<transactionType[]>, APIError>(
      ['transactions'],
      useCallback(() => api.request<transactionType[]>({method: 'GET', url: '/api/transaction/'}), [api])
   );

   if (query.isError) {
      toast.closeAll();
      toast({
         title: 'Error',
         description: query.error.message,
         status: 'error',
         duration: 5000,
      });
   }

   return (
      <>
         <Heading pb="8" size="lg">
            Transactions
         </Heading>
         {query.isLoading ? (
            <Center>
               <Spinner />
            </Center>
         ) : (
            <TransactionsTable transactions={query.data ? query.data.data : []} />
         )}
      </>
   );
};

export default Transactions;
