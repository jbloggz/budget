/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Table.tsx: This file contains the Table component
 */

import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { TableContainer, Table as ChakraTable, Thead, Tr, Th, Button, Tbody, Td } from '@chakra-ui/react';

export interface TableColumn {
   text: string;
   sortable: boolean;
}

export interface TableRow {
   id: number | string;
   cells: (string | React.ReactNode)[];
}

export interface TableProps {
   columns: TableColumn[];
   rows: TableRow[];
   sortColumn?: string;
   sortAscending?: boolean;
   onSortChanged?: (column: string, ascending: boolean) => void;
   onRowClick?: (index: number, row: TableRow) => void;
}

const Table = (props: TableProps) => {
   const sortIcon = props.sortAscending ? <ChevronUpIcon /> : <ChevronDownIcon />;
   return (
      <TableContainer>
         <ChakraTable variant="striped" size={{ base: 'sm', md: 'md' }} whiteSpace="normal">
            <Thead>
               <Tr>
                  {props.columns.map((col, idx) => (
                     <Th key={idx}>
                        {col.sortable ? (
                           <Button
                              variant={'ghost'}
                              size={'sm'}
                              onClick={() =>
                                 props.onSortChanged && props.onSortChanged(col.text, props.sortColumn !== col.text || !props.sortAscending)
                              }
                           >
                              {col.text} {props.sortColumn === col.text ? sortIcon : <ChevronUpIcon style={{ visibility: 'hidden' }} />}
                           </Button>
                        ) : (
                           <Button variant={'ghost'} size={'sm'} _hover={{ background: 'none' }} style={{ cursor: 'default' }}>
                              {col.text}
                           </Button>
                        )}
                     </Th>
                  ))}
               </Tr>
            </Thead>
            <Tbody>
               {props.rows.map((row, idx) => (
                  <Tr key={row.id} onClick={() => props.onRowClick && props.onRowClick(idx, row)}>
                     {row.cells.map((cell, idx) => (
                        <Td key={idx}>{cell}</Td>
                     ))}
                  </Tr>
               ))}
            </Tbody>
         </ChakraTable>
      </TableContainer>
   );
};

export default Table;
