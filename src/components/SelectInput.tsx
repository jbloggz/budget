/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * SelectInput.tsx: This file contains the SelectInput component
 */

// @ts-expect-error: chakra-multiselect doesn't export types properly
import { MultiSelect, useMultiSelect } from 'chakra-multiselect';

export interface SelectInputProps {
   name: string;
   value: string;
   options: string[];
   onChange: (val: string) => void;
}

const SelectInput = (props: SelectInputProps) => {
   const data = useMultiSelect({
      value: props.value,
      options: props.options,
   });

   return (
      <MultiSelect
         options={data.options}
         value={data.value}
         onChange={(value: string, change: unknown) => {
            data.onChange(value, change);
            props.onChange(value);
         }}
         placeholder={'Select or add a ' + props.name}
         single
         create
      />
   );
};

export default SelectInput;