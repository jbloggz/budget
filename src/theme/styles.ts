/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * styles.ts: This file contains all of the global style overrides
 */

import { StyleFunctionProps } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

export default {
   global: (props: StyleFunctionProps) => ({
      body: {
         bg: mode('gray.50', 'gray.900')(props),
      },
   }),
};
