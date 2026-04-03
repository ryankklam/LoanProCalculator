import { 
  DateOperations, 
  HolidayOperations, 
  RateOperations,
  InterestCalculationStrategy,
  PaymentScheduleStrategy 
} from '../strategies/interfaces';
import { LoanParams, Holiday, RateRange, RepaymentEvent, Installment, Summary } from '../../types';
import { Language, TranslationDictionary } from '../../translations';

export interface CalculatorDependencies {
  dateOps: DateOperations;
  holidayOps: HolidayOperations;
  rateOps: RateOperations;
  interestStrategy: InterestCalculationStrategy;
  paymentScheduleStrategy: PaymentScheduleStrategy;
}

export interface CalculatorContext {
  params: LoanParams;
  holidays: Holiday[];
  rateRanges: RateRange[];
  repayments: RepaymentEvent[];
  language: Language;
  t: TranslationDictionary;
}

export interface Calculator {
  calculate(context: CalculatorContext): { 
    schedule: Installment[]; 
    summary: Summary;
  };
}
