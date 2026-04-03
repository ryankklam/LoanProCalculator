import { Calculator, CalculatorDependencies, CalculatorContext } from './types';
import { addMonths } from 'date-fns';
import { dictionary } from '../../translations';

const calculatePMT = (principal: number, annualRate: number, months: number): number => {
  if (annualRate === 0) return principal / months;
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

export class StraightLineCalculator implements Calculator {
  constructor(private deps: CalculatorDependencies) {}

  calculate(context: CalculatorContext): { schedule: any[]; summary: any } {
    const { dateOps, holidayOps, rateOps } = this.deps;
    const { params, holidays, rateRanges, repayments, language } = context;
    const t = dictionary[language];
    const dateLocale = language === 'cn' ? 'yyyy-MM-dd' : 'MMM d';

    const { amount, initialRate, tenureMonths, startDate, holidayShiftMode, 
            adjustmentStrategy, dayCountConvention } = params;

    const schedule: any[] = [];
    const startObj = dateOps.parseISO(startDate);
    const loanEndDate = addMonths(startObj, tenureMonths);

    let currentBalance = amount;
    let previousDate = startObj;
    let totalInterest = 0;

    let currentRateForPMT = rateOps.getRateForDay(startObj, initialRate, rateRanges);
    let currentPMT = calculatePMT(amount, currentRateForPMT, tenureMonths);
    let fixedInstallmentTarget = currentPMT;

    const MAX_ITERATIONS = 600;
    let i = 1;

    while (currentBalance > 0.005 && i <= MAX_ITERATIONS) {
      const nominalDate = addMonths(startObj, i);
      let actualDate: Date;

      if (holidayShiftMode === 'BEFORE') {
        actualDate = holidayOps.getPreviousBusinessDay(nominalDate, holidays);
      } else {
        actualDate = holidayOps.getNextBusinessDay(nominalDate, holidays);
      }

      if (!dateOps.isAfter(actualDate, previousDate)) {
        actualDate = dateOps.addDays(previousDate, 1);
      }

      const daysCount = dateOps.differenceInDays(actualDate, previousDate);
      const notes: string[] = [];

      if (!dateOps.isSameDay(nominalDate, actualDate)) {
        const shiftDir = dateOps.isAfter(actualDate, nominalDate) ? t.noteDeferred : t.notePreponed;
        const formattedNominal = dateOps.format(nominalDate, dateLocale);
        notes.push(`${shiftDir} ${t.noteFrom} ${formattedNominal} (${t.noteHoliday})`);
      }

      const rateAtPeriodStart = rateOps.getRateForDay(previousDate, initialRate, rateRanges);

      if (Math.abs(rateAtPeriodStart - currentRateForPMT) > 0.001) {
        currentRateForPMT = rateAtPeriodStart;

        if (adjustmentStrategy === 'CHANGE_INSTALLMENT') {
          const remainingMonths = Math.max(1, tenureMonths - (i - 1));
          currentPMT = calculatePMT(currentBalance, currentRateForPMT, remainingMonths);
          notes.push(`${t.noteRateChanged} ${currentRateForPMT}% - ${t.notePmtRecalculated}`);
        } else {
          currentPMT = fixedInstallmentTarget;
          notes.push(`${t.noteRateChanged} ${currentRateForPMT}% - ${t.notePmtFixed}`);
        }
      }

      let interestForPeriod = 0;
      let accumulatedBalanceForRate = 0;

      let segmentInterest = 0;
      let lastEventDate = previousDate;
      let segmentDaysCounter = 0;
      let activeSegmentRate = rateOps.getRateForDay(dateOps.addDays(previousDate, 1), initialRate, rateRanges);

      for (let d = 1; d <= daysCount; d++) {
        const calculationDay = dateOps.addDays(previousDate, d);
        const dailyRatePercent = rateOps.getRateForDay(calculationDay, initialRate, rateRanges);

        if (Math.abs(dailyRatePercent - activeSegmentRate) > 0.0001) {
          if (segmentDaysCounter > 0) {
            schedule.push({
              type: 'SEGMENT',
              period: i,
              nominalDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
              actualDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
              segmentStartDate: dateOps.format(lastEventDate, 'yyyy-MM-dd'),
              segmentEndDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
              daysCount: segmentDaysCounter,
              principal: 0,
              interest: segmentInterest,
              total: 0,
              outstandingBalance: currentBalance,
              effectiveRate: activeSegmentRate,
              notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
            });
          }

          lastEventDate = calculationDay;
          segmentInterest = 0;
          segmentDaysCounter = 0;
          activeSegmentRate = dailyRatePercent;
        }

        const dailyInterest = currentBalance * (dailyRatePercent / 100) / dayCountConvention;
        interestForPeriod += dailyInterest;
        segmentInterest += dailyInterest;
        accumulatedBalanceForRate += currentBalance;
        segmentDaysCounter++;

        const dailyRepayments = repayments.filter(r => 
          dateOps.isSameDay(dateOps.parseISO(r.date), calculationDay)
        );

        if (dailyRepayments.length > 0) {
          for (const r of dailyRepayments) {
            if (segmentDaysCounter > 0) {
              schedule.push({
                type: 'SEGMENT',
                period: i,
                nominalDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
                actualDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
                segmentStartDate: dateOps.format(lastEventDate, 'yyyy-MM-dd'),
                segmentEndDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
                daysCount: segmentDaysCounter,
                principal: 0,
                interest: segmentInterest,
                total: 0,
                outstandingBalance: currentBalance,
                effectiveRate: activeSegmentRate,
                notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
              });
            }

            currentBalance -= r.amount;
            if (currentBalance < 0) currentBalance = 0;

            schedule.push({
              type: 'REPAYMENT',
              period: i,
              nominalDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
              actualDate: dateOps.format(calculationDay, 'yyyy-MM-dd'),
              daysCount: 0,
              principal: r.amount,
              interest: 0,
              total: r.amount,
              outstandingBalance: currentBalance,
              effectiveRate: 0,
              notes: [t.noteExtraRepayment]
            });

            lastEventDate = calculationDay;
            segmentInterest = 0;
            segmentDaysCounter = 0;

            currentRateForPMT = dailyRatePercent;

            if (adjustmentStrategy === 'CHANGE_INSTALLMENT') {
              const remainingMonths = Math.max(1, tenureMonths - (i - 1));
              currentPMT = calculatePMT(currentBalance, currentRateForPMT, remainingMonths);
            }
          }
        }
      }

      if (segmentDaysCounter > 0) {
        schedule.push({
          type: 'SEGMENT',
          period: i,
          nominalDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
          actualDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
          segmentStartDate: dateOps.format(lastEventDate, 'yyyy-MM-dd'),
          segmentEndDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
          daysCount: segmentDaysCounter,
          principal: 0,
          interest: segmentInterest,
          total: 0,
          outstandingBalance: currentBalance,
          effectiveRate: activeSegmentRate,
          notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
        });
      }

      let effectiveRate = 0;
      if (accumulatedBalanceForRate > 0) {
        effectiveRate = (interestForPeriod / accumulatedBalanceForRate) * 365 * 100;
      }

      let principalPayment = 0;
      let totalPayment = currentPMT;

      const canPayOff = (currentBalance + interestForPeriod) <= totalPayment;
      const isForcedEnd = (adjustmentStrategy === 'CHANGE_INSTALLMENT' && i === tenureMonths);

      if (canPayOff || isForcedEnd) {
        principalPayment = currentBalance;
        totalPayment = principalPayment + interestForPeriod;
      } else {
        principalPayment = totalPayment - interestForPeriod;
      }

      currentBalance -= principalPayment;
      if (currentBalance < 0.01) currentBalance = 0;

      totalInterest += interestForPeriod;

      if (adjustmentStrategy === 'CHANGE_TENURE' && i > tenureMonths) {
        notes.push(t.noteTenureExtended);
      } else if (adjustmentStrategy === 'CHANGE_TENURE' && canPayOff && i < tenureMonths) {
        notes.push(t.notePaidOffEarly);
      }

      schedule.push({
        type: 'INSTALLMENT',
        period: i,
        nominalDate: dateOps.format(nominalDate, 'yyyy-MM-dd'),
        actualDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
        daysCount,
        principal: principalPayment,
        interest: interestForPeriod,
        total: totalPayment,
        outstandingBalance: currentBalance,
        effectiveRate,
        notes
      });

      previousDate = actualDate;

      if (currentBalance <= 0) break;

      i++;
    }

    const summary = {
      totalPrincipal: amount,
      totalInterest,
      totalPaid: amount + totalInterest,
      lastPaymentDate: schedule.find(s => s.outstandingBalance <= 0.01 && s.type === 'INSTALLMENT')?.actualDate 
                      || schedule[schedule.length - 1]?.actualDate,
      loanEndDate: dateOps.format(loanEndDate, 'yyyy-MM-dd')
    };

    return { schedule, summary };
  }
}
