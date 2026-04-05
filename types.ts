export type DayCountConvention = 360 | 365;
export type RepaymentScheme = 'EQUAL_INSTALLMENT' | 'IRREGULAR_REPAYMENT_5' | 'IRREGULAR_REPAYMENT_14';
export type InterestPaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'BIWEEKLY';

export interface LoanParams {
  amount: number;
  initialRate: number; // Percentage (e.g., 5.5)
  tenureMonths: number;
  startDate: string; // ISO Date string YYYY-MM-DD
  dayCountConvention: DayCountConvention;
  holidayShiftMode: 'BEFORE' | 'AFTER'; // 'BEFORE' = Preceding, 'AFTER' = Following
  adjustmentStrategy: 'CHANGE_INSTALLMENT' | 'CHANGE_TENURE'; // 'CHANGE_INSTALLMENT' = 变额不变期, 'CHANGE_TENURE' = 变期不变额
  repaymentScheme: RepaymentScheme; // 还款方案
  interestPaymentFrequency: InterestPaymentFrequency; // 利息还款频率（仅适用于不规则还款5）
  interestPaymentDay: number; // 利息还款日期（1-31）
}

export interface Holiday {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  name: string;
}

export interface RateRange {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD, Optional. If missing, defaults to day before next interval or loan end.
  rate: number;      // Percentage
}

export interface RepaymentEvent {
  id: string;
  date: string;      // YYYY-MM-DD
  amount: number;
}

export type RowType = 'INSTALLMENT' | 'REPAYMENT' | 'SEGMENT';

export interface Installment {
  type: RowType;
  period: number;
  nominalDate: string; // Original due date
  actualDate: string; // Adjusted for holidays
  
  // For Segments
  segmentStartDate?: string;
  segmentEndDate?: string;
  
  daysCount: number; // Days since last payment or in this segment
  principal: number; // Principal Paid (for Installment/Repayment) OR Principal Basis (for Segment)? Let's keep it strictly Paid for consistency in math.
  interest: number;
  total: number;
  outstandingBalance: number; // For Segment, this is the balance during the segment. For others, it's ending balance.
  effectiveRate: number; // Calculated annualized rate for this period
  notes: string[];
}

export interface Summary {
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  lastPaymentDate: string;
  loanEndDate: string;
}