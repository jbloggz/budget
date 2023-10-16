/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * index.ts: This file exports all of the component styles
 */

import { drawerTheme } from './drawer';
import { buttonTheme } from './button';
import { topBarTheme } from './topBar';
import { sideBarTheme } from './sideBar';
import { loginTheme } from './login';

export const components = {
   Button: buttonTheme,
   Drawer: drawerTheme,
   Login: loginTheme,
   SideBar: sideBarTheme,
   TopBar: topBarTheme,
};
