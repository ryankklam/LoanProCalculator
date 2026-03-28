# Day Count Convention Support - Design Spec
# 年基准天数支持 - 设计规格文档

**Date / 日期**: 2026-03-28  
**Feature / 功能**: Support 30/360 Day Count Convention / 支持 30/360 年基准天数  
**Status / 状态**: Approved / 已批准

---

## 1. Overview / 概述

**EN:** Add support for 30/360 day count convention in addition to the existing Actual/365. This allows users to choose between different interest calculation bases commonly used in banking.

**中文:** 在现有的 Actual/365 基础上增加 30/360 年基准天数支持，允许用户选择不同的利息计算基准天数。

---

## 2. Changes / 变更内容

### 2.1 Types / 类型定义 (`types.ts`)

**EN:** Add new type and field to LoanParams.

**中文:** 新增类型定义并在 LoanParams 中添加字段。

```typescript
// 新增类型 / NEW type
export type DayCountConvention = 360 | 365;

// LoanParams 新增字段 / NEW field in LoanParams
export interface LoanParams {
  amount: number;
  initialRate: number;
  tenureMonths: number;
  startDate: string;
  dayCountConvention: DayCountConvention;  // NEW / 新增
  holidayShiftMode: 'BEFORE' | 'AFTER';
  adjustmentStrategy: 'CHANGE_INSTALLMENT' | 'CHANGE_TENURE';
}
```

---

### 2.2 Configuration Panel / 配置面板 (`components/ConfigurationPanel.tsx`)

**EN:** Add dropdown before "Start Date" field.

**中文:** 在 "Start Date" 字段前添加下拉选择框。

| Field / 字段 | Type / 类型 | Default / 默认值 |
|--------------|-------------|------------------|
| Day Count Basis / 年基准天数 | Select / 下拉框 | 365 |

**Options / 选项:**
- `365` → "Actual/365 (365 Days)" / "实际/365 (365天)"
- `360` → "30/360 (360 Days)" / "30/360 (360天)"

---

### 2.3 App State / 应用状态 (`App.tsx`)

**EN:** Add default value `dayCountConvention: 365` to params state.

**中文:** 在 params 状态中添加默认值 `dayCountConvention: 365`。

```typescript
const [params, setParams] = useState<LoanParams>({
  // ... existing / 现有字段
  dayCountConvention: 365,  // NEW / 新增
});
```

---

### 2.4 Calculator Engine / 计算引擎 (`services/loanCalculator.ts`)

**EN:** Modify daily interest calculation to use configurable day count.

**中文:** 修改日利息计算逻辑，使用可配置的年基准天数。

```typescript
// 修改前 / Before:
const dailyInterest = currentBalance * (dailyRatePercent / 100) / 365;

// 修改后 / After:
const dayCount = dayCountConvention; // from params / 从参数获取
const dailyInterest = currentBalance * (dailyRatePercent / 100) / dayCount;
```

同时需要从 params 中提取 `dayCountConvention`：
```typescript
const { amount, initialRate, tenureMonths, startDate, holidayShiftMode, adjustmentStrategy, dayCountConvention } = params;
```

---

### 2.5 Translations / 翻译文本 (`translations.ts`)

**EN:** Add new translation keys for day count basis options.

**中文:** 添加年基准天数的翻译键值。

```typescript
// English / 英文
dayCountBasis: 'Day Count Basis',
dayCountBasisTooltip: 'Determines the annual day count for interest calculation.',
actual365: 'Actual/365 (365 Days)',
thirty360: '30/360 (360 Days)',

// 中文 / Chinese
dayCountBasis: '年基准天数',
dayCountBasisTooltip: '决定利息计算的年基准天数。',
actual365: '实际/365 (365天)',
thirty360: '30/360 (360天)',
```

---

### 2.6 Documentation / 文档更新

**EN:** Update functional and technical specifications.

**中文:** 更新功能规格和技术规格文档。

| File / 文件 | Update / 更新内容 |
|-------------|-----------------|
| `docs/FUNCTIONAL-SPEC.md` | Add day count convention to configuration section / 在配置部分添加年基准天数说明 |
| `docs/TECHNICAL-SPEC.md` | Update type definitions / 更新类型定义 |

---

## 3. Files to Modify / 需修改的文件

| # | File / 文件 | Description / 描述 |
|---|-------------|-------------------|
| 1 | `types.ts` | Add type and field / 添加类型和字段 |
| 2 | `translations.ts` | Add translations / 添加翻译 |
| 3 | `App.tsx` | Add default value / 添加默认值 |
| 4 | `components/ConfigurationPanel.tsx` | Add UI dropdown / 添加下拉框 |
| 5 | `services/loanCalculator.ts` | Update calculation / 更新计算逻辑 |
| 6 | `docs/FUNCTIONAL-SPEC.md` | Update docs / 更新文档 |
| 7 | `docs/TECHNICAL-SPEC.md` | Update docs / 更新文档 |

---

## 4. Backward Compatibility / 向后兼容

**EN:** Default value is `365` (Actual/365), preserving existing behavior for all current users.

**中文:** 默认值为 `365` (Actual/365)，保持现有用户的使用习惯不变。
