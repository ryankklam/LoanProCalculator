# LoanPro Calculator - 功能说明文档 (Functional Specification)

> **文档版本**: 1.0.0  
> **更新日期**: 2026-03-28  
> **项目名称**: LoanPro Calculator  
> **项目类型**: React Web Application (SPA)

---

## 1. 项目概述

### 1.1 产品简介

LoanPro Calculator 是一款专业级贷款还款计算器，基于 React 19 + TypeScript 构建。它能够处理复杂的金融场景，包括节假日调休、浮动利率、以及不规则的额外还款，并提供完整的英文/中文双语界面支持。

### 1.2 核心价值

- **精确计算**: 采用 Actual/365 日计数惯例，确保每日利息精确计算
- **灵活配置**: 支持两种重算策略，适应不同的贷款产品特性
- **透明展示**: 分段明细功能让用户清晰看到计算过程的每一个细节
- **多语言支持**: 中英文界面无缝切换，满足不同用户群体需求

---

## 2. 功能模块

### 2.1 贷款参数配置 (ConfigurationPanel)

#### 2.1.1 输入参数

| 参数名称 | 数据类型 | 说明 | 默认值 |
|---------|---------|------|-------|
| 贷款金额 (Loan Amount) | number | 贷款本金总额 | 100,000 |
| 年利率 (Rate) | number (%) | 名义年利率 | 5.0% |
| 期限 (Tenure) | number | 贷款总时长（月） | 12 |
| 起息日 (Start Date) | string (YYYY-MM-DD) | 贷款发放日期 | 当前日期 |
| 年基准天数 (Day Count Basis) | 360 \| 365 | 计算利息的年基准天数。30/360 为银行标准，Actual/365 为精确计算 | 365 |

#### 2.1.2 全局策略配置

**节假日调整模式 (Holiday Shift Mode)**

| 选项 | 值 | 说明 |
|-----|-----|------|
| 下一工作日 | `AFTER` | 后顺 (Following Convention) |
| 上一工作日 | `BEFORE` | 前顺 (Preceding Convention) |

**重算策略 (Adjustment Strategy)**

| 策略 | 值 | 说明 | 典型场景 |
|-----|-----|------|---------|
| 变额不变期 | `CHANGE_INSTALLMENT` | 保持到期日固定，调整月供金额 | 固定期限贷款 |
| 变期不变额 | `CHANGE_TENURE` | 保持月供金额固定，延长/缩短期限 | 灵活还款贷款 |

### 2.2 事件管理 (EventsPanel)

#### 2.2.1 节假日区间管理

- **功能**: 定义银行休息的日期范围
- **数据结构**:
  ```typescript
  interface Holiday {
    id: string;
    startDate: string;  // YYYY-MM-DD
    endDate: string;    // YYYY-MM-DD
    name: string;       // 节假日名称（可选）
  }
  ```
- **Excel 导入**:
  - 提供模板下载功能
  - 支持批量导入节假日数据
  - 自动解析 Excel 文件格式

#### 2.2.2 利率调整区间

- **功能**: 定义利率变更的时间范围
- **数据结构**:
  ```typescript
  interface RateRange {
    id: string;
    startDate: string;  // YYYY-MM-DD
    endDate?: string;   // 可选，不填则延续到下一区间或贷款结束
    rate: number;       // 百分比
  }
  ```
- **特性**:
  - 支持无缝衔接多个利率区间
  - 最后一个区间不设置结束日期时，将延续至贷款结束

#### 2.2.3 额外还款

- **功能**: 添加一次性大额还款
- **数据结构**:
  ```typescript
  interface RepaymentEvent {
    id: string;
    date: string;      // YYYY-MM-DD
    amount: number;    // 还款金额
  }
  ```
- **效果**: 立即减少本金余额

### 2.3 核心计算引擎 (loanCalculator.ts)

#### 2.3.1 计算流程

```
输入参数验证
    ↓
初始化状态 (本金余额、利率、月供)
    ↓
主循环 (最多 600 次迭代)
    ├── 计算nominalDate (起息日 + n个月)
    ├── 节假日调休处理
    ├── 利率变更检测
    ├── 日复利计算 (逐日)
    │   ├── 利率变更分段
    │   └── 额外还款分段
    ├── 分段利息汇总
    ├── 计算当期本金与利息分配
    └── 更新余额状态
    ↓
生成还款计划 & 汇总统计
```

#### 2.3.2 计算公式

**PMT 月供公式 (等额本息)**

```
PMT = (P × r) / (1 - (1 + r)^(-n))

其中:
- P = 本金 (Principal)
- r = 月利率 = 年利率 / 12 / 100
- n = 剩余期限月数
```

**日利息计算**

```
Daily Interest = Balance × (Annual Rate / 100) / 365
```

**实际利率计算**

```
Effective Annual Rate = (Period Interest / Accumulated Balance) × 365 × 100
```

#### 2.3.3 分段计算机制

当还款周期内发生利率变更或额外还款时，系统会将该周期拆分为多个分段：

| 分段类型 | 说明 | 显示颜色 |
|---------|------|---------|
| SEGMENT | 分段明细，显示期间利息累计 | 灰色 |
| REPAYMENT | 额外还款记录 | 绿色 |
| INSTALLMENT | 正常月供 | 默认色 |

### 2.4 还款计划展示

#### 2.4.1 KPI 概览卡片

| 指标 | 说明 |
|-----|------|
| 还款总额 | 本金 + 利息总计 |
| 利息总额 | 累计支付利息 |
| 最后还款日 | 贷款结清日期 |

#### 2.4.2 图表可视化 (SummaryChart)

**月度视图 (Monthly View)**

- 柱状图: 每期本金 vs 利息分解
- 折线图: 剩余本金余额走势

**累计视图 (Cumulative View)**

- 面积图: 累计还款总额随时间增长

#### 2.4.3 计划明细表 (ScheduleTable)

| 列名 | 说明 |
|-----|------|
| # | 期数 |
| Date | 实际还款日期 |
| Days | 计息天数 |
| Eff. Rate | 当期实际年化利率 |
| Principal | 本金 |
| Interest | 利息 |
| Total | 还款总额 |
| Balance | 剩余余额 |
| Orig | 原定还款日 |

**过滤与显示控制**

- 按日期筛选显示范围
- 显示/隐藏额外还款记录
- 显示/隐藏分段明细

#### 2.4.4 CSV 导出

导出内容包括:
- 所有分期明细
- 分段计算详情
- 利率变更记录
- 节假日调整说明

---

## 3. 业务规则

### 3.1 节假日处理规则

1. 若还款日落在节假日期间，自动调休到最近工作日
2. 调休方向由 `holidayShiftMode` 参数决定
3. 调休信息记录在备注中（"Deferred from" / "Preponed from"）

### 3.2 利率变更处理规则

**变额不变期策略 (CHANGE_INSTALLMENT)**:
- 重算月供金额
- 保持到期日不变
- 备注: "Rate changed to X% - PMT Recalculated"

**变期不变额策略 (CHANGE_TENURE)**:
- 保持月供金额不变
- 自动延长/缩短贷款期限
- 备注: "Rate changed to X% - PMT Fixed"

### 3.3 额外还款处理规则

| 策略 | 处理方式 |
|-----|---------|
| CHANGE_INSTALLMENT | 减少本金后重算月供（期限不变） |
| CHANGE_TENURE | 减少本金，保持月供不变（期限缩短） |

### 3.4 提前结清规则

- 当剩余本金 + 当期利息 ≤ 月供金额时，执行提前结清
- 结清金额 = 剩余本金 + 当期利息
- 结清后余额归零，循环结束

---

## 4. 国际化 (i18n)

### 4.1 支持语言

| 语言 | 代码 | 格式 |
|-----|------|------|
| English | `en` | MM/dd/yyyy, $1,234.56 |
| 中文 | `cn` | yyyy-MM-dd, ¥1,234.56 |

### 4.2 语言切换

- 页面顶部提供语言切换按钮
- 支持运行时无缝切换
- 切换后自动重新计算，确保备注语言正确

---

## 5. 数据流

```
用户输入参数
    ↓
State (params, holidays, rateRanges, repayments)
    ↓
handleCalculate() 触发
    ↓
calculateSchedule() 核心计算
    ↓
{ schedule: Installment[], summary: Summary }
    ↓
UI 更新 (KPI卡片、图表、表格)
```

---

## 6. 错误处理

| 场景 | 处理方式 |
|-----|---------|
| Excel 文件解析失败 | 显示错误提示 "Failed to parse file. Please check the format." |
| 贷款金额 ≤ 0 | PMT 返回 0 |
| 利率 = 0 | 简化为 本金/期限 |
| 余额 < 0.01 | 归零处理 |
| 迭代超限 (600次) | 强制终止循环 |

---

## 7. 边界条件

- **期限**: 支持 1-600 个月
- **金额**: 正数，精度至小数点后2位
- **利率**: 0-100%
- **日期**: ISO 8601 格式 (YYYY-MM-DD)
- **节假日**: 支持跨日区间定义

---

## 8. 未来扩展方向

1. **多币种支持**: 汇率转换功能
2. **还款频率**: 支持周供、双周供等非月供选项
3. **图表导出**: 直接导出图表为图片
4. **预设模板**: 常见贷款产品模板
5. **对比功能**: 多方案并排比较
6. **数据持久化**: 本地存储或云端同步
