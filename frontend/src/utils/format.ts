/**
 * Format a number as currency with symbol and comma separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency code (default: 'MXN' for Mexican Peso)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, decimals: number = 2, currency: string = 'MXN'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a number with comma separators (no currency symbol)
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a date string (YYYY-MM-DD) to readable format
 * @param dateStr - Date string in ISO format (YYYY-MM-DD)
 * @param format - Format type ('long' = "15 de noviembre de 2025", 'short' = "15/11/2025", 'month' = "2025-11")
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string, format: 'long' | 'short' | 'month' = 'short'): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr + 'T00:00:00');
    
    if (format === 'long') {
      return new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } else if (format === 'month') {
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: '2-digit',
      }).format(date).replace('/', '-');
    } else {
      // 'short' format
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    }
  } catch (e) {
    return dateStr;
  }
};
