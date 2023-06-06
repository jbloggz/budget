/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * login.ts: This file contains the styles for the Login component
 */

import { createMultiStyleConfigHelpers, defineStyle } from '@chakra-ui/styled-system';
import { mode } from '@chakra-ui/theme-tools';

const helpers = createMultiStyleConfigHelpers(['card']);

const loginStyle = defineStyle((props) => {
   return { bg: mode(`white`, `gray.800`)(props) };
});

export const loginTheme = helpers.defineMultiStyleConfig({
   baseStyle: helpers.definePartsStyle((props) => ({
      card: loginStyle(props),
   })),
});
