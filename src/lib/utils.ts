import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const WORDS_PER_MINUTE = 200

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return date.toISOString().substring(0, 10)
}

export function calculateReadingTime(text: string) {
  return Math.ceil(text.split(' ').length / WORDS_PER_MINUTE)
}
