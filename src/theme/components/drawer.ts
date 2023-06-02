/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * drawer.ts: This file contains the styles for the Drawer component
 */

import { createMultiStyleConfigHelpers, defineStyle } from '@chakra-ui/styled-system';
import { mode } from '@chakra-ui/theme-tools';

const helpers = createMultiStyleConfigHelpers(['dialog']);

const dialogStyle = defineStyle((props) => {
   const { colorScheme: c } = props;
   let bg;

   if (c === 'gray') {
      bg = mode(`gray.100`, `gray.700`)(props);
   } else {
      bg = mode(`${c}.500`, `gray.700`)(props);
   }
   return {
      bg,
   };
});

export const drawerTheme = helpers.defineMultiStyleConfig({
   baseStyle: helpers.definePartsStyle((props) => ({
      dialog: dialogStyle(props),
   })),
});
