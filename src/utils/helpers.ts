import { formatThaiDate, formatThaiDateTime } from './dateUtils';

/**
 * Utility function to combine classNames
 * Useful for conditional class combinations
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Format a date to Thai locale
 */
export const formatDateThai = (date?: string | number | Date | null): string => {
  return formatThaiDate(date);
};

/**
 * Format a date and time to Thai locale
 */
export const formatDateTimeThai = (date?: string | number | Date | null): string => {
  return formatThaiDateTime(date);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (value?: string | number | Date | null): string => {
  if (!value) return '-';
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

  return formatThaiDate(date);
};

/**
 * Format a number as currency (Thai Baht)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(value);
};

/**
 * Format a number with thousand separators
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('th-TH').format(value);
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Check if a string is a valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};
