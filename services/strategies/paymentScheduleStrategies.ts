import { PaymentScheduleStrategy, DateOperations } from './interfaces';
import { InterestPaymentFrequency } from '../../types';

export const createPaymentScheduleStrategy = (
  dateOps: DateOperations
): PaymentScheduleStrategy => ({
  generatePaymentDates: (
    startDate: Date,
    endDate: Date,
    frequency: InterestPaymentFrequency,
    paymentDay: number
  ): Date[] => {
    const dates: Date[] = [];
    let current = new Date(startDate);
    current.setDate(paymentDay);

    if (current < startDate) {
      current.setMonth(current.getMonth() + 1);
    }

    while (current <= endDate) {
      dates.push(new Date(current));

      switch (frequency) {
        case 'MONTHLY':
          current.setMonth(current.getMonth() + 1);
          current.setDate(paymentDay);
          break;
        case 'QUARTERLY':
          current.setMonth(current.getMonth() + 3);
          current.setDate(paymentDay);
          break;
        case 'BIWEEKLY':
          current.setDate(current.getDate() + 14);
          break;
      }
    }

    return dates;
  }
});
