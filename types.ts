export interface LoanParams {
  amount: number;
  initialRate: number; // Percentage (e.g., 5.5)
  tenureMonths: number;
  startDate: string; // ISO Date string YYYY-MM-DD
  holidayShiftMode: 'BEFORE' | 'AFTER'; // 'BEFORE' = Preceding, 'AFTER' = Following
  adjustmentStrategy: 'CHANGE_INSTALLMENT' | 'CHANGE_TENURE'; // 'CHANGE_INSTALLMENT' = 变额不变期, 'CHANGE_TENURE' = 变期不变额
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
  endDate: string;   // YYYY-MM-DD
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
}