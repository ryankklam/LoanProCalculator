import { LoanParams, Holiday, RateRange, Installment, Summary, RepaymentEvent } from '../types';
import { addMonths, addDays, differenceInDays, isSameDay, isAfter, format, endOfDay, isWithinInterval } from 'date-fns';
import { dictionary, Language } from '../translations';

// Local implementations for functions missing in the installed date-fns version
const parseISO = (dateStr: string): Date => {
  // Simple parser for YYYY-MM-DD to ensure local time
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to check if a date is a holiday (within any holiday range)
const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
  return holidays.some(h => {
    const start = startOfDay(parseISO(h.startDate));
    const end = endOfDay(parseISO(h.endDate));
    return isWithinInterval(date, { start, end });
  });
};

// Helper to get next business day (Following Convention)
const getNextBusinessDay = (date: Date, holidays: Holiday[]): Date => {
  let current = date;
  while (isHoliday(current, holidays)) {
    current = addDays(current, 1);
  }
  return current;
};

// Helper to get previous business day (Preceding Convention)
const getPreviousBusinessDay = (date: Date, holidays: Holiday[]): Date => {
  let current = date;
  while (isHoliday(current, holidays)) {
    current = addDays(current, -1);
  }
  return current;
};

// Helper to get rate for a specific day based on ranges
const getRateForDay = (date: Date, initialRate: number, rateRanges: RateRange[]): number => {
  // Find a range that covers the current date
  const activeRange = rateRanges.find(r => {
    const start = startOfDay(parseISO(r.startDate));
    const end = endOfDay(parseISO(r.endDate));
    return isWithinInterval(date, { start, end });
  });

  return activeRange ? activeRange.rate : initialRate;
};

// Helper to calculate PMT (Annuity Payment)
const calculatePMT = (principal: number, annualRate: number, months: number): number => {
  if (annualRate === 0) return principal / months;
  if (principal <= 0) return 0;
  // Monthly rate
  const r = annualRate / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

export const calculateSchedule = (
  params: LoanParams,
  holidays: Holiday[],
  rateRanges: RateRange[],
  repayments: RepaymentEvent[],
  language: Language = 'en'
): { schedule: Installment[]; summary: Summary } => {
  const { amount, initialRate, tenureMonths, startDate, holidayShiftMode, adjustmentStrategy } = params;
  const t = dictionary[language];
  const dateLocale = language === 'cn' ? 'yyyy-MM-dd' : 'MMM d';
  
  const schedule: Installment[] = [];
  const startObj = parseISO(startDate);
  
  let currentBalance = amount;
  let previousDate = startObj;
  
  let totalInterest = 0;

  // Initialize PMT state
  let currentRateForPMT = getRateForDay(startObj, initialRate, rateRanges);
  let currentPMT = calculatePMT(amount, currentRateForPMT, tenureMonths);
  
  let fixedInstallmentTarget = currentPMT;

  // Safety Cap for CHANGE_TENURE
  const MAX_ITERATIONS = 600; 

  let i = 1;
  
  while (currentBalance > 0.005 && i <= MAX_ITERATIONS) {
    const nominalDate = addMonths(startObj, i);
    let actualDate: Date;

    // Apply Holiday Shifting Logic
    if (holidayShiftMode === 'BEFORE') {
      actualDate = getPreviousBusinessDay(nominalDate, holidays);
    } else {
      actualDate = getNextBusinessDay(nominalDate, holidays);
    }
    
    if (!isAfter(actualDate, previousDate)) {
        actualDate = addDays(previousDate, 1);
    }

    const daysCount = differenceInDays(actualDate, previousDate);
    const notes: string[] = [];

    if (!isSameDay(nominalDate, actualDate)) {
      const shiftDir = isAfter(actualDate, nominalDate) ? t.noteDeferred : t.notePreponed;
      const formattedNominal = format(nominalDate, dateLocale);
      notes.push(`${shiftDir} ${t.noteFrom} ${formattedNominal} (${t.noteHoliday})`);
    }

    // --- Rate Change Check ---
    const rateAtPeriodStart = getRateForDay(previousDate, initialRate, rateRanges);
    
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

    // --- Daily Interest & Repayment Loop ---
    let interestForPeriod = 0;
    let accumulatedBalanceForRate = 0;
    let segmentInterest = 0;
    let lastEventDate = previousDate;

    for (let d = 1; d <= daysCount; d++) {
        const calculationDay = addDays(previousDate, d);
        const dailyRatePercent = getRateForDay(calculationDay, initialRate, rateRanges);
        
        const dailyInterest = currentBalance * (dailyRatePercent / 100) / 365;
        interestForPeriod += dailyInterest;
        segmentInterest += dailyInterest;
        accumulatedBalanceForRate += currentBalance;

        // Check for Extra Repayment
        const dailyRepayments = repayments.filter(r => isSameDay(parseISO(r.date), calculationDay));
        
        if (dailyRepayments.length > 0) {
            for(const r of dailyRepayments) {
                // 1. Segment before repayment
                const segmentDays = differenceInDays(calculationDay, lastEventDate);
                if (segmentDays > 0) {
                    schedule.push({
                        type: 'SEGMENT',
                        period: i,
                        nominalDate: format(calculationDay, 'yyyy-MM-dd'),
                        actualDate: format(calculationDay, 'yyyy-MM-dd'),
                        segmentStartDate: format(lastEventDate, 'yyyy-MM-dd'),
                        segmentEndDate: format(calculationDay, 'yyyy-MM-dd'),
                        daysCount: segmentDays, 
                        principal: 0,
                        interest: segmentInterest, 
                        total: 0,
                        outstandingBalance: currentBalance, 
                        effectiveRate: 0,
                        notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
                    });
                }
                
                // 2. Apply Repayment
                currentBalance -= r.amount;
                if(currentBalance < 0) currentBalance = 0;

                // 3. Log Repayment Row
                schedule.push({
                  type: 'REPAYMENT',
                  period: i,
                  nominalDate: format(calculationDay, 'yyyy-MM-dd'),
                  actualDate: format(calculationDay, 'yyyy-MM-dd'),
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

                // 4. Recalculate PMT based on Strategy
                currentRateForPMT = dailyRatePercent; 
                
                if (adjustmentStrategy === 'CHANGE_INSTALLMENT') {
                    const remainingMonths = Math.max(1, tenureMonths - (i - 1));
                    currentPMT = calculatePMT(currentBalance, currentRateForPMT, remainingMonths);
                }
            }
        }
    }

    // Final Segment
    const finalSegmentDays = differenceInDays(actualDate, lastEventDate);
    if (finalSegmentDays > 0) {
         schedule.push({
            type: 'SEGMENT',
            period: i,
            nominalDate: format(actualDate, 'yyyy-MM-dd'),
            actualDate: format(actualDate, 'yyyy-MM-dd'),
            segmentStartDate: format(lastEventDate, 'yyyy-MM-dd'),
            segmentEndDate: format(actualDate, 'yyyy-MM-dd'),
            daysCount: finalSegmentDays, 
            principal: 0,
            interest: segmentInterest, 
            total: 0,
            outstandingBalance: currentBalance,
            effectiveRate: 0,
            notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
        });
    }

    // Effective Rate
    let effectiveRate = 0;
    if (accumulatedBalanceForRate > 0) {
        effectiveRate = (interestForPeriod / accumulatedBalanceForRate) * 365 * 100;
    }

    // --- Calculate Installment Split ---
    
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

    // Check if we extended tenure
    if (adjustmentStrategy === 'CHANGE_TENURE' && i > tenureMonths) {
        notes.push(t.noteTenureExtended);
    } else if (adjustmentStrategy === 'CHANGE_TENURE' && canPayOff && i < tenureMonths) {
        notes.push(t.notePaidOffEarly);
    }

    schedule.push({
      type: 'INSTALLMENT',
      period: i,
      nominalDate: format(nominalDate, 'yyyy-MM-dd'),
      actualDate: format(actualDate, 'yyyy-MM-dd'),
      daysCount,
      principal: principalPayment,
      interest: interestForPeriod,
      total: totalPayment,
      outstandingBalance: currentBalance,
      effectiveRate: effectiveRate,
      notes
    });

    previousDate = actualDate;
    
    // Stop if balance is zero
    if (currentBalance <= 0) break;
    
    i++;
  }

  const summary: Summary = {
    totalPrincipal: amount,
    totalInterest,
    totalPaid: amount + totalInterest,
    lastPaymentDate: schedule.find(s => s.outstandingBalance <= 0.01 && s.type === 'INSTALLMENT')?.actualDate || schedule[schedule.length - 1]?.actualDate
  };

  return { schedule, summary };
};