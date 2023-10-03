/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * DateRangePicker.test.tsx: This file contains the tests for the DateRangePicker component
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../providers';
import { DateRangePicker } from '.';
import { useState } from 'react';

describe('DateRangePicker', () => {
   it('Renders the DateRangePicker', () => {
      const TestComponent = () => {
         const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
         return <DateRangePicker dates={dates} onDateChange={setDates} />;
      };

      const theme = 'light';
      const node = render(
         <ThemeProvider theme={theme} setTheme={vi.fn()}>
            <TestComponent />
         </ThemeProvider>
      );

      const input = node.container.querySelector('input');
      expect(input).toBeInTheDocument();
   });
});
