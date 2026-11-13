'use client';
import { useQuery, type QueryKey } from '@tanstack/react-query';
/** Use under QueryProvider when a future client-side endpoint needs refetching. */
export function useServiceQuery<T>(queryKey:QueryKey,queryFn:()=>Promise<T>){return useQuery({queryKey,queryFn,staleTime:30_000,retry:1});}
