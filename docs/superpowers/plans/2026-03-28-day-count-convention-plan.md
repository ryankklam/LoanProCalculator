# Day Count Convention Support - Implementation Plan
# 年基准天数支持 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **给智能工程师:** 必需子技能: 使用 superpowers:subagent-driven-development (推荐) 或 superpowers:executing-plans 按任务实现。步骤使用复选框 (`- [ ]`) 语法进行追踪。

**Goal / 目标:** Add 30/360 and Actual/365 day count convention options for interest calculation / 增加 30/360 和 Actual/365 年基准天数选项用于利息计算

**Architecture / 架构:** Add a dropdown selector in ConfigurationPanel to choose day count basis (360 or 365). The selected value flows through params to loanCalculator which uses it in daily interest formula. / 在 ConfigurationPanel 中添加下拉选择器用于选择年基准天数 (360 或 365)。选中的值通过 params 传递到 loanCalculator 用于日利息计算。

**Tech Stack / 技术栈:** React 19, TypeScript, Tailwind CSS, date-fns

---

## Task 1: Add Type Definition / 添加类型定义

**Files / 文件:**
- Modify: `types.ts:1-10`

- [ ] **Step 1: Add DayCountConvention type / 添加 DayCountConvention 类型**

```typescript
// types.ts
export type DayCountConvention = 360 | 365;
```

- [ ] **Step 2: Add dayCountConvention field to LoanParams / 在 LoanParams 中添加 dayCountConvention 字段**

```typescript
export interface LoanParams {
  amount: number;
  initialRate: number;
  tenureMonths: number;
  startDate: string;
  dayCountConvention: DayCountConvention;
  holidayShiftMode: 'BEFORE' | 'AFTER';
  adjustmentStrategy: 'CHANGE_INSTALLMENT' | 'CHANGE_TENURE';
}
```

---

## Task 2: Add Translation Keys / 添加翻译键值

**Files / 文件:**
- Modify: `translations.ts`

- [ ] **Step 1: Add English translations / 添加英文翻译 (约第17行)**

```typescript
// English section
dayCountBasis: 'Day Count Basis',
dayCountBasisTooltip: 'Determines the annual day count for interest calculation. 30/360 is standard for bank loans.',
actual365: 'Actual/365 (365 Days)',
thirty360: '30/360 (360 Days)',
```

- [ ] **Step 2: Add Chinese translations / 添加中文翻译 (约第123行)**

```typescript
// Chinese section
dayCountBasis: '年基准天数',
dayCountBasisTooltip: '决定利息计算的年基准天数。30/360是银行贷款标准。',
actual365: '实际/365 (365天)',
thirty360: '30/360 (360天)',
```

---

## Task 3: Update App State / 更新应用状态

**Files / 文件:**
- Modify: `App.tsx:16-23`

- [ ] **Step 1: Add default value to params state / 在 params 状态中添加默认值**

```typescript
const [params, setParams] = useState<LoanParams>({
  amount: 100000,
  initialRate: 5.0,
  tenureMonths: 12,
  startDate: new Date().toISOString().split('T')[0],
  dayCountConvention: 365,  // NEW / 新增 - 默认为365保持向后兼容
  holidayShiftMode: 'AFTER',
  adjustmentStrategy: 'CHANGE_INSTALLMENT',
});
```

---

## Task 4: Update ConfigurationPanel UI / 更新配置面板 UI

**Files / 文件:**
- Modify: `components/ConfigurationPanel.tsx`

- [ ] **Step 1: Read current file structure / 读取当前文件结构**
- [ ] **Step 2: Add Day Count Basis dropdown before Start Date field / 在 Start Date 字段前添加年基准天数下拉框**
- [ ] **Step 3: Add tooltip / 添加提示文字**

在 rate 字段后、startDate 字段前添加:

```typescript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {t.dayCountBasis}
    <Tooltip text={t.dayCountBasisTooltip} />
  </label>
  <select
    value={params.dayCountConvention}
    onChange={(e) => onChange({ ...params, dayCountConvention: Number(e.target.value) as 360 | 365 })}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    <option value={365}>{t.actual365}</option>
    <option value={360}>{t.thirty360}</option>
  </select>
</div>
```

---

## Task 5: Update Calculator Engine / 更新计算引擎

**Files / 文件:**
- Modify: `services/loanCalculator.ts:112-120` 和 `line 226`

- [ ] **Step 1: Read current calculateSchedule function signature / 读取当前函数签名**

```typescript
export const calculateSchedule = (
  params: LoanParams,
  holidays: Holiday[],
  rateRanges: RateRange[],
  repayments: RepaymentEvent[],
  language: Language = 'en'
): { schedule: Installment[]; summary: Summary } => {
```

- [ ] **Step 2: Extract dayCountConvention from params / 从 params 中提取 dayCountConvention**

```typescript
const { amount, initialRate, tenureMonths, startDate, holidayShiftMode, adjustmentStrategy, dayCountConvention } = params;
```

- [ ] **Step 3: Update daily interest calculation (line ~226) / 更新日利息计算 (约第226行)**

```typescript
// 修改前 / Before:
const dailyInterest = currentBalance * (dailyRatePercent / 100) / 365;

// 修改后 / After:
const dailyInterest = currentBalance * (dailyRatePercent / 100) / dayCountConvention;
```

---

## Task 6: Update Documentation / 更新文档

**Files / 文件:**
- Modify: `docs/FUNCTIONAL-SPEC.md`, `docs/TECHNICAL-SPEC.md`

- [ ] **Step 1: Add to FUNCTIONAL-SPEC.md section 2.1.1 / 在 FUNCTIONAL-SPEC.md 第2.1.1节添加**

在参数表格中添加一行：
| 年基准天数 (Day Count Basis) | 360 \| 365 | 计算利息的年基准天数 | 365 |

- [ ] **Step 2: Add to TECHNICAL-SPEC.md section 3.1 / 在 TECHNICAL-SPEC.md 第3.1节添加**

```typescript
dayCountConvention: DayCountConvention;
```

---

## Task 7: Verify Build / 验证构建

- [ ] **Step 1: Run build / 运行构建**

```bash
npm run build
```

Expected / 预期: Success with no errors / 构建成功无错误

- [ ] **Step 2: Start dev server and test / 启动开发服务器并测试**

```bash
npm run dev
```

---

## Task 8: Commit / 提交

- [ ] **Step 1: Add and commit changes / 添加并提交更改**

```bash
git add types.ts translations.ts App.tsx components/ConfigurationPanel.tsx services/loanCalculator.ts docs/
git commit -m "feat: Add 30/360 and Actual/365 day count convention support"
```

---

## Files Summary / 文件汇总

| Task | Files / 文件 | Description / 描述 |
|------|-------------|-------------------|
| 1 | `types.ts` | Add type definition / 添加类型定义 |
| 2 | `translations.ts` | Add translations / 添加翻译 |
| 3 | `App.tsx` | Add default value / 添加默认值 |
| 4 | `components/ConfigurationPanel.tsx` | Add UI dropdown / 添加下拉框 |
| 5 | `services/loanCalculator.ts` | Update calculation / 更新计算 |
| 6 | `docs/FUNCTIONAL-SPEC.md`, `docs/TECHNICAL-SPEC.md` | Update docs / 更新文档 |
| 7-8 | Build, test, commit / 构建、测试、提交 |
