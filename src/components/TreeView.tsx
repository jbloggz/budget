/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * TreeView.tsx: This file contains the TreeView component
 */

import { ChevronRightIcon } from '@chakra-ui/icons';
import { Box, Collapse, HStack, StackProps, VStack, useColorModeValue } from '@chakra-ui/react';
import React, { useState } from 'react';

export interface TreeViewItemProps {
   content: React.ReactNode;
   childItems?: TreeViewItemProps[];
}

export interface TreeViewProps {
   childItems?: TreeViewItemProps[];
}

const TreeViewItem = (props: TreeViewItemProps) => {
   const [isOpen, setOpen] = useState<boolean>(false);
   const bg = useColorModeValue('gray.100', 'whiteAlpha.200');
   const hasChildren = props.childItems?.length ? true : false;
   const chevronStyle: React.CSSProperties = {
      rotate: isOpen ? '90deg' : '0deg',
      transition: 'rotate 0.15s linear 0s',
   };

   return (
      <>
         <Box
            w={'100%'}
            p={2}
            _hover={{ background: hasChildren ? bg : 'none' }}
            onClick={() => setOpen(!isOpen)}
            cursor={hasChildren ? 'pointer' : 'default'}
         >
            <HStack>
               {hasChildren && <ChevronRightIcon alignSelf={'center'} style={chevronStyle} mr={2} />}
               <Box w={'100%'}>{props.content}</Box>
            </HStack>
         </Box>
         <Collapse style={{ width: '100%' }} in={hasChildren && isOpen}>
            <TreeView w={'100%'} pl={4} childItems={props.childItems} />
         </Collapse>
      </>
   );
};

const TreeView = (props: TreeViewProps & StackProps) => {
   const { childItems, ...stackProps } = props;
   return (
      <VStack {...stackProps}>
         {childItems?.map((item, idx) => <TreeViewItem key={idx} content={item.content} childItems={item.childItems} />)}
      </VStack>
   );
};

export default TreeView;
