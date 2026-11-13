'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
/** Opt in around interactive features that actually fetch on the client. */
export function QueryProvider({children}:{children:ReactNode}){const [client]=useState(()=>new QueryClient());return <QueryClientProvider client={client}>{children}</QueryClientProvider>}
