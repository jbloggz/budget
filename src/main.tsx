/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * main.tsx: This file is the main entry point for react
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>
);
