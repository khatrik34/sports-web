import { z } from 'zod';
import { site } from '@/config/site';
export class ServiceError extends Error { constructor(message:string, public readonly status?:number){super(message);this.name='ServiceError';} }
/** Future REST adapter helper. Only call with public endpoints; authorization belongs on the server. */
export async function apiRequest<T>(path:string,schema:z.ZodType<T>,init?:RequestInit):Promise<T>{
 if(!site.apiBaseUrl) throw new ServiceError('API base URL is not configured.');
 let response:Response;
 try { response=await fetch(new URL(path,site.apiBaseUrl),init); } catch { throw new ServiceError('Unable to reach the service.'); }
 if(!response.ok) throw new ServiceError('The service could not complete the request.',response.status);
 let payload:unknown;
 try { payload=await response.json(); } catch { throw new ServiceError('The service returned invalid JSON.',response.status); }
 const parsed=schema.safeParse(payload);
 if(!parsed.success) throw new ServiceError('The service returned an invalid response.',response.status);
 return parsed.data;
}
