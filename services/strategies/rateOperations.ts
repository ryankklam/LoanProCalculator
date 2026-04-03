import { RateOperations, DateOperations } from './interfaces';
import { RateRange } from '../../types';

export const createRateOperations = (
  dateOps: DateOperations
): RateOperations => ({
  getRateForDay: (date: Date, initialRate: number, rateRanges: RateRange[]): number => {
    const sortedRanges = [...rateRanges].sort((a, b) => 
      a.startDate.localeCompare(b.startDate)
    );

    const candidates = sortedRanges.map((range, index) => {
      let effectiveEndDate: Date | null = null;

      if (range.endDate) {
        effectiveEndDate = dateOps.endOfDay(dateOps.parseISO(range.endDate));
      } else {
        if (index < sortedRanges.length - 1) {
          const nextRangeStart = dateOps.parseISO(sortedRanges[index + 1].startDate);
          effectiveEndDate = dateOps.endOfDay(dateOps.addDays(nextRangeStart, -1));
        } else {
          effectiveEndDate = null;
        }
      }

      return {
        ...range,
        effectiveEndDate
      };
    });

    const matchingRanges = candidates.filter(r => {
      const start = dateOps.startOfDay(dateOps.parseISO(r.startDate));

      if (dateOps.isAfter(start, date) && !dateOps.isSameDay(start, date)) {
        return false;
      }

      if (r.effectiveEndDate) {
        if (dateOps.isAfter(date, r.effectiveEndDate) && !dateOps.isSameDay(date, r.effectiveEndDate)) {
          return false;
        }
      }

      return true;
    });

    if (matchingRanges.length > 0) {
      return matchingRanges[matchingRanges.length - 1].rate;
    }

    return initialRate;
  }
});
