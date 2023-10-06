/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Table.test.tsx: This file contains the tests for the Table component
 */

import { describe, it, expect } from 'vitest';
import { render} from '@testing-library/react';
import { Table } from '.';

describe('Table', () => {
   it('Renders an empty Table', () => {
      const {container} = render(<Table columns={[]} rows={[]}/>);
      const elem = container.querySelector('tbody');
      expect(elem).toBeEmptyDOMElement();
   });
});
