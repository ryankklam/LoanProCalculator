import { HolidayOperations, DateOperations } from './interfaces';
import { Holiday } from '../../types';
import { addDays } from 'date-fns';

export const createHolidayOperations = (
  dateOps: DateOperations
): HolidayOperations => {
  const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
    return holidays.some(h => {
      const start = dateOps.startOfDay(dateOps.parseISO(h.startDate));
      const end = dateOps.endOfDay(dateOps.parseISO(h.endDate));
      
      if (date >= start && date <= end) {
        return true;
      }
      return false;
    });
  };

  return {
    isHoliday,

    getNextBusinessDay: (date: Date, holidays: Holiday[]): Date => {
      let current = new Date(date);
      while (isHoliday(current, holidays)) {
        current = addDays(current, 1);
      }
      return current;
    },

    getPreviousBusinessDay: (date: Date, holidays: Holiday[]): Date => {
      let current = new Date(date);
      while (isHoliday(current, holidays)) {
        current = addDays(current, -1);
      }
      return current;
    }
  };
};
