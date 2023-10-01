/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.tsx: This file contains the transactions page component
 */

import { ChevronDownIcon } from '@chakra-ui/icons';
import { Avatar, Button, Center, Heading, Spinner, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import { TransactionList, Transaction, isTransactionList } from '../app.types';
import { useAPI } from '../hooks';
import { useEffect } from 'react';

const TransactionsTable = (props: { transactions: Transaction[] }) => {
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
   const query = api.useQuery<TransactionList>({ method: 'GET', url: '/api/transaction/', validate: isTransactionList });

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
            <TransactionsTable transactions={query.data ? query.data.data.transactions : []} />
         )}
      </>
   );
};

export default Transactions;
