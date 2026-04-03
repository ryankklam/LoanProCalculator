import { Calculator, CalculatorDependencies } from './calculators/types';
import { StraightLineCalculator } from './calculators/straightLineCalculator';
import { IrregularRepayment5Calculator } from './calculators/irregularRepayment5Calculator';
import { defaultDateOperations } from './strategies/dateOperations';
import { createHolidayOperations } from './strategies/holidayOperations';
import { createRateOperations } from './strategies/rateOperations';
import { simpleInterestStrategy } from './strategies/interestStrategies';
import { createPaymentScheduleStrategy } from './strategies/paymentScheduleStrategies';
import { RepaymentScheme } from '../types';

export const createCalculator = (
  repaymentScheme: RepaymentScheme,
  customDeps?: Partial<CalculatorDependencies>
): Calculator => {
  const dateOps = customDeps?.dateOps ?? defaultDateOperations;
  const holidayOps = customDeps?.holidayOps ?? createHolidayOperations(dateOps);
  const rateOps = customDeps?.rateOps ?? createRateOperations(dateOps);
  const interestStrategy = customDeps?.interestStrategy ?? simpleInterestStrategy;
  const paymentScheduleStrategy = customDeps?.paymentScheduleStrategy 
    ?? createPaymentScheduleStrategy(dateOps);

  const deps: CalculatorDependencies = {
    dateOps,
    holidayOps,
    rateOps,
    interestStrategy,
    paymentScheduleStrategy
  };

  const calculators: Record<RepaymentScheme, new (deps: CalculatorDependencies) => Calculator> = {
    'EQUAL_INSTALLMENT': StraightLineCalculator,
    'IRREGULAR_REPAYMENT_5': IrregularRepayment5Calculator
  };

  const CalculatorClass = calculators[repaymentScheme];
  if (!CalculatorClass) {
    throw new Error(`Unknown repayment scheme: ${repaymentScheme}`);
  }

  return new CalculatorClass(deps);
};
