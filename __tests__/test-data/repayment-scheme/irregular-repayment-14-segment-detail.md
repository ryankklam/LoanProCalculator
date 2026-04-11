---
title: 不规则还款14 - 分段明细测试
description: 测试利随本清和未到期利息的分段明细展示
priority: high
status: active
params:
  amount: 100000
  initialRate: 5.0
  tenureMonths: 12
  startDate: "2026-04-01"
  dayCountConvention: 365
  holidayShiftMode: "AFTER"
  adjustmentStrategy: "CHANGE_INSTALLMENT"
  repaymentScheme: "IRREGULAR_REPAYMENT_14"
  interestPaymentFrequency: "MONTHLY"
  interestPaymentDay: 10
repayments:
  - id: "1"
    date: "2026-05-18"
    amount: 30000
expected:
  totalInterest: 3693.15
  totalPaid: 103693.15
  installments:
    - actualDate: "2026-04-10"
      principal: 0
      interest: 123.29
      total: 123.29
      outstandingBalance: 100000
    - actualDate: "2026-05-10"
      principal: 0
      interest: 410.96
      total: 410.96
      outstandingBalance: 100000
    - actualDate: "2026-05-18"
      principal: 30000
      interest: 32.88
      total: 30032.88
      outstandingBalance: 70000
    - actualDate: "2026-06-10"
      principal: 0
      interest: 297.26
      total: 297.26
      outstandingBalance: 70000
    - actualDate: "2027-04-01"
      principal: 70000
      interest: 210.96
      total: 70210.96
      outstandingBalance: 0
  segments:
    - period: 3
      segmentStartDate: "2026-05-10"
      segmentEndDate: "2026-05-18"
      daysCount: 8
      principal: 0
      interest: 109.59
      outstandingBalance: 100000
      notes: ["基数: $100000.00"]
    - period: 3
      segmentStartDate: "2026-05-10"
      segmentEndDate: "2026-05-18"
      daysCount: 8
      principal: 0
      interest: 32.88
      outstandingBalance: 100000
      notes: ["利随本清", "基数: $30000.00"]
    - period: 3
      segmentStartDate: "2026-05-10"
      segmentEndDate: "2026-05-18"
      daysCount: 8
      principal: 0
      interest: 76.71
      outstandingBalance: 70000
      notes: ["基数: $70000.00", "未到期利息"]
---

# 不规则还款14 - 分段明细测试

## 测试场景

### 业务背景

测试不规则还款14的“显示分段明细”功能，特别是利随本清和未到期利息的展示。

### 测试参数

* **贷款金额**: 100,000

* **期限**: 12个月

* **年利率**: 5%

* **年基准天数**: 365

* **起息日**: 2026-04-01

* **利息还款**: 每月10日

* **本金还款**: 2026-05-18 归还 30,000

## 分段明细预期结果

### 第3期（2026-05-18 本金还款）

#### 1. 原始分段明细

* **日期范围**: 2026-05-10 至 2026-05-18

* **天数**: 8天

* **基数**: $100,000.00

* **利息**: 100,000 × 5% ÷ 365 × 8 = $109.59

* **备注**: Basis: $100000.00

#### 2. 利随本清明细（新增）

* **日期范围**: 2026-05-10 至 2026-05-18

* **天数**: 8天

* **基数**: $30,000.00（本次还款本金）

* **利息**: 30,000 × 5% ÷ 365 × 8 = $32.88

* **备注**: Basis: $30000.00, 利随本清

#### 3. 未到期利息明细（新增）

* **日期范围**: 2026-05-10 至 2026-05-18

* **天数**: 8天

* **基数**: $70,000.00（剩余本金）

* **利息**: 70,000 × 5% ÷ 365 × 8 = $76.71（或 109.59 - 32.88 = $76.71）

* **备注**: Basis: $70000.00, 未到期利息

## 关键验证点

1. **利随本清明细**: 正确展示利随本清的分段明细，包含正确的基数和利息
2. **未到期利息明细**: 正确展示未到期利息的分段明细，包含正确的基数和利息
3. **计算准确性**: 利随本清利息 + 未到期利息 = 原始分段利息
4. **分段顺序**: 分段明细的顺序正确，先显示原始分段，再显示利随本清，最后显示未到期利息
5. **备注信息**: 正确显示备注信息，包括基数和说明

## 计算验证

### 利随本清利息计算

* 公式: 还款本金 × 日利率 × 天数

* 计算: 30,000 × (5% ÷ 365) × 8 = 32.87671232876713 ≈ 32.88

### 未到期利息计算

* 公式: 原始分段利息 - 利随本清利息

* 计算: 109.5890410958904 - 32.87671232876713 = 76.71232876712327 ≈ 76.71

### 验证

* 32.88 + 76.71 = 109.59，与原始分段利息一致

* 30,000 + 70,000 = 100,000，与原始基数一致

## 备注

* 所有计算均采用“算头不算尾”的天数计算方法

* 利息计算精确到小数点后两位

* 分段明细的顺序应该保持一致，便于用户理解

* 利随本清和未到期利息的分段明细应该在原始分段明细之后显示

