import { Calculator, CalculatorDependencies, CalculatorContext } from './types';
import { addMonths } from 'date-fns';
import { dictionary } from '../../translations';

export class IrregularRepayment14Calculator implements Calculator {
  constructor(private deps: CalculatorDependencies) {}

  calculate(context: CalculatorContext): { schedule: any[]; summary: any } {
    const { dateOps, holidayOps, rateOps, interestStrategy, paymentScheduleStrategy } = this.deps;
    const { params, holidays, rateRanges, repayments, language } = context;
    const t = dictionary[language];
    const dateLocale = language === 'cn' ? 'yyyy-MM-dd' : 'MMM d';

    const { amount, initialRate, tenureMonths, startDate, holidayShiftMode, 
            dayCountConvention, interestPaymentFrequency, interestPaymentDay } = params;

    const schedule: any[] = [];
    const startObj = dateOps.parseISO(startDate);
    const loanEndDate = addMonths(startObj, tenureMonths);

    let currentBalance = amount;
    let previousDate = startObj;
    let totalInterest = 0;

    const sortedRepayments = [...repayments].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const endDate = sortedRepayments.length > 0 
      ? new Date(Math.max(new Date(sortedRepayments[sortedRepayments.length - 1].date).getTime(), loanEndDate.getTime()))
      : loanEndDate;

    const interestPaymentDates = paymentScheduleStrategy.generatePaymentDates(
      startObj, endDate, interestPaymentFrequency!, interestPaymentDay!
    );

    const allEvents = [
      ...sortedRepayments.map(r => ({ date: new Date(r.date), type: 'PRINCIPAL' as const, amount: r.amount })),
      ...interestPaymentDates.map(date => ({ date, type: 'INTEREST' as const, amount: 0 })),
      { date: loanEndDate, type: 'PRINCIPAL' as const, amount: 0 }
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let i = 1;
    let lastInterestPaymentDate = startObj;

    for (const event of allEvents) {
      if (currentBalance <= 0.005) break;

      const nominalDate = event.date;
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

        // 对于本金还款，添加利随本清和未到期利息的分段明细
        if (event.type === 'PRINCIPAL' && event.amount > 0 && !dateOps.isSameDay(event.date, loanEndDate)) {
          const principalPayment = event.amount;
          const remainingBalance = currentBalance - principalPayment;
          
          // 计算利随本清利息（还款本金对应的利息）
          const dailyRate = params.initialRate / 100 / params.dayCountConvention;
          const dailyInterest = principalPayment * dailyRate;
          const principalWithInterest = dailyInterest * segmentDaysCounter;
          
          // 计算未到期利息（剩余本金对应的利息）
          const unexpiredInterest = segmentInterest - principalWithInterest;
          
          // 添加利随本清明细
          schedule.push({
            type: 'SEGMENT',
            period: i,
            nominalDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
            actualDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
            segmentStartDate: dateOps.format(lastEventDate, 'yyyy-MM-dd'),
            segmentEndDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
            daysCount: segmentDaysCounter,
            principal: 0,
            interest: principalWithInterest,
            total: 0,
            outstandingBalance: currentBalance,
            effectiveRate: activeSegmentRate,
            notes: [t.principalWithInterest, `${t.noteBasis}: $${principalPayment.toFixed(2)}`]
          });
          
          // 添加未到期利息明细
          if (remainingBalance > 0.005 && unexpiredInterest > 0.005) {
            schedule.push({
              type: 'SEGMENT',
              period: i,
              nominalDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
              actualDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
              segmentStartDate: dateOps.format(lastEventDate, 'yyyy-MM-dd'),
              segmentEndDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
              daysCount: segmentDaysCounter,
              principal: 0,
              interest: unexpiredInterest,
              total: 0,
              outstandingBalance: remainingBalance,
              effectiveRate: activeSegmentRate,
              notes: [`${t.noteBasis}: $${remainingBalance.toFixed(2)}`, t.unexpiredInterest]
            });
          }
        }
      }

      let effectiveRate = 0;
      if (accumulatedBalanceForRate > 0) {
        effectiveRate = (interestForPeriod / accumulatedBalanceForRate) * 365 * 100;
      }

      let principalPayment = 0;
      let interestPayment = 0;
      let totalPayment = 0;
      let shouldAddRecord = false;

      if (event.type === 'PRINCIPAL') {
        if (dateOps.isSameDay(event.date, loanEndDate) && event.amount === 0 && currentBalance > 0) {
          principalPayment = currentBalance;
          interestPayment = interestForPeriod;
          notes.push(t.loanEndRepayment);
        } else {
          principalPayment = event.amount;
          // 利随本清：仅归还本次还款本金对应的利息
          // 计算方式：还款本金 × 日利率 × 天数
          const dailyRate = params.initialRate / 100 / params.dayCountConvention;
          const dailyInterest = principalPayment * dailyRate;
          interestPayment = dailyInterest * daysCount;
          notes.push(t.principalRepayment);
        }

        totalPayment = principalPayment + interestPayment;

        currentBalance -= principalPayment;
        if (currentBalance < 0.01) currentBalance = 0;

        totalInterest += interestPayment;

        shouldAddRecord = true;
      } else if (event.type === 'INTEREST') {
        interestPayment = interestForPeriod;
        totalPayment = interestPayment;

        totalInterest += interestPayment;

        notes.push(t.interestRepayment);
        shouldAddRecord = true;
      }

      if (shouldAddRecord) {
        schedule.push({
          type: 'INSTALLMENT',
          period: i,
          nominalDate: dateOps.format(nominalDate, 'yyyy-MM-dd'),
          actualDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
          daysCount,
          principal: principalPayment,
          interest: interestPayment,
          total: totalPayment,
          outstandingBalance: currentBalance,
          effectiveRate,
          notes
        });

        // 对于本金还款，不更新previousDate，以便利息还款日计算完整区间
        // 对于利息还款和到期日还款，更新previousDate
        if (event.type === 'INTEREST' || (event.type === 'PRINCIPAL' && dateOps.isSameDay(event.date, loanEndDate))) {
          previousDate = actualDate;
          lastInterestPaymentDate = actualDate;
        }
        i++;
      }
    }

    const summary = {
      totalInterest,
      totalPaid: amount + totalInterest,
      lastPaymentDate: schedule.find(s => s.outstandingBalance <= 0.01 && s.type === 'INSTALLMENT')?.actualDate 
                      || schedule[schedule.length - 1]?.actualDate,
      loanEndDate: dateOps.format(loanEndDate, 'yyyy-MM-dd')
    };

    return { schedule, summary };
  }
}
