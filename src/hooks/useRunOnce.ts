/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * useRunOnce.ts: This file contains the useRunOnce custom hook
 */

import React, { useEffect, useRef } from 'react';

export type useRunOnceProps = {
   fn: () => void;
   sessionKey?: string;
};

export const useRunOnce: React.FC<useRunOnceProps> = ({ fn, sessionKey }) => {
   const triggered = useRef<boolean>(false);

   useEffect(() => {
      const hasBeenTriggered = sessionKey ? sessionStorage.getItem(sessionKey) : triggered.current;

      if (!hasBeenTriggered) {
         fn();
         triggered.current = true;

         if (sessionKey) {
            sessionStorage.setItem(sessionKey, 'true');
         }
      }
   }, [fn, sessionKey]);

   return null;
};
