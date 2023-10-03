/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * DateRangePicker.tsx: This file contains the date range picker component
 */

import { RangeDatepicker } from 'chakra-dayzed-datepicker';
import { InputGroup, InputLeftElement } from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { ThemeContext, useContext } from '../providers';
import { useState } from 'react';

interface DateRangePickerProps {
   dates: Date[];
   onDateChange: (date: Date[]) => void;
}

const DateRangePicker = (props: DateRangePickerProps) => {
   const [dates, setDates] = useState<Date[]>(props.dates);
   const { theme } = useContext(ThemeContext);

   const onDateChange = (dates: Date[]) => {
      setDates(dates);
      if (dates.length === 2) {
         props.onDateChange(dates);
      }
   };

   const textColor = theme === 'dark' ? 'white' : 'black';
   const hoverColor = theme === 'dark' ? 'whiteAlpha.400' : theme === 'light' ? 'gray.200' : `${theme}.200`;
   const selectedColor = theme === 'dark' ? 'whiteAlpha.300' : theme === 'light' ? 'gray.300' : `${theme}.300`;

   return (
      <InputGroup zIndex={100}>
         <InputLeftElement pointerEvents="none">
            <CalendarIcon color="gray.300" />
         </InputLeftElement>{' '}
         <RangeDatepicker
            selectedDates={dates}
            onDateChange={onDateChange}
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
