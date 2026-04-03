# 组合模式重构计划

## 概述
本计划详细描述了将 LoanProCalculator 从单体/继承模式重构为组合模式的步骤。

## 目标
- ✅ 提高代码可维护性
- ✅ 提高代码可测试性
- ✅ 提高代码可扩展性
- ✅ 保持 API 兼容性（现有测试用例可复用）
- ✅ 遵循"多用组合，少用继承"原则

## 当前状态
- 所有测试用例通过（20个测试用例）
- 代码库：597行单一文件 `loanCalculator.ts`
- 两种还款方式：等额本息、不规则还款5

## 重构原则
1. **API 兼容性优先**：保持 `calculateSchedule()` 函数签名不变
2. **渐进式重构**：分步骤实施，每步都可测试
3. **测试驱动**：先写测试，再写代码
4. **向后兼容**：确保所有现有测试用例通过

---

## 重构步骤

### 阶段 1：准备工作
**目标**：创建基础文件结构，确保当前测试通过

#### 1.1 创建目录结构
```
services/
├── strategies/          # 新建：策略层
└── calculators/         # 新建：计算器层

__tests__/
├── unit/
│   ├── strategies/      # 新建：策略单元测试
│   └── calculators/     # 新建：计算器单元测试
└── integration/         # 新建：集成测试（移动现有测试）
```

#### 1.2 运行现有测试，确保通过
```bash
npm test
```
**检查点**：✅ 20个测试用例全部通过

---

### 阶段 2：提取策略层
**目标**：将辅助函数重构为独立的策略组件

#### 2.1 创建策略接口
**文件**：`services/strategies/interfaces.ts`
- 定义 `DateOperations` 接口
- 定义 `HolidayOperations` 接口
- 定义 `RateOperations` 接口
- 定义 `InterestCalculationStrategy` 接口
- 定义 `PaymentScheduleStrategy` 接口

**测试**：无需测试（纯类型定义）

---

#### 2.2 实现日期操作策略
**文件**：`services/strategies/dateOperations.ts`
- 从 `loanCalculator.ts` 提取 `parseISO()`
- 从 `loanCalculator.ts` 提取 `startOfDay()`
- 实现 `differenceInDays()`（使用 date-fns）
- 实现 `format()`（使用 date-fns）

**测试文件**：`__tests__/unit/strategies/dateOperations.test.ts`
- 测试 `parseISO()`
- 测试 `startOfDay()`
- 测试 `differenceInDays()`
- 测试 `format()`

**检查点**：✅ 策略单元测试通过

---

#### 2.3 实现假期操作策略
**文件**：`services/strategies/holidayOperations.ts`
- 从 `loanCalculator.ts` 提取 `isHoliday()`
- 从 `loanCalculator.ts` 提取 `getNextBusinessDay()`
- 从 `loanCalculator.ts` 提取 `getPreviousBusinessDay()`
- 依赖注入 `DateOperations`

**测试文件**：`__tests__/unit/strategies/holidayOperations.test.ts`
- 测试 `isHoliday()`
- 测试 `getNextBusinessDay()`
- 测试 `getPreviousBusinessDay()`

**检查点**：✅ 策略单元测试通过

---

#### 2.4 实现利率操作策略
**文件**：`services/strategies/rateOperations.ts`
- 从 `loanCalculator.ts` 提取 `getRateForDay()`
- 依赖注入 `DateOperations`

**测试文件**：`__tests__/unit/strategies/rateOperations.test.ts`
- 测试基础利率查询
- 测试利率区间查询
- 测试无结束日期的区间
- 测试重叠区间处理

**检查点**：✅ 策略单元测试通过

---

#### 2.5 实现利息计算策略
**文件**：`services/strategies/interestStrategies.ts`
- 实现 `simpleInterestStrategy`（简单利息）
- 实现 `calculateDailyInterest()`
- 实现 `calculatePeriodInterest()`

**测试文件**：`__tests__/unit/strategies/interestStrategies.test.ts`
- 测试日利息计算
- 测试期间利息计算
- 测试闰年处理

**检查点**：✅ 策略单元测试通过

---

#### 2.6 实现还款计划生成策略
**文件**：`services/strategies/paymentScheduleStrategies.ts`
- 从 `loanCalculator.ts` 提取 `generatePaymentDates()`
- 实现月度还款日期生成
- 实现季度还款日期生成
- 实现双周还款日期生成
- 依赖注入 `DateOperations`

**测试文件**：`__tests__/unit/strategies/paymentScheduleStrategies.test.ts`
- 测试月度还款日期
- 测试季度还款日期
- 测试双周还款日期
- 测试月末日期处理

**检查点**：✅ 策略单元测试通过

---

### 阶段 3：实现计算器层
**目标**：将业务逻辑重构为独立的计算器

#### 3.1 创建计算器类型定义
**文件**：`services/calculators/types.ts`
- 定义 `CalculatorDependencies` 类型
- 定义 `CalculatorContext` 类型
- 定义 `Calculator` 接口

**检查点**：✅ 类型定义完成

---

#### 3.2 实现不规则还款5计算器
**文件**：`services/calculators/irregularRepayment5Calculator.ts`
- 从 `loanCalculator.ts` 提取不规则还款5逻辑
- 使用策略组合而非继承
- 实现 `calculate()` 方法
- 提取私有方法 `processPrincipalPayment()`
- 提取私有方法 `processInterestPayment()`
- 提取私有方法 `createSummary()`

**测试文件**：`__tests__/unit/calculators/irregularRepayment5Calculator.test.ts`
- 测试基本计算流程
- 测试本金还款处理
- 测试利息还款处理
- 测试到期日处理
- 使用 mock 策略进行单元测试

**检查点**：✅ 计算器单元测试通过

---

#### 3.3 实现等额本息计算器
**文件**：`services/calculators/straightLineCalculator.ts`
- 从 `loanCalculator.ts` 提取等额本息逻辑
- 使用策略组合而非继承
- 实现 `calculate()` 方法
- 提取私有方法 `calculatePMT()`
- 提取私有方法 `createSummary()`

**测试文件**：`__tests__/unit/calculators/straightLineCalculator.test.ts`
- 测试基本计算流程
- 测试 PMT 计算
- 测试利率调整处理
- 使用 mock 策略进行单元测试

**检查点**：✅ 计算器单元测试通过

---

### 阶段 4：创建工厂和主入口
**目标**：组装组件，保持 API 兼容

#### 4.1 创建计算器工厂
**文件**：`services/calculatorFactory.ts`
- 创建默认策略实例
- 支持自定义策略注入
- 根据还款方案返回对应的计算器
- 组装计算器的依赖项

**检查点**：✅ 工厂创建逻辑完成

---

#### 4.2 重构主入口（关键步骤）
**文件**：`services/loanCalculator.ts`
- ⚠️ **关键**：保持 `calculateSchedule()` 函数签名不变
- 内部调用 `createCalculator()` 创建计算器
- 组装 `CalculatorContext`
- 调用 `calculator.calculate()`
- 返回结果（格式与原一致）

**检查点**：✅ API 兼容性验证

---

### 阶段 5：迁移和验证测试
**目标**：确保所有测试通过

#### 5.1 迁移集成测试
- 将 `__tests__/unit/irregularRepayment5.test.ts` 移动到 `__tests__/integration/`
- 保持测试内容完全不变
- 创建 `__tests__/integration/straightLine.test.ts`（如果不存在）

**检查点**：✅ 测试文件迁移完成

---

#### 5.2 运行所有测试
```bash
npm test
```

**检查点**：
- ✅ 策略单元测试通过
- ✅ 计算器单元测试通过
- ✅ 集成测试通过（20个原有测试用例）
- ✅ 总计 70+ 测试用例通过

---

#### 5.3 手动验证
- 启动应用，手动测试两种还款方式
- 验证计算结果与重构前一致
- 验证 UI 功能正常

**检查点**：✅ 手动验证通过

---

### 阶段 6：清理和优化
**目标**：清理代码，提高质量

#### 6.1 删除冗余代码
- 确认所有逻辑都已迁移
- 确认没有功能丢失
- 删除临时文件和调试代码

**检查点**：✅ 冗余代码已清理

---

#### 6.2 代码审查
- 检查代码风格一致性
- 检查文档完整性
- 检查测试覆盖率

**检查点**：✅ 代码审查通过

---

## 回滚计划
如果重构过程中遇到问题，可以按以下步骤回滚：

### 回滚步骤
1. 停止重构工作
2. 切换到重构前的分支（master/main）
3. 确认所有测试通过
4. 分析失败原因，调整计划
5. 重新开始重构

---

## 成功标准
- ✅ 所有现有测试用例通过（20个）
- ✅ 新的单元测试通过（50+个）
- ✅ API 完全兼容（无需修改调用方）
- ✅ 代码结构清晰，职责分离
- ✅ 测试覆盖率提高
- ✅ 无功能丢失

---

## 预期收益
- **可维护性**：单文件从 597 行减少到多个 40-180 行的文件
- **可测试性**：从 20 个测试增加到 70+ 个测试
- **可扩展性**：添加新还款方式只需新增一个计算器文件
- **复用性**：策略可以在不同计算器间复用
- **灵活性**：可以在运行时替换策略

---

## 风险评估
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 测试用例失败 | 中 | 高 | 每步都运行测试，保持 API 兼容 |
| 功能丢失 | 低 | 高 | 完整迁移，集成测试覆盖 |
| 性能下降 | 低 | 低 | 组合模式在 JS 中性能损失可忽略 |
| 时间超期 | 中 | 中 | 分阶段实施，每步可交付 |

---

## 时间估算
- **阶段 1-2**：2-3小时（策略层）
- **阶段 3**：3-4小时（计算器层）
- **阶段 4**：1-2小时（工厂和入口）
- **阶段 5**：1-2小时（测试和验证）
- **阶段 6**：1小时（清理和审查）

**总计**：8-12小时

---

## 开始重构
确认所有准备工作完成后，开始实施重构计划。
