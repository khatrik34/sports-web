'use client';
import { useState } from 'react';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function Newsletter(){const [message,setMessage]=useState('');return <section className="newsletter"><div><span className="eyebrow">THE BOUNDARY BRIEFING</span><h2>A little closer to the game<span>.</span></h2><p>The stories worth your time, straight to your inbox.</p></div><form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);const result=z.email().safeParse(form.get('email'));setMessage(result.success?'Thanks for your interest! Newsletter subscriptions are not connected in this demo.':'Please enter a valid email address.')}}><label htmlFor="email" className="sr-only">Email address</label><div className="subscribe"><input id="email" name="email" type="email" placeholder="Your email address" required/><Button aria-label="Subscribe to newsletter">SIGN ME UP <ArrowRight size={16}/></Button></div><p aria-live="polite">{message||'No noise. Just the good stuff. Demo signup only.'}</p></form></section>}
