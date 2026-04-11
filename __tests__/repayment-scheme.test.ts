import { describe, it } from 'vitest';
import { runAllTests } from './test-engine/testEngine';

// 运行所有测试用例
describe('不规则还款14测试', () => {
  runAllTests('./__tests__/test-data/repayment-scheme');
});