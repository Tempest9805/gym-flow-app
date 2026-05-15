import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn - Utility for merging tailwind classes with support for conditional logic.
 * Uses clsx for joining and tailwind-merge to handle overrides correctly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
