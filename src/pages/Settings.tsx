/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Settings.tsx: This file contains the settings page component
 */

import { FormControl, FormLabel, Heading, Select } from '@chakra-ui/react';
import { themeType, themes } from '../theme';
import { ThemeContext, themeContextType, useContext } from '../providers';

const Settings = () => {
   const { theme, setTheme } = useContext<themeContextType>(ThemeContext);
   return (
      <>
         <Heading pb="8" size="lg">Settings</Heading>
         <FormControl>
            <FormLabel htmlFor="theme">Theme</FormLabel>
            <Select placeholder="Select theme..." value={theme} onChange={(e) => setTheme(e.target.value as themeType)}>
               {themes.map((theme) => (
                  <option key={theme} value={theme}>
                     {theme}
                  </option>
               ))}
            </Select>
         </FormControl>
      </>
   );
};

export default Settings;
