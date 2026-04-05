import { describe, it, expect } from 'vitest';
import { calculateSchedule } from '../../services/loanCalculator';
import { LoanParams, Holiday, RateRange, RepaymentEvent } from '../../types';

const BASE_PARAMS: LoanParams = {
  amount: 100000,
  initialRate: 5.0,
  tenureMonths: 12,
  startDate: '2026-04-01',
  dayCountConvention: 365,
  holidayShiftMode: 'AFTER',
  adjustmentStrategy: 'CHANGE_INSTALLMENT',
  repaymentScheme: 'IRREGULAR_REPAYMENT_14',
  interestPaymentFrequency: 'MONTHLY',
  interestPaymentDay: 10
};

const EMPTY_RATE_RANGES: RateRange[] = [];
const EMPTY_HOLIDAYS: Holiday[] = [];

const PRINCIPAL_REPAYMENTS: RepaymentEvent[] = [
  {
    id: '1',
    date: '2026-05-18',
    amount: 30000
  },
  {
    id: '2',
    date: '2026-08-07',
    amount: 20000
  }
];

const getInstallmentByActualDate = (schedule: any[], actualDate: string) =>
  schedule.find(row => row.type === 'INSTALLMENT' && row.actualDate === actualDate);

const getRepaymentByActualDate = (schedule: any[], actualDate: string) =>
  schedule.find(row => row.type === 'INSTALLMENT' && row.actualDate === actualDate && row.principal > 0);

describe('不规则还款14测试 - 两次本金还款', () => {
  describe('1. 利随本清功能验证', () => {
    it('两次本金还款时，仅归还对应本金的利息', () => {
      const { schedule, summary } = calculateSchedule(
        BASE_PARAMS, 
        EMPTY_HOLIDAYS, 
        EMPTY_RATE_RANGES, 
        PRINCIPAL_REPAYMENTS, 
        'en'
      );
      
      // 验证2026-04-10（第一个利息还款日）
      const apr10 = getInstallmentByActualDate(schedule, '2026-04-10');
      expect(apr10).toBeDefined();
      expect(apr10!.principal).toBe(0);
      expect(apr10!.interest).toBeCloseTo(123.29, 2);
      expect(apr10!.total).toBeCloseTo(123.29, 2);
      expect(apr10!.outstandingBalance).toBe(100000);

      // 验证2026-05-10（第二个利息还款日）
      const may10 = getInstallmentByActualDate(schedule, '2026-05-10');
      expect(may10).toBeDefined();
      expect(may10!.principal).toBe(0);
      expect(may10!.interest).toBeCloseTo(410.96, 2);
      expect(may10!.total).toBeCloseTo(410.96, 2);
      expect(may10!.outstandingBalance).toBe(100000);

      // 验证2026-05-18（第一次本金还款日 - 利随本清）
      const may18 = getRepaymentByActualDate(schedule, '2026-05-18');
      expect(may18).toBeDefined();
      expect(may18!.principal).toBe(30000);
      // 计算：30000 * 5% / 365 * 8天 = 32.88
      expect(may18!.interest).toBeCloseTo(32.88, 2);
      expect(may18!.total).toBeCloseTo(30032.88, 2);
      expect(may18!.outstandingBalance).toBe(70000);

      // 验证2026-06-10（第三个利息还款日）
      const jun10 = getInstallmentByActualDate(schedule, '2026-06-10');
      expect(jun10).toBeDefined();
      expect(jun10!.principal).toBe(0);
      // 计算：70000 * 5% / 365 * 31天 = 297.26
      expect(jun10!.interest).toBeCloseTo(297.26, 2);
      expect(jun10!.total).toBeCloseTo(297.26, 2);
      expect(jun10!.outstandingBalance).toBe(70000);

      // 验证2026-07-10（第四个利息还款日）
      const jul10 = getInstallmentByActualDate(schedule, '2026-07-10');
      expect(jul10).toBeDefined();
      expect(jul10!.principal).toBe(0);
      // 计算：70000 * 5% / 365 * 30天 = 287.67
      expect(jul10!.interest).toBeCloseTo(287.67, 2);
      expect(jul10!.total).toBeCloseTo(287.67, 2);
      expect(jul10!.outstandingBalance).toBe(70000);

      // 验证2026-08-07（第二次本金还款日 - 利随本清）
      const aug07 = getRepaymentByActualDate(schedule, '2026-08-07');
      expect(aug07).toBeDefined();
      expect(aug07!.principal).toBe(20000);
      // 计算：20000 * 5% / 365 * 28天 = 76.71
      expect(aug07!.interest).toBeCloseTo(76.71, 2);
      expect(aug07!.total).toBeCloseTo(20076.71, 2);
      expect(aug07!.outstandingBalance).toBe(50000);

      // 验证2026-08-10（第五个利息还款日）
      const aug10 = getInstallmentByActualDate(schedule, '2026-08-10');
      expect(aug10).toBeDefined();
      expect(aug10!.principal).toBe(0);
      // 计算：50000 * 5% / 365 * 31天 = 212.33
      expect(aug10!.interest).toBeCloseTo(212.33, 2);
      expect(aug10!.total).toBeCloseTo(212.33, 2);
      expect(aug10!.outstandingBalance).toBe(50000);

      // 验证贷款到期日（2027-04-01）
      const apr01_2027 = getInstallmentByActualDate(schedule, '2027-04-01');
      expect(apr01_2027).toBeDefined();
      expect(apr01_2027!.principal).toBe(50000);
      expect(apr01_2027!.interest).toBeGreaterThan(0);
      expect(apr01_2027!.total).toBeGreaterThan(50000);
      expect(apr01_2027!.outstandingBalance).toBeCloseTo(0, 2);

      // 验证摘要信息
      expect(summary.totalInterest).toBeGreaterThan(0);
      expect(summary.totalPaid).toBeCloseTo(100000 + summary.totalInterest, 2);
      expect(summary.lastPaymentDate).toBe('2027-04-01');
      expect(summary.loanEndDate).toBe('2027-04-01');
    });
  });

  describe('2. 利息计算准确性', () => {
    it('利息计算基于剩余本金和实际天数', () => {
      const { schedule } = calculateSchedule(
        BASE_PARAMS, 
        EMPTY_HOLIDAYS, 
        EMPTY_RATE_RANGES, 
        PRINCIPAL_REPAYMENTS, 
        'en'
      );
      
      // 验证2026-09-10（第六个利息还款日）
      const sep10 = getInstallmentByActualDate(schedule, '2026-09-10');
      expect(sep10).toBeDefined();
      expect(sep10!.principal).toBe(0);
      // 计算：50000 * 5% / 365 * 31天 = 212.33
      expect(sep10!.interest).toBeCloseTo(212.33, 2);
      expect(sep10!.outstandingBalance).toBe(50000);

      // 验证2026-10-10（第七个利息还款日）
      const oct10 = getInstallmentByActualDate(schedule, '2026-10-10');
      expect(oct10).toBeDefined();
      expect(oct10!.principal).toBe(0);
      // 计算：50000 * 5% / 365 * 30天 = 205.48
      expect(oct10!.interest).toBeCloseTo(205.48, 2);
      expect(oct10!.outstandingBalance).toBe(50000);
    });
  });
});
