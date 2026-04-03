import { InterestCalculationStrategy } from './interfaces';

export const simpleInterestStrategy: InterestCalculationStrategy = {
  calculateDailyInterest: (
    balance: number,
    rate: number,
    dayCountConvention: number
  ): number => {
    return balance * (rate / 100) / dayCountConvention;
  },

  calculatePeriodInterest: (
    startDate: Date,
    endDate: Date,
    balance: number,
    rate: number,
    dayCountConvention: number
  ): number => {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    return balance * (rate / 100) * days / dayCountConvention;
  }
};
