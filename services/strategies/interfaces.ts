import { Holiday, RateRange, InterestPaymentFrequency } from '../../types';

export interface DateOperations {
  parseISO(dateStr: string): Date;
  startOfDay(date: Date): Date;
  differenceInDays(date1: Date, date2: Date): number;
  isSameDay(date1: Date, date2: Date): boolean;
  isAfter(date1: Date, date2: Date): boolean;
  addDays(date: Date, days: number): Date;
  endOfDay(date: Date): Date;
  format(date: Date, formatStr: string): string;
}

export interface HolidayOperations {
  isHoliday(date: Date, holidays: Holiday[]): boolean;
  getNextBusinessDay(date: Date, holidays: Holiday[]): Date;
  getPreviousBusinessDay(date: Date, holidays: Holiday[]): Date;
}

export interface RateOperations {
  getRateForDay(date: Date, initialRate: number, rateRanges: RateRange[]): number;
}

export interface InterestCalculationStrategy {
  calculateDailyInterest(balance: number, rate: number, dayCountConvention: number): number;
  calculatePeriodInterest(
    startDate: Date,
    endDate: Date,
    balance: number,
    rate: number,
    dayCountConvention: number
  ): number;
}

export interface PaymentScheduleStrategy {
  generatePaymentDates(
    startDate: Date,
    endDate: Date,
    frequency: InterestPaymentFrequency,
    paymentDay: number
  ): Date[];
}
