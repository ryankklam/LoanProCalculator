import { DateOperations } from './interfaces';
import { DateTime } from 'luxon';

export const defaultDateOperations: DateOperations = {
  parseISO: (dateStr: string): Date => {
    return DateTime.fromISO(dateStr).toJSDate();
  },

  startOfDay: (date: Date): Date => {
    return DateTime.fromJSDate(date).startOf('day').toJSDate();
  },

  differenceInDays: (date1: Date, date2: Date): number => {
    const d1 = DateTime.fromJSDate(date1);
    const d2 = DateTime.fromJSDate(date2);
    return Math.round(d1.diff(d2, 'days').days);
  },

  isSameDay: (date1: Date, date2: Date): boolean => {
    const d1 = DateTime.fromJSDate(date1);
    const d2 = DateTime.fromJSDate(date2);
    return d1.hasSame(d2, 'day');
  },

  isAfter: (date1: Date, date2: Date): boolean => {
    const d1 = DateTime.fromJSDate(date1);
    const d2 = DateTime.fromJSDate(date2);
    return d1 > d2;
  },

  addDays: (date: Date, days: number): Date => {
    return DateTime.fromJSDate(date).plus({ days }).toJSDate();
  },

  endOfDay: (date: Date): Date => {
    return DateTime.fromJSDate(date).endOf('day').toJSDate();
  },

  format: (date: Date, formatStr: string): string => {
    const dt = DateTime.fromJSDate(date);
    const luxonFormat = formatStr
      .replace('yyyy', 'yyyy')
      .replace('MM', 'MM')
      .replace('dd', 'dd')
      .replace('MMM', 'MMM')
      .replace('d', 'd');
    return dt.toFormat(luxonFormat);
  }
};
