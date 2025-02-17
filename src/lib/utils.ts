import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import gravatarUrl from 'gravatar-url';
import md5 from 'md5';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGravatarUrl(email: string) {
  return gravatarUrl(md5(email.toLowerCase()), { size: 200, default: 'mp' });
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}