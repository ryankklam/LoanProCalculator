import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import Ajv from 'ajv';
import { calculateSchedule } from '../../services/loanCalculator';
import { LoanParams, Holiday, RateRange, RepaymentEvent } from '../../types';

// 加载Schema
const schemaPath = path.join(__dirname, 'schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv();
const validate = ajv.compile(schema);

// 解析Markdown文件的YAML Front Matter
function parseMarkdownFile(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  
  if (!frontMatterMatch) {
    throw new Error(`文件 ${filePath} 缺少YAML Front Matter`);
  }
  
  const frontMatter = yaml.parse(frontMatterMatch[1]);
  return frontMatter;
}

// 验证测试数据
function validateTestData(data: any): void {
  const valid = validate(data);
  if (!valid) {
    throw new Error(`测试数据验证失败: ${JSON.stringify(validate.errors, null, 2)}`);
  }
}

// 执行测试用例
function runTest(testData: any): void {
  const { params, repayments = [], holidays = [], rateRanges = [] } = testData;
  
  const result = calculateSchedule(
    params as LoanParams,
    holidays as Holiday[],
    rateRanges as RateRange[],
    repayments as RepaymentEvent[],
    'en'
  );
  
  // 验证总利息和总还款
  if (testData.expected.totalInterest) {
    expect(result.summary.totalInterest).toBeCloseTo(testData.expected.totalInterest, 2);
  }
  
  if (testData.expected.totalPaid) {
    expect(result.summary.totalPaid).toBeCloseTo(testData.expected.totalPaid, 2);
  }
  
  // 验证还款计划详情
  if (testData.expected.installments) {
    testData.expected.installments.forEach((expectedInstallment: any) => {
      const actualInstallment = result.schedule.find(
        (item: any) => item.actualDate === expectedInstallment.actualDate
      );
      
      expect(actualInstallment).toBeDefined();
      if (expectedInstallment.principal !== undefined) {
        expect(actualInstallment.principal).toBeCloseTo(expectedInstallment.principal, 2);
      }
      if (expectedInstallment.interest !== undefined) {
        expect(actualInstallment.interest).toBeCloseTo(expectedInstallment.interest, 2);
      }
      if (expectedInstallment.total !== undefined) {
        expect(actualInstallment.total).toBeCloseTo(expectedInstallment.total, 2);
      }
      if (expectedInstallment.outstandingBalance !== undefined) {
        expect(actualInstallment.outstandingBalance).toBeCloseTo(expectedInstallment.outstandingBalance, 2);
      }
    });
  }
}

// 扫描目录并执行所有测试用例
export function runAllTests(testDir: string): void {
  const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.md'));
  
  testFiles.forEach(file => {
    const filePath = path.join(testDir, file);
    describe(`测试用例: ${file}`, () => {
      it('执行测试', () => {
        const testData = parseMarkdownFile(filePath);
        validateTestData(testData);
        runTest(testData);
      });
    });
  });
}

// 导出测试引擎
export { parseMarkdownFile, validateTestData, runTest };