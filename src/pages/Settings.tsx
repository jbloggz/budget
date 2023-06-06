/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Settings.tsx: This file contains the setting page component
 */

import { Container, Select } from '@chakra-ui/react';
import { useContext } from 'react';
import { themeType, themes } from '../theme';
import { ThemeContext, themeContextType } from '../providers';

const Settings = () => {
   const { theme, setTheme } = useContext<themeContextType>(ThemeContext);
   return (
      <Container as="main" paddingY="4">
         <Select placeholder="Select theme..." value={theme} onChange={(e) => setTheme(e.target.value as themeType)}>
            {themes.map((theme) => (
               <option key={theme} value={theme}>
                  {theme}
               </option>
            ))}
         </Select>
      </Container>
   );
};

export default Settings;
