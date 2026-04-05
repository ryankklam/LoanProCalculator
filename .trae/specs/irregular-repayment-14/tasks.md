# 不规则还款14 - 实施计划

## [x] 任务 1: 更新类型定义，添加新还款方案
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 types.ts 的 RepaymentScheme 枚举中添加 'IRREGULAR_REPAYMENT_14'
  - 确认 LoanParams 中的配置参数同样适用于新还款方案
- **Acceptance Criteria Addressed**: [FR-1]
- **Test Requirements**:
  - `programmatic` TR-1.1: TypeScript 类型检查通过
- **Notes**: 无

## [x] 任务 2: 创建 IrregularRepayment14Calculator 类
- **Priority**: P0
- **Depends On**: [任务 1]
- **Description**: 
  - 创建 services/calculators/irregularRepayment14Calculator.ts
  - 实现 Calculator 接口
  - 实现"利随本清"逻辑：
    * 本金还款时：计算并归还从上一次还款日到本次还款日的利息
    * 利息付款日时：归还利息（无本金时）
    * 贷款到期时：归还剩余本金和利息
  - 复用现有的策略组件
- **Acceptance Criteria Addressed**: [FR-2, AC-2, AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-2.1: 本金还款时，利息计算正确（从上一次还款日到本次）
  - `programmatic` TR-2.2: 利息付款日无本金时，仅归还利息
  - `programmatic` TR-2.3: 贷款到期时，结清剩余本金和利息
- **Notes**: 可以参考 IrregularRepayment5Calculator 的实现，但调整利息计算逻辑

## [x] 任务 3: 在计算器工厂中注册新方案
- **Priority**: P0
- **Depends On**: [任务 2]
- **Description**: 
  - 在 calculatorFactory.ts 中导入 IrregularRepayment14Calculator
  - 在 calculators 映射中添加 'IRREGULAR_REPAYMENT_14' 键
- **Acceptance Criteria Addressed**: [FR-3]
- **Test Requirements**:
  - `programmatic` TR-3.1: TypeScript 类型检查通过
  - `programmatic` TR-3.2: createCalculator('IRREGULAR_REPAYMENT_14') 成功返回实例
- **Notes**: 无

## [x] 任务 4: 添加中英文翻译
- **Priority**: P1
- **Depends On**: [任务 1]
- **Description**: 
  - 在 translations.ts 中添加 'irregularMode14' 翻译项
  - 英文：'Irregular - Mode14'
  - 中文：'不规则还款14'
- **Acceptance Criteria Addressed**: [FR-5]
- **Test Requirements**:
  - `programmatic` TR-4.1: TypeScript 类型检查通过
  - `human-judgement` TR-4.2: 中英文翻译正确
- **Notes**: 在 irregularMode5 附近添加

## [x] 任务 5: 更新配置界面
- **Priority**: P1
- **Depends On**: [任务 4]
- **Description**: 
  - 在 ConfigurationPanel.tsx 中添加不规则还款14选项
  - 确保利息还款频率和利息还款日配置在选择不规则还款14时也可用
- **Acceptance Criteria Addressed**: [FR-4, AC-1]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 下拉菜单中可以看到不规则还款14选项
  - `human-judgement` TR-5.2: 选择后利息还款配置项可用
- **Notes**: 参考不规则还款5的UI实现

## [x] 任务 6: 运行所有测试并验证
- **Priority**: P0
- **Depends On**: [任务 3, 任务 5]
- **Description**: 
  - 运行 TypeScript 类型检查
  - 运行所有现有测试用例
  - 手动测试不规则还款14的基本功能
- **Acceptance Criteria Addressed**: [AC-5, NFR-1]
- **Test Requirements**:
  - `programmatic` TR-6.1: TypeScript 类型检查通过 ✅
  - `programmatic` TR-6.2: 所有35个现有测试用例通过 ✅
  - `human-judgement` TR-6.3: 手动测试基本功能正常 ✅
- **Notes**: 确保不破坏现有功能
