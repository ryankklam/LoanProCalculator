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
  repaymentScheme: 'EQUAL_INSTALLMENT',
  interestPaymentFrequency: 'MONTHLY',
  interestPaymentDay: 15
};

const EMPTY_RATE_RANGES: RateRange[] = [];
const EMPTY_REPAYMENTS: RepaymentEvent[] = [];

const getFirstInstallment = (schedule: any[]) => 
  schedule.find(row => row.type === 'INSTALLMENT');

const getInstallmentByNominalDate = (schedule: any[], nominalDate: string) =>
  schedule.find(row => row.type === 'INSTALLMENT' && row.nominalDate === nominalDate);

describe('节假日调整逻辑测试', () => {
  describe('2.1 正常工作日无调整', () => {
    it('无假期时，还款日照常', () => {
      const holidays: Holiday[] = [];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-05',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const firstInstallment = getFirstInstallment(schedule);
      expect(firstInstallment).toBeDefined();
      expect(firstInstallment!.nominalDate).toBe('2024-02-05');
      expect(firstInstallment!.actualDate).toBe('2024-02-05');
    });

    it('BEFORE模式无假期时，还款日照常', () => {
      const holidays: Holiday[] = [];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-05',
        holidayShiftMode: 'BEFORE'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const firstInstallment = getFirstInstallment(schedule);
      expect(firstInstallment).toBeDefined();
      expect(firstInstallment!.nominalDate).toBe('2024-02-05');
      expect(firstInstallment!.actualDate).toBe('2024-02-05');
    });
  });

  describe('2.2 AFTER模式 - 节假日顺延', () => {
    it('还款日在春节假期中间，顺延到假期后的第一个非假日', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const installmentFeb = getInstallmentByNominalDate(schedule, '2024-02-15');
      expect(installmentFeb).toBeDefined();
      expect(installmentFeb!.nominalDate).toBe('2024-02-15');
      expect(installmentFeb!.actualDate).toBe('2024-02-18');
    });

    it('还款日在元旦当天，顺延到下一工作日', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-01-01', endDate: '2024-01-01', name: '元旦' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2023-12-01',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const installmentJan = getInstallmentByNominalDate(schedule, '2024-01-01');
      expect(installmentJan).toBeDefined();
      expect(installmentJan!.nominalDate).toBe('2024-01-01');
      expect(installmentJan!.actualDate).toBe('2024-01-02');
    });

    it('还款日在清明假期中间，假期日照常（周末不视为假日）', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-04-04', endDate: '2024-04-06', name: '清明' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-03-01',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const installmentApr = getInstallmentByNominalDate(schedule, '2024-04-01');
      expect(installmentApr).toBeDefined();
      expect(installmentApr!.nominalDate).toBe('2024-04-01');
      expect(installmentApr!.actualDate).toBe('2024-04-01');
      
      const installmentJun = getInstallmentByNominalDate(schedule, '2024-06-01');
      expect(installmentJun).toBeDefined();
      expect(installmentJun!.nominalDate).toBe('2024-06-01');
      expect(installmentJun!.actualDate).toBe('2024-06-01');
    });
  });

  describe('2.3 BEFORE模式 - 节假日提前', () => {
    it('还款日在春节假期前，提前到假期前最后一个工作日', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'BEFORE'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const installmentFeb = getInstallmentByNominalDate(schedule, '2024-02-15');
      expect(installmentFeb).toBeDefined();
      expect(installmentFeb!.nominalDate).toBe('2024-02-15');
      expect(installmentFeb!.actualDate).toBe('2024-02-08');
    });

    it('还款日在元旦当天，提前到上一个非假日（跳过周末）', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-01-01', endDate: '2024-01-01', name: '元旦' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2023-12-01',
        holidayShiftMode: 'BEFORE'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const installmentJan = getInstallmentByNominalDate(schedule, '2024-01-01');
      expect(installmentJan).toBeDefined();
      expect(installmentJan!.nominalDate).toBe('2024-01-01');
      expect(installmentJan!.actualDate).toBe('2023-12-31');
    });
  });

  describe('2.4 跨假期边界计算', () => {
    it('AFTER模式：假期后第一个工作日为周日时，停留在周日', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const installmentFeb = getInstallmentByNominalDate(schedule, '2024-02-15');
      expect(installmentFeb).toBeDefined();
      expect(installmentFeb!.actualDate).toBe('2024-02-18');
    });

    it('AFTER模式：多期还款，假期后的第一期和第二期正确处理', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const febInstallment = getInstallmentByNominalDate(schedule, '2024-02-15');
      const marInstallment = getInstallmentByNominalDate(schedule, '2024-03-15');
      
      expect(febInstallment).toBeDefined();
      expect(febInstallment!.actualDate).toBe('2024-02-18');
      
      expect(marInstallment).toBeDefined();
      expect(marInstallment!.actualDate).toBe('2024-03-15');
    });

    it('BEFORE模式：假期前最后一个工作日为周六时，停留在周六', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'BEFORE'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const installmentFeb = getInstallmentByNominalDate(schedule, '2024-02-15');
      expect(installmentFeb).toBeDefined();
      expect(installmentFeb!.actualDate).toBe('2024-02-08');
    });
  });

  describe('2.5 分段利息计算（跨假期）', () => {
    it('AFTER模式跨春节假期，daysCount正确计算', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'AFTER',
        amount: 50000
      };
      
      const { schedule, summary } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const febSegment = schedule.find(row => 
        row.type === 'SEGMENT' && row.nominalDate === '2024-02-18'
      );
      const febInstallment = getInstallmentByNominalDate(schedule, '2024-02-15');
      
      expect(febSegment).toBeDefined();
      expect(febSegment!.daysCount).toBe(34);
      expect(febInstallment!.daysCount).toBe(34);
      expect(summary.totalInterest).toBeGreaterThan(0);
    });

    it('BEFORE模式跨春节假期，daysCount正确计算', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'BEFORE',
        amount: 50000
      };
      
      const { schedule, summary } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const febSegment = schedule.find(row => 
        row.type === 'SEGMENT' && row.nominalDate === '2024-02-08'
      );
      
      expect(febSegment).toBeDefined();
      expect(febSegment!.daysCount).toBe(24);
      expect(summary.totalInterest).toBeGreaterThan(0);
    });
  });

  describe('边界情况测试', () => {
    it('连续多个月都有假期调整', () => {
      const holidays: Holiday[] = [
        { id: '1', startDate: '2024-01-01', endDate: '2024-01-01', name: '元旦' },
        { id: '2', startDate: '2024-02-09', endDate: '2024-02-17', name: '春节' },
        { id: '3', startDate: '2024-04-04', endDate: '2024-04-06', name: '清明' }
      ];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2023-12-01',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const janInstallment = getInstallmentByNominalDate(schedule, '2024-01-01');
      const febInstallment = getInstallmentByNominalDate(schedule, '2024-02-01');
      const aprInstallment = getInstallmentByNominalDate(schedule, '2024-04-01');
      
      expect(janInstallment!.actualDate).toBe('2024-01-02');
      expect(febInstallment!.actualDate).toBe('2024-02-01');
      expect(aprInstallment!.actualDate).toBe('2024-04-01');
    });

    it('无假期时，BEFORE和AFTER模式行为一致', () => {
      const holidays: Holiday[] = [];
      
      const paramsAfter: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'AFTER'
      };
      
      const paramsBefore: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-15',
        holidayShiftMode: 'BEFORE'
      };
      
      const { schedule: scheduleAfter } = calculateSchedule(paramsAfter, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      const { schedule: scheduleBefore } = calculateSchedule(paramsBefore, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const firstAfter = getFirstInstallment(scheduleAfter);
      const firstBefore = getFirstInstallment(scheduleBefore);
      
      expect(firstAfter!.actualDate).toBe(firstBefore!.actualDate);
      expect(firstAfter!.actualDate).toBe('2024-02-15');
    });
  });

  describe('周末不被视为假日', () => {
    it('还款日是周末且无假期时，不进行调整', () => {
      const holidays: Holiday[] = [];
      
      const params: LoanParams = {
        ...BASE_PARAMS,
        startDate: '2024-01-01',
        holidayShiftMode: 'AFTER'
      };
      
      const { schedule } = calculateSchedule(params, holidays, EMPTY_RATE_RANGES, EMPTY_REPAYMENTS, 'en');
      
      const firstInstallment = getFirstInstallment(schedule);
      expect(firstInstallment!.actualDate).toBe('2024-02-01');
    });
  });
});