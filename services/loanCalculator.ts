import { LoanParams, Holiday, RateRange, Installment, Summary, RepaymentEvent } from '../types';
import { addMonths, addDays, differenceInDays, isSameDay, isAfter, format, endOfDay, isWithinInterval } from 'date-fns';

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

// Helper to get next business day
const getNextBusinessDay = (date: Date, holidays: Holiday[]): Date => {
  let current = date;
  while (isHoliday(current, holidays)) {
    current = addDays(current, 1);
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
  repayments: RepaymentEvent[]
): { schedule: Installment[]; summary: Summary } => {
  const { amount, initialRate, tenureMonths, startDate } = params;
  
  const schedule: Installment[] = [];
  const startObj = parseISO(startDate);
  
  let currentBalance = amount;
  let previousDate = startObj;
  
  let totalInterest = 0;

  // Initialize PMT state
  let currentRateForPMT = getRateForDay(startObj, initialRate, rateRanges);
  let currentPMT = calculatePMT(amount, currentRateForPMT, tenureMonths);

  for (let i = 1; i <= tenureMonths; i++) {
    const nominalDate = addMonths(startObj, i);
    let actualDate = getNextBusinessDay(nominalDate, holidays);
    
    // Ensure actual date didn't stay on same day (though addMonths usually changes it)
    // and is after previous date
    if (!isAfter(actualDate, previousDate)) {
        actualDate = addDays(previousDate, 1);
    }

    const daysCount = differenceInDays(actualDate, previousDate);
    const notes: string[] = [];

    if (!isSameDay(nominalDate, actualDate)) {
      notes.push(`Deferred from ${format(nominalDate, 'MMM d')} (Holiday)`);
    }

    // Check for Rate Change to update PMT (Annuity Recalculation)
    const rateAtPeriodStart = getRateForDay(previousDate, initialRate, rateRanges);
    
    // If rate changed significantly at the start of period, recalculate PMT
    if (Math.abs(rateAtPeriodStart - currentRateForPMT) > 0.001) {
        currentRateForPMT = rateAtPeriodStart;
        const remainingMonths = tenureMonths - (i - 1);
        currentPMT = calculatePMT(currentBalance, currentRateForPMT, remainingMonths);
        notes.push(`Rate changed to ${currentRateForPMT}% - PMT updated`);
    }

    // Calculate Interest Day by Day and Check for Repayments
    let interestForPeriod = 0;
    let accumulatedBalanceForRate = 0;
    
    // Segment tracking for breakdown within the period
    let segmentInterest = 0;
    let lastEventDate = previousDate;

    // Iterate from day after previous payment to current payment day
    for (let d = 1; d <= daysCount; d++) {
        const calculationDay = addDays(previousDate, d);
        const dailyRatePercent = getRateForDay(calculationDay, initialRate, rateRanges);
        
        // Calculate Interest for this day FIRST (based on balance at start of day)
        // Standard logic: Interest accrued on the outstanding balance of that day.
        const dailyInterest = currentBalance * (dailyRatePercent / 100) / 365;
        interestForPeriod += dailyInterest;
        segmentInterest += dailyInterest;
        accumulatedBalanceForRate += currentBalance;

        // Check for Extra Repayment on this day
        // We find if any repayment falls exactly on this day
        const dailyRepayments = repayments.filter(r => isSameDay(parseISO(r.date), calculationDay));
        
        if (dailyRepayments.length > 0) {
            for(const r of dailyRepayments) {
                // 1. Close current SEGMENT (Before Repayment)
                // This segment covers time from lastEventDate up to calculationDay (inclusive of calculation logic so far)
                const segmentDays = differenceInDays(calculationDay, lastEventDate);
                
                // Only push segment if days > 0
                if (segmentDays > 0) {
                    schedule.push({
                        type: 'SEGMENT',
                        period: i,
                        nominalDate: format(calculationDay, 'yyyy-MM-dd'),
                        actualDate: format(calculationDay, 'yyyy-MM-dd'),
                        segmentStartDate: format(lastEventDate, 'yyyy-MM-dd'),
                        segmentEndDate: format(calculationDay, 'yyyy-MM-dd'),
                        daysCount: segmentDays, 
                        principal: 0, // No principal paid
                        interest: segmentInterest, 
                        total: 0,
                        outstandingBalance: currentBalance, // The balance used for this calc
                        effectiveRate: 0,
                        notes: [`Basis: $${currentBalance.toFixed(2)}`]
                    });
                }
                
                // 2. Apply Repayment
                currentBalance -= r.amount;
                if(currentBalance < 0) currentBalance = 0;

                // 3. Push REPAYMENT Row
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
                  notes: [`Extra Repayment`]
                });
                
                // Update State for next segment
                lastEventDate = calculationDay;
                segmentInterest = 0; // Reset segment interest

                // Recalculate PMT because Principal dropped
                const remainingMonths = tenureMonths - (i - 1);
                currentRateForPMT = dailyRatePercent; 
                currentPMT = calculatePMT(currentBalance, currentRateForPMT, remainingMonths);
            }
        }
    }

    // Push the FINAL SEGMENT for the period (from last event to period actual end)
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
            notes: [`Basis: $${currentBalance.toFixed(2)}`]
        });
    }

    // Calculate Effective Composite Rate for the period
    let effectiveRate = 0;
    if (accumulatedBalanceForRate > 0) {
        effectiveRate = (interestForPeriod / accumulatedBalanceForRate) * 365 * 100;
    }

    let principalPayment = 0;
    let totalPayment = currentPMT;

    // Last Installment Logic
    if (i === tenureMonths) {
      principalPayment = currentBalance;
      totalPayment = principalPayment + interestForPeriod;
    } else {
      // Standard Installment
      principalPayment = totalPayment - interestForPeriod;
    }

    // Update Accumulators
    currentBalance -= principalPayment;
    
    // Fix JS floating point issues
    if (currentBalance < 0.01) currentBalance = 0;
    
    totalInterest += interestForPeriod;

    schedule.push({
      type: 'INSTALLMENT',
      period: i,
      nominalDate: format(nominalDate, 'yyyy-MM-dd'),
      actualDate: format(actualDate, 'yyyy-MM-dd'),
      daysCount, // Total days in period
      principal: principalPayment,
      interest: interestForPeriod, // Total interest in period (sum of segments)
      total: totalPayment,
      outstandingBalance: currentBalance,
      effectiveRate: effectiveRate,
      notes
    });

    previousDate = actualDate;
  }

  const summary: Summary = {
    totalPrincipal: amount,
    totalInterest,
    totalPaid: amount + totalInterest,
    lastPaymentDate: schedule.find(s => s.outstandingBalance === 0)?.actualDate || schedule[schedule.length - 1]?.actualDate
  };

  return { schedule, summary };
};