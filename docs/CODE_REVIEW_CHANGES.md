# 代码审查变更摘要

## Issue 1: 返回类型缺失类型注解

### 问题描述
重构后的 `calculateSchedule` 函数缺少返回类型注解，影响 TypeScript 类型检查和 IDE 智能提示。

### 修复内容

#### 1. services/loanCalculator.ts
**变更前:**
```typescript
import { LoanParams, Holiday, RateRange, RepaymentEvent, Language } from '../types';
import { createCalculator } from './calculatorFactory';
import { dictionary } from '../translations';

export const calculateSchedule = (
  params: LoanParams,
  holidays: Holiday[],
  rateRanges: RateRange[],
  repayments: RepaymentEvent[],
  language: Language = 'en'
) => {
```

**变更后:**
```typescript
import { LoanParams, Holiday, RateRange, RepaymentEvent, Installment, Summary } from '../types';
import { Language, dictionary } from '../translations';
import { createCalculator } from './calculatorFactory';

export const calculateSchedule = (
  params: LoanParams,
  holidays: Holiday[],
  rateRanges: RateRange[],
  repayments: RepaymentEvent[],
  language: Language = 'en'
): { schedule: Installment[]; summary: Summary } => {
```

**修改要点:**
- 添加返回类型注解 `: { schedule: Installment[]; summary: Summary }`
- 从 `types.ts` 导入 `Installment` 和 `Summary` 类型
- 修正 `Language` 类型导入来源（从 `translations.ts` 导入）

#### 2. services/calculators/types.ts
**变更前:**
```typescript
import { LoanParams, Holiday, RateRange, RepaymentEvent, Language, Installment, Summary } from '../../types';
import { TranslationDictionary } from '../../translations';
```

**变更后:**
```typescript
import { LoanParams, Holiday, RateRange, RepaymentEvent, Installment, Summary } from '../../types';
import { Language, TranslationDictionary } from '../../translations';
```

**修改要点:**
- 修正 `Language` 类型导入来源

#### 3. translations.ts
**变更前:**
```typescript
export type Language = 'en' | 'cn';

export const dictionary = {
```

**变更后:**
```typescript
export type Language = 'en' | 'cn';

export type TranslationDictionary = typeof dictionary['en'];

export const dictionary = {
```

**修改要点:**
- 添加 `TranslationDictionary` 类型导出，供其他模块使用

### 验证结果
- ✅ TypeScript 类型检查通过 (`tsc --noEmit`)
- ✅ 所有 35 个测试用例通过

### 改进效果
1. **类型安全**: 函数返回值有明确的类型约束，编译器可检测类型错误
2. **IDE 支持**: 编辑器可提供准确的自动补全和类型提示
3. **代码可维护性**: 类型注解作为文档，清晰表达函数契约
4. **导入规范**: 类型从正确的模块导入，避免循环依赖风险

---
*审查日期: 2026-04-04*
