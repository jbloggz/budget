/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * DateRangePicker.tsx: This file contains the date range picker component
 */

import { RangeDatepicker } from 'chakra-dayzed-datepicker';
import { InputGroup, InputLeftElement, useColorModeValue } from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';

interface DateRangePickerProps {
   dates: Date[];
   onChange: (date: Date[]) => void;
}

const DateRangePicker = (props: DateRangePickerProps) => {
   const [dates, setDates] = useState<Date[]>(props.dates);
   const textColor = useColorModeValue('black', 'white');
   const hoverColor = useColorModeValue('gray.200', 'whiteAlpha.400');
   const selectedColor = useColorModeValue('gray.300', 'whiteAlpha.300');

   const inputGroup = useRef<HTMLDivElement>(null);
   const onChange = (dates: Date[]) => {
      setDates(dates);
      if (dates.length === 2) {
         props.onChange(dates);

         /*
          * TODO: This is a hack to blur the input when dates are selected.
          * It would be nice if the library did this for us.
          */
         setTimeout(() => inputGroup.current?.querySelectorAll('input').forEach((e) => e.blur()), 0);
      }
   };

   return (
      <InputGroup zIndex={100} ref={inputGroup}>
         <InputLeftElement pointerEvents="none">
            <CalendarIcon color="gray.300" />
         </InputLeftElement>{' '}
         <RangeDatepicker
            selectedDates={dates}
            onDateChange={onChange}
            configs={{
               dateFormat: 'dd/MM/yyyy',
            }}
            propsConfigs={{
               inputProps: {
                  paddingLeft: '40px',
               },
               dateNavBtnProps: {
                  color: textColor,
                  fontWeight: 'normal',
               },
               dayOfMonthBtnProps: {
                  defaultBtnProps: {
                     fontWeight: 'normal',
                     color: textColor,
                     _hover: {
                        bg: hoverColor,
                        _disabled: {
                           bg: 'gray.100',
                        },
                     },
                  },
                  isInRangeBtnProps: {
                     background: selectedColor,
                  },
                  selectedBtnProps: {
                     background: selectedColor,
                  },
               },
               calendarPanelProps: {
                  contentProps: {
                     borderWidth: 0,
                  },
               },
               weekdayLabelProps: {
                  fontWeight: 'normal',
               },
               dateHeadingProps: {
                  fontWeight: 'semibold',
               },
            }}
         />
      </InputGroup>
   );
};

export default DateRangePicker;
