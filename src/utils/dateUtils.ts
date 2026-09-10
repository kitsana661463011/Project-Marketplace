/**
 * Utility functions for standardizing Thai Buddhist Era (พ.ศ.) date and time formatting
 * across the entire Marketplace administration system.
 */

/**
 * Format a date into standardized short Thai date: "25 ส.ค. 2569"
 */
export const formatThaiDate = (
  value?: string | number | Date | null,
  fallback = '-'
): string => {
  if (!value) return fallback;
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : fallback;

  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format a date and time into standardized Thai date & time: "25 ส.ค. 2569 18:32 น."
 */
export const formatThaiDateTime = (
  value?: string | number | Date | null,
  fallback = '-',
  includeSuffix = true
): string => {
  if (!value) return fallback;
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : fallback;

  const datePart = date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timePart = date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return includeSuffix ? `${datePart} ${timePart} น.` : `${datePart} ${timePart}`;
};

/**
 * Format a date into full formal Thai date: "25 สิงหาคม 2569"
 */
export const formatThaiDateFull = (
  value?: string | number | Date | null,
  fallback = '-'
): string => {
  if (!value) return fallback;
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : fallback;

  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format a date into full formal Thai date with time: "25 สิงหาคม 2569 เวลา 18:32 น."
 */
export const formatThaiDateTimeFull = (
  value?: string | number | Date | null,
  fallback = '-'
): string => {
  if (!value) return fallback;
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : fallback;

  const datePart = date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timePart = date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${datePart} เวลา ${timePart} น.`;
};
