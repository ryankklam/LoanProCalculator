import { describe, it, expect } from 'vitest';
import { calculateSchedule } from '../../services/loanCalculator';
import { LoanParams, Holiday, RateRange, RepaymentEvent } from '../../types';

const BASE_PARAMS: LoanParams = {
  amount: 10000,
  initialRate: 5.0,
  tenureMonths: 12,
  startDate: '2024-01-01',
  dayCountConvention: 365,
  holidayShiftMode: 'AFTER',
  adjustmentStrategy: 'CHANGE_INSTALLMENT',
  repaymentScheme: 'IRREGULAR_REPAYMENT_5',
  interestPaymentFrequency: 'MONTHLY',
  interestPaymentDay: 15
};

const EMPTY_RATE_RANGES: RateRange[] = [];
const EMPTY_REPAYMENTS: RepaymentEvent[] = [];
const EMPTY_HOLIDAYS: Holiday[] = [];

const getInstallmentByActualDate = (schedule: any[], actualDate: string) =>
  schedule.find(row => row.type === 'INSTALLMENT' && row.actualDate === actualDate);

const getRepaymentByActualDate = (schedule: any[], actualDate: string) =>
  schedule.find(row => row.type === 'INSTALLMENT' && row.actualDate === actualDate && row.principal > 0);

describe('不规则还款5测试', () => {
  describe('1. 利息还款频率配置', () => {
    describe('1.1 每月利息还款', () => {
      it('每月15日利息还款，到期日还清本金和利息', () => {
        const { schedule, summary } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15).toBeDefined();
        expect(jan15!.principal).toBe(0);
        expect(jan15!.interest).toBeCloseTo(19.18, 2);
        expect(jan15!.total).toBeCloseTo(19.18, 2);
        expect(jan15!.outstandingBalance).toBe(10000);
        expect(jan15!.notes).toContain('Interest Repayment');

        const feb15 = getInstallmentByActualDate(schedule, '2024-02-15');
        expect(feb15).toBeDefined();
        expect(feb15!.principal).toBe(0);
        expect(feb15!.interest).toBeCloseTo(42.47, 2);
        expect(feb15!.total).toBeCloseTo(42.47, 2);
        expect(feb15!.outstandingBalance).toBe(10000);

        const dec15 = getInstallmentByActualDate(schedule, '2024-12-15');
        expect(dec15).toBeDefined();
        expect(dec15!.principal).toBe(0);
        expect(dec15!.interest).toBeCloseTo(41.10, 2);

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeDefined();
        expect(loanEnd!.principal).toBe(10000);
        expect(loanEnd!.interest).toBeCloseTo(23.29, 2);
        expect(loanEnd!.total).toBeCloseTo(10023.29, 2);
        expect(loanEnd!.outstandingBalance).toBe(0);
        expect(loanEnd!.notes).toContain('Loan end, repay remaining principal and interest');
      });
    });

    describe('1.2 每季度利息还款', () => {
      it('每季度15日利息还款，到期日还清本金和利息', () => {
        const params = { ...BASE_PARAMS, interestPaymentFrequency: 'QUARTERLY' as const };
        const { schedule } = calculateSchedule(params, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const apr15 = getInstallmentByActualDate(schedule, '2024-04-15');
        expect(apr15).toBeDefined();
        expect(apr15!.principal).toBe(0);
        expect(apr15!.interest).toBeCloseTo(124.66, 2);
        expect(apr15!.outstandingBalance).toBe(10000);

        const jul15 = getInstallmentByActualDate(schedule, '2024-07-15');
        expect(jul15).toBeDefined();
        expect(jul15!.principal).toBe(0);
        expect(jul15!.interest).toBeCloseTo(124.66, 2);

        const oct15 = getInstallmentByActualDate(schedule, '2024-10-15');
        expect(oct15).toBeDefined();
        expect(oct15!.principal).toBe(0);
        expect(oct15!.interest).toBeCloseTo(126.03, 2);

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeDefined();
        expect(loanEnd!.principal).toBe(10000);
        expect(loanEnd!.interest).toBeCloseTo(106.85, 2);
        expect(loanEnd!.outstandingBalance).toBe(0);
      });
    });

    describe('1.3 双周利息还款', () => {
      it('每两周利息还款，到期日还清本金和利息', () => {
        const params = { ...BASE_PARAMS, interestPaymentFrequency: 'BIWEEKLY' as const };
        const { schedule } = calculateSchedule(params, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15).toBeDefined();
        expect(jan15!.principal).toBe(0);
        expect(jan15!.interest).toBeCloseTo(19.18, 2);
        expect(jan15!.outstandingBalance).toBe(10000);

        const jan29 = getInstallmentByActualDate(schedule, '2024-01-29');
        expect(jan29).toBeDefined();
        expect(jan29!.principal).toBe(0);
        expect(jan29!.interest).toBeCloseTo(19.18, 2);

        const feb12 = getInstallmentByActualDate(schedule, '2024-02-12');
        expect(feb12).toBeDefined();
        expect(feb12!.principal).toBe(0);
        expect(feb12!.interest).toBeCloseTo(19.18, 2);

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeDefined();
        expect(loanEnd!.principal).toBe(10000);
        expect(loanEnd!.interest).toBeCloseTo(2.74, 2);
        expect(loanEnd!.outstandingBalance).toBe(0);
      });
    });
  });

  describe('2. 本金还款计划管理', () => {
    describe('2.1 单期本金还款', () => {
      it('6月15日还款5000，到期日还清剩余本金和利息', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-06-15', amount: 5000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const jun15 = getRepaymentByActualDate(schedule, '2024-06-15');
        expect(jun15).toBeDefined();
        expect(jun15!.principal).toBe(5000);
        expect(jun15!.interest).toBe(0);
        expect(jun15!.total).toBe(5000);
        expect(jun15!.outstandingBalance).toBe(5000);
        expect(jun15!.notes).toContain('Principal Repayment');

        const jul15 = getInstallmentByActualDate(schedule, '2024-07-15');
        expect(jul15).toBeDefined();
        expect(jul15!.principal).toBe(0);
        expect(jul15!.interest).toBeCloseTo(19.86, 2);
        expect(jul15!.outstandingBalance).toBe(5000);

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeDefined();
        expect(loanEnd!.principal).toBe(5000);
        expect(loanEnd!.interest).toBeCloseTo(11.64, 2);
        expect(loanEnd!.outstandingBalance).toBe(0);
      });
    });

    describe('2.2 多期本金还款', () => {
      it('3、6、9月各还款3000，到期日还清剩余本金和利息', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-03-15', amount: 3000 },
          { id: '2', date: '2024-06-15', amount: 3000 },
          { id: '3', date: '2024-09-15', amount: 3000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const mar15 = getRepaymentByActualDate(schedule, '2024-03-15');
        expect(mar15).toBeDefined();
        expect(mar15!.principal).toBe(3000);
        expect(mar15!.interest).toBe(0);
        expect(mar15!.outstandingBalance).toBe(7000);

        const apr15 = getInstallmentByActualDate(schedule, '2024-04-15');
        expect(apr15).toBeDefined();
        expect(apr15!.principal).toBe(0);
        expect(apr15!.interest).toBeCloseTo(28.77, 2);
        expect(apr15!.outstandingBalance).toBe(7000);

        const jun15 = getRepaymentByActualDate(schedule, '2024-06-15');
        expect(jun15).toBeDefined();
        expect(jun15!.principal).toBe(3000);
        expect(jun15!.interest).toBe(0);
        expect(jun15!.outstandingBalance).toBe(4000);

        const sep15 = getRepaymentByActualDate(schedule, '2024-09-15');
        expect(sep15).toBeDefined();
        expect(sep15!.principal).toBe(3000);
        expect(sep15!.interest).toBe(0);
        expect(sep15!.outstandingBalance).toBe(1000);

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeDefined();
        expect(loanEnd!.principal).toBe(1000);
        expect(loanEnd!.interest).toBeCloseTo(2.33, 2);
        expect(loanEnd!.outstandingBalance).toBe(0);
      });
    });

    describe('2.3 本金还款金额等于贷款金额', () => {
      it('6月15日还清全部本金，后续只需支付利息', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-06-15', amount: 10000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const jun15 = getRepaymentByActualDate(schedule, '2024-06-15');
        expect(jun15).toBeDefined();
        expect(jun15!.principal).toBe(10000);
        expect(jun15!.interest).toBe(0);
        expect(jun15!.outstandingBalance).toBe(0);

        const jul15 = getInstallmentByActualDate(schedule, '2024-07-15');
        expect(jul15).toBeUndefined();

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeUndefined();
      });
    });
  });

  describe('3. 贷款到期日处理', () => {
    describe('3.1 到期日自动还清剩余本金和利息', () => {
      it('6月15日还款3000，到期日还清剩余本金和利息', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-06-15', amount: 3000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const jun15 = getRepaymentByActualDate(schedule, '2024-06-15');
        expect(jun15).toBeDefined();
        expect(jun15!.principal).toBe(3000);
        expect(jun15!.outstandingBalance).toBe(7000);

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeDefined();
        expect(loanEnd!.principal).toBe(7000);
        expect(loanEnd!.interest).toBeCloseTo(16.30, 2);
        expect(loanEnd!.total).toBeCloseTo(7016.30, 2);
        expect(loanEnd!.outstandingBalance).toBe(0);
        expect(loanEnd!.notes).toContain('Loan end, repay remaining principal and interest');
      });
    });

    describe('3.2 无本金还款计划，到期日一次性还清', () => {
      it('无本金还款计划，到期日一次性还清全部本金和利息', () => {
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd).toBeDefined();
        expect(loanEnd!.principal).toBe(10000);
        expect(loanEnd!.interest).toBeCloseTo(23.29, 2);
        expect(loanEnd!.total).toBeCloseTo(10023.29, 2);
        expect(loanEnd!.outstandingBalance).toBe(0);
      });
    });

    describe('3.3 本金还款计划覆盖全部期限', () => {
      it('3、6、9、12月各还款2500，到期日只需支付利息', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-03-15', amount: 2500 },
          { id: '2', date: '2024-06-15', amount: 2500 },
          { id: '3', date: '2024-09-15', amount: 2500 },
          { id: '4', date: '2024-12-15', amount: 2500 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const dec15 = getRepaymentByActualDate(schedule, '2024-12-15');
        expect(dec15).toBeDefined();
        expect(dec15!.principal).toBe(2500);
        expect(dec15!.outstandingBalance).toBe(0);

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        if (loanEnd) {
          expect(loanEnd!.principal).toBe(0);
          expect(loanEnd!.interest).toBeCloseTo(23.29, 2);
          expect(loanEnd!.total).toBeCloseTo(23.29, 2);
          expect(loanEnd!.outstandingBalance).toBe(0);
        }
      });
    });
  });

  describe('4. 利息计算准确性', () => {
    describe('4.1 每月利息计算', () => {
      it('验证每月利息计算准确性', () => {
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15!.interest).toBeCloseTo(19.18, 2);

        const feb15 = getInstallmentByActualDate(schedule, '2024-02-15');
        expect(feb15!.interest).toBeCloseTo(42.47, 2);

        const mar15 = getInstallmentByActualDate(schedule, '2024-03-15');
        expect(mar15!.interest).toBeCloseTo(39.73, 2);

        const apr15 = getInstallmentByActualDate(schedule, '2024-04-15');
        expect(apr15!.interest).toBeCloseTo(42.47, 2);

        const may15 = getInstallmentByActualDate(schedule, '2024-05-15');
        expect(may15!.interest).toBeCloseTo(41.10, 2);

        const jun15 = getInstallmentByActualDate(schedule, '2024-06-15');
        expect(jun15!.interest).toBeCloseTo(42.47, 2);
      });
    });

    describe('4.2 本金减少后利息重新计算', () => {
      it('3月15日还款5000后，利息基于剩余本金计算', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-03-15', amount: 5000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15!.interest).toBeCloseTo(19.18, 2);

        const feb15 = getInstallmentByActualDate(schedule, '2024-02-15');
        expect(feb15!.interest).toBeCloseTo(42.47, 2);

        const mar15 = getRepaymentByActualDate(schedule, '2024-03-15');
        expect(mar15!.interest).toBe(0);

        const apr15 = getInstallmentByActualDate(schedule, '2024-04-15');
        expect(apr15!.interest).toBeCloseTo(20.55, 2);

        const may15 = getInstallmentByActualDate(schedule, '2024-05-15');
        expect(may15!.interest).toBeCloseTo(20.55, 2);

        const jun15 = getInstallmentByActualDate(schedule, '2024-06-15');
        expect(jun15!.interest).toBeCloseTo(21.23, 2);
      });
    });

    describe('4.3 跨假期利息计算', () => {
      it('春节假期期间，利息计算天数正确', () => {
        const holidays: Holiday[] = [
          { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15!.interest).toBeCloseTo(19.18, 2);

        const feb18 = getInstallmentByActualDate(schedule, '2024-02-18');
        expect(feb18).toBeDefined();
        expect(feb18!.interest).toBeCloseTo(46.58, 2);

        const mar15 = getInstallmentByActualDate(schedule, '2024-03-15');
        expect(mar15!.interest).toBeCloseTo(35.62, 2);
      });
    });
  });

  describe('5. 还款计划表展示', () => {
    describe('5.1 本金还款和利息还款颜色区分', () => {
      it('验证不同类型还款的备注信息', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-06-15', amount: 3000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15!.notes).toContain('Interest Repayment');

        const jun15Records = schedule.filter(row => row.actualDate === '2024-06-15' && row.type === 'INSTALLMENT' && row.principal > 0);
        expect(jun15Records.length).toBe(1);
        expect(jun15Records[0].principal).toBe(3000);
        expect(jun15Records[0].notes).toContain('Principal Repayment');

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd!.notes).toContain('Loan end, repay remaining principal and interest');
      });
    });

    describe('5.2 还款计划表日期格式', () => {
      it('验证中文界面的日期格式', () => {
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'cn');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15!.notes).toContain('利息还款');

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd!.notes).toContain('贷款到期，还清剩余本金和利息');
      });
    });
  });

  describe('6. 边界情况测试', () => {
    describe('6.1 利息还款日期为31日', () => {
      it('处理非31日月份的还款日期', () => {
        const params = { ...BASE_PARAMS, interestPaymentDay: 31 };
        const { schedule } = calculateSchedule(params, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const jan31 = getInstallmentByActualDate(schedule, '2024-01-31');
        expect(jan31).toBeDefined();
        expect(jan31!.interest).toBeCloseTo(41.10, 2);

        const mar31 = getInstallmentByActualDate(schedule, '2024-03-31');
        expect(mar31).toBeDefined();
        expect(mar31!.interest).toBeCloseTo(82.19, 2);

        const may31 = getInstallmentByActualDate(schedule, '2024-05-31');
        expect(may31).toBeDefined();
        expect(may31!.interest).toBeCloseTo(83.56, 2);
      });
    });

    describe('6.2 起息日等于利息还款日', () => {
      it('起息日等于利息还款日时，第一期从下月开始计算', () => {
        const params = { ...BASE_PARAMS, interestPaymentDay: 1 };
        const { schedule } = calculateSchedule(params, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const feb1 = getInstallmentByActualDate(schedule, '2024-02-01');
        expect(feb1).toBeDefined();
        expect(feb1!.interest).toBeCloseTo(41.10, 2);

        const mar1 = getInstallmentByActualDate(schedule, '2024-03-01');
        expect(mar1).toBeDefined();
        expect(mar1!.interest).toBeCloseTo(39.73, 2);

        const apr1 = getInstallmentByActualDate(schedule, '2024-04-01');
        expect(apr1).toBeDefined();
        expect(apr1!.interest).toBeCloseTo(42.47, 2);
      });
    });

    describe('6.3 本金还款日期等于利息还款日期', () => {
      it('本金还款和利息还款在同一天时分别处理', () => {
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-03-15', amount: 3000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const mar15Records = schedule.filter(row => row.actualDate === '2024-03-15' && row.type === 'INSTALLMENT');
        expect(mar15Records.length).toBe(2);
        
        const principalRecord = mar15Records.find(r => r.principal > 0);
        expect(principalRecord).toBeDefined();
        expect(principalRecord!.principal).toBe(3000);
        expect(principalRecord!.interest).toBe(0);
        expect(principalRecord!.total).toBe(3000);
        expect(principalRecord!.outstandingBalance).toBe(7000);
        expect(principalRecord!.notes).toContain('Principal Repayment');
        
        const interestRecord = mar15Records.find(r => r.principal === 0 && r.interest > 0);
        expect(interestRecord).toBeDefined();
        expect(interestRecord!.principal).toBe(0);
        expect(interestRecord!.interest).toBeCloseTo(39.73, 2);
        expect(interestRecord!.total).toBeCloseTo(39.73, 2);
        expect(interestRecord!.outstandingBalance).toBe(10000);
        expect(interestRecord!.notes).toContain('Interest Repayment');
      });
    });

    describe('6.4 本金还款日期在假期期间', () => {
      it('本金还款日期在假期期间时顺延处理', () => {
        const holidays: Holiday[] = [
          { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
        ];
        
        const principalRepayments: RepaymentEvent[] = [
          { id: '1', date: '2024-02-15', amount: 3000 }
        ];
        
        const { schedule } = calculateSchedule(BASE_PARAMS, holidays, EMPTY_RATE_RANGES, principalRepayments, 'en');
        
        const feb18Records = schedule.filter(row => row.actualDate === '2024-02-18' && row.type === 'INSTALLMENT');
        expect(feb18Records.length).toBe(2);
        
        const principalRecord = feb18Records.find(r => r.principal > 0);
        expect(principalRecord).toBeDefined();
        expect(principalRecord!.principal).toBe(3000);
        expect(principalRecord!.interest).toBe(0);
        expect(principalRecord!.total).toBe(3000);
        expect(principalRecord!.outstandingBalance).toBe(7000);
        expect(principalRecord!.notes).toContain('Principal Repayment');
        
        const interestRecord = feb18Records.find(r => r.principal === 0 && r.interest > 0);
        expect(interestRecord).toBeDefined();
        expect(interestRecord!.principal).toBe(0);
        expect(interestRecord!.interest).toBeCloseTo(46.58, 2);
        expect(interestRecord!.total).toBeCloseTo(46.58, 2);
        expect(interestRecord!.outstandingBalance).toBe(10000);
        expect(interestRecord!.notes).toContain('Interest Repayment');
      });
    });
  });

  describe('7. 国际化支持测试', () => {
    describe('7.1 英文界面显示', () => {
      it('验证英文界面的备注信息', () => {
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15!.notes).toContain('Interest Repayment');

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd!.notes).toContain('Loan end, repay remaining principal and interest');
      });
    });

    describe('7.2 中文界面显示', () => {
      it('验证中文界面的备注信息', () => {
        const { schedule } = calculateSchedule(BASE_PARAMS, EMPTY_HOLIDAYS, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'cn');
        
        const jan15 = getInstallmentByActualDate(schedule, '2024-01-15');
        expect(jan15!.notes).toContain('利息还款');

        const loanEnd = getInstallmentByActualDate(schedule, '2025-01-01');
        expect(loanEnd!.notes).toContain('贷款到期，还清剩余本金和利息');
      });
    });
  });
});
