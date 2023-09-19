/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * app.types.d.ts: This file contains type definitions needed by the whole app
 */

export interface transactionType {
   date: string;
   amount: number;
   description: string;
   source: string;
}
