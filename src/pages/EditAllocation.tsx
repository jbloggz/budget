/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * EditAllocation.tsx: This file contains the EditAllocation page
 */

import { useCallback } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { EditAllocationModal } from '../components';

const EditAllocation = () => {
   const onAllocationChange = useOutletContext<() => void>();
   const navigate = useNavigate();
   const { state } = useLocation();
   const { id: allocation } = useParams();
   const onClose = useCallback(() => {
      /*
       * Navigate back to allocations page. If we came here via the allocations
       * page (ie. clicking on an allocation, then go back. Otherwise we must
       * come here via a url, so navigate to the allocations and replace the
       * history
       */
      if (state === 'modal') {
         navigate(-1);
      } else {
         navigate('..', { replace: true });
      }
   }, [navigate, state]);

   const onSave = useCallback(() => {
      onAllocationChange();
      onClose();
   }, [onAllocationChange, onClose]);

   return <EditAllocationModal id={allocation || ''} isOpen={true} onClose={onClose} onSave={onSave} />;
};

export default EditAllocation;
