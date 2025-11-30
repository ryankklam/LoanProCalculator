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
  // Sort ranges by start date to process chronologically
  const sortedRanges = [...rateRanges].sort((a, b) => a.startDate.localeCompare(b.startDate));
  
  // Find valid candidates
  const candidates = sortedRanges.map((range, index) => {
      // Determine effective End Date
      let effectiveEndDate: Date | null = null;
      
      if (range.endDate) {
          effectiveEndDate = endOfDay(parseISO(range.endDate));
      } else {
          // If no explicit end date, it ends the day before the NEXT range starts.
          // Note: The next range acts as a cutoff regardless of whether it has an end date or not.
          if (index < sortedRanges.length - 1) {
              const nextRangeStart = parseISO(sortedRanges[index + 1].startDate);
              // effectiveEndDate is day before next start
              effectiveEndDate = endOfDay(addDays(nextRangeStart, -1));
          } else {
              // Last range with no end date -> goes on forever
              effectiveEndDate = null; 
          }
      }

      return {
          ...range,
          effectiveEndDate
      };
  });

  // Find the candidate that actually covers the requested date
  // Since we processed chronologically and defined effectiveEndDate based on the next one, 
  // they shouldn't overlap in a way that causes ambiguity for "implicit" ranges.
  
  // We prioritize the range with the latest start date that covers the target date.
  const matchingRanges = candidates.filter(r => {
      const start = startOfDay(parseISO(r.startDate));
      
      // Check start condition
      if (isAfter(start, date) && !isSameDay(start, date)) return false;

      // Check end condition
      if (r.effectiveEndDate) {
          if (isAfter(date, r.effectiveEndDate) && !isSameDay(date, r.effectiveEndDate)) return false;
      }
      
      return true;
  });

  if (matchingRanges.length > 0) {
      // Return the one with the latest start date
      return matchingRanges[matchingRanges.length - 1].rate;
  }

  return initialRate;
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

    // --- Rate Change Check for PMT Recalculation (Start of Period) ---
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
    
    // Segment Tracking
    let segmentInterest = 0;
    let lastEventDate = previousDate;
    let segmentDaysCounter = 0; // Explicit counter to avoid date math confusion on boundaries
    // We track the rate used for the current accumulating segment
    let activeSegmentRate = getRateForDay(addDays(previousDate, 1), initialRate, rateRanges);

    for (let d = 1; d <= daysCount; d++) {
        const calculationDay = addDays(previousDate, d);
        const dailyRatePercent = getRateForDay(calculationDay, initialRate, rateRanges);
        
        // 1. Check for Rate Change compared to active segment
        if (Math.abs(dailyRatePercent - activeSegmentRate) > 0.0001) {
             // Close the previous segment
             if (segmentDaysCounter > 0) {
                 schedule.push({
                    type: 'SEGMENT',
                    period: i,
                    nominalDate: format(calculationDay, 'yyyy-MM-dd'),
                    actualDate: format(calculationDay, 'yyyy-MM-dd'),
                    // Visual Start: Last Event Date. Visual End: Rate Change Date (Today).
                    segmentStartDate: format(lastEventDate, 'yyyy-MM-dd'),
                    segmentEndDate: format(calculationDay, 'yyyy-MM-dd'),
                    daysCount: segmentDaysCounter,
                    principal: 0,
                    interest: segmentInterest,
                    total: 0,
                    outstandingBalance: currentBalance,
                    effectiveRate: activeSegmentRate,
                    notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
                });
             }
             
             // Reset for new segment
             lastEventDate = calculationDay;
             segmentInterest = 0;
             segmentDaysCounter = 0;
             activeSegmentRate = dailyRatePercent;
        }

        const dailyInterest = currentBalance * (dailyRatePercent / 100) / 365;
        interestForPeriod += dailyInterest;
        segmentInterest += dailyInterest;
        accumulatedBalanceForRate += currentBalance;
        segmentDaysCounter++;

        // 2. Check for Extra Repayment
        const dailyRepayments = repayments.filter(r => isSameDay(parseISO(r.date), calculationDay));
        
        if (dailyRepayments.length > 0) {
            for(const r of dailyRepayments) {
                // Segment before repayment (ending ON calculationDay)
                if (segmentDaysCounter > 0) {
                    schedule.push({
                        type: 'SEGMENT',
                        period: i,
                        nominalDate: format(calculationDay, 'yyyy-MM-dd'),
                        actualDate: format(calculationDay, 'yyyy-MM-dd'),
                        segmentStartDate: format(lastEventDate, 'yyyy-MM-dd'),
                        segmentEndDate: format(calculationDay, 'yyyy-MM-dd'),
                        daysCount: segmentDaysCounter, 
                        principal: 0,
                        interest: segmentInterest, 
                        total: 0,
                        outstandingBalance: currentBalance, 
                        effectiveRate: activeSegmentRate,
                        notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
                    });
                }
                
                // Apply Repayment
                currentBalance -= r.amount;
                if(currentBalance < 0) currentBalance = 0;

                // Log Repayment Row
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
                segmentDaysCounter = 0;
                // activeSegmentRate stays the same (dailyRatePercent) for this day, 
                // but next loop iteration might change it if tomorrow's rate is different.

                // Recalculate PMT based on Strategy
                currentRateForPMT = dailyRatePercent; 
                
                if (adjustmentStrategy === 'CHANGE_INSTALLMENT') {
                    const remainingMonths = Math.max(1, tenureMonths - (i - 1));
                    currentPMT = calculatePMT(currentBalance, currentRateForPMT, remainingMonths);
                }
            }
        }
    }

    // Final Segment of the period
    if (segmentDaysCounter > 0) {
         schedule.push({
            type: 'SEGMENT',
            period: i,
            nominalDate: format(actualDate, 'yyyy-MM-dd'),
            actualDate: format(actualDate, 'yyyy-MM-dd'),
            segmentStartDate: format(lastEventDate, 'yyyy-MM-dd'),
            segmentEndDate: format(actualDate, 'yyyy-MM-dd'),
            daysCount: segmentDaysCounter, 
            principal: 0,
            interest: segmentInterest, 
            total: 0,
            outstandingBalance: currentBalance,
            effectiveRate: activeSegmentRate,
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