import { DateOperations } from './interfaces';
import { addDays, differenceInDays, isSameDay, isAfter, endOfDay, format } from 'date-fns';

export const defaultDateOperations: DateOperations = {
  parseISO: (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  },

  startOfDay: (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  differenceInDays: (date1: Date, date2: Date): number => {
    return differenceInDays(date1, date2);
  },

  isSameDay: (date1: Date, date2: Date): boolean => {
    return isSameDay(date1, date2);
  },

  isAfter: (date1: Date, date2: Date): boolean => {
    return isAfter(date1, date2);
  },

  addDays: (date: Date, days: number): Date => {
    return addDays(date, days);
  },

  endOfDay: (date: Date): Date => {
    return endOfDay(date);
  },

  format: (date: Date, formatStr: string): string => {
    return format(date, formatStr);
  }
};
