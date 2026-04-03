import { LoanParams, Holiday, RateRange, RepaymentEvent, Installment, Summary } from '../types';
import { Language, dictionary } from '../translations';
import { createCalculator } from './calculatorFactory';

export const calculateSchedule = (
  params: LoanParams,
  holidays: Holiday[],
  rateRanges: RateRange[],
  repayments: RepaymentEvent[],
  language: Language = 'en'
): { schedule: Installment[]; summary: Summary } => {
  const calculator = createCalculator(params.repaymentScheme);
  
  const context = {
    params,
    holidays,
    rateRanges,
    repayments,
    language,
    t: dictionary[language]
  };
  
  return calculator.calculate(context);
};
