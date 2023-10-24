/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Table.tsx: This file contains the Table component
 */

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { TableContainer, Table as ChakraTable, Thead, Tr, Th, Button, Tbody, Td, useColorModeValue, Checkbox } from '@chakra-ui/react';

export interface TableColumn {
   text: string;
   sortable: boolean;
}

export interface TableRow {
   id: number | string;
   cells: (string | React.ReactNode)[];
}

export interface TableProps {
   header?: TableColumn[];
   rows: TableRow[];
   onRowSelection?: (index: number, row: TableRow, selected: boolean) => void;
   selectedRows?: Set<string | number>;
   sortColumn?: string;
   sortAscending?: boolean;
   onSortChanged?: (column: string, ascending: boolean) => void;
   onRowClick?: (index: number, row: TableRow) => void;
   highlightHover?: boolean;
}

const Table = (props: TableProps) => {
   const sortIcon = props.sortAscending ? <ChevronUpIcon /> : <ChevronDownIcon />;
   const bg = useColorModeValue('gray.200', 'gray.600');
   const [rowHover, setRowHover] = useState<number>(-1);

   return (
      <TableContainer>
         <ChakraTable variant={'striped'} size={'sm'} whiteSpace={'normal'}>
            {props.header && (
               <Thead>
                  <Tr>
                     {props.selectedRows && <Th px={{ base: 1, md: 4 }}></Th>}
                     {props.header.map((col, idx) => (
                        <Th key={idx} px={{ base: 1, md: 4 }}>
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
                           ) : col.text ? (
                              <Button variant={'ghost'} size={'sm'} _hover={{ background: 'none' }} style={{ cursor: 'default' }}>
                                 {col.text}
                              </Button>
                           ) : null}
                        </Th>
                     ))}
                  </Tr>
               </Thead>
            )}
            <Tbody>
               {props.rows.map((row, rowIdx) => (
                  <Tr
                     key={row.id}
                     onMouseEnter={() => setRowHover(rowIdx)}
                     onMouseLeave={() => setRowHover(-1)}
                     onClick={() => {
                        if (props.onRowClick) {
                           props.onRowClick(rowIdx, row);
                        }
                        if (props.onRowSelection && props.selectedRows) {
                           props.onRowSelection(rowIdx, row, !props.selectedRows.has(row.id));
                        }
                     }}
                     cursor={props.onRowClick || (props.onRowSelection && props.selectedRows) ? 'pointer' : 'default'}
                  >
                     {props.selectedRows && (
                        <Td
                           bg={
                              (props.highlightHover && rowHover === rowIdx) || (props.selectedRows && props.selectedRows.has(row.id))
                                 ? bg + '!important'
                                 : undefined
                           }
                        >
                           <Checkbox
                              isChecked={props.selectedRows.has(row.id)}
                              onChange={(e) => props.onRowSelection && props.onRowSelection(rowIdx, row, e.currentTarget.checked)}
                           />
                        </Td>
                     )}
                     {row.cells.map((cell, colIdx) => (
                        <Td
                           key={colIdx}
                           px={{ base: 1, md: 4 }}
                           bg={
                              (props.highlightHover && rowHover === rowIdx) || (props.selectedRows && props.selectedRows.has(row.id))
                                 ? bg + '!important'
                                 : undefined
                           }
                        >
                           {cell}
                        </Td>
                     ))}
                  </Tr>
               ))}
            </Tbody>
         </ChakraTable>
      </TableContainer>
   );
};

export default Table;
