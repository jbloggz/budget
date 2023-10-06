/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * SearchFilter.tsx: This file contains the SearchFilter component
 */

import { useState } from 'react';
import { SearchIcon } from '@chakra-ui/icons';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/react';

interface SearchFilterProps {
   onChange: (val: string) => void;
}

const SearchFilter = (props: SearchFilterProps) => {
   const [text, setText] = useState<string>('');

   return (
      <InputGroup>
         <InputLeftElement pointerEvents="none">
            <SearchIcon />
         </InputLeftElement>
         <Input
            type="text"
            placeholder="Enter a regex"
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            onBlur={(e) => props.onChange(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && props.onChange(text)}
         />
      </InputGroup>
   );
};

export default SearchFilter;