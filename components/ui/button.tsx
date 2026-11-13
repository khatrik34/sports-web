import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
const buttonVariants=cva('ui-button',{variants:{variant:{primary:'ui-button-primary',outline:'ui-button-outline'}},defaultVariants:{variant:'primary'}});
export function Button({className,variant,...props}:ComponentProps<'button'> & VariantProps<typeof buttonVariants>){return <button className={cn(buttonVariants({variant}),className)} {...props}/>}
