# 不规则还款14分段明细增强计划

## 1. 需求分析

### 1.1 功能需求
- 对于不规则还款14，在“显示分段明细”功能中，当发生本金还款（利随本清）时：
  1. 增加一条利随本清明细：展示“5月10日 - 5月18日 ， 基数: $30000.00 ，天数 8 ，利息 $32.88”
  2. 增加“未到期利息”明细：展示“5月10日 - 5月18日 ， 基数: $70000.00 ，天数 8 ，利息 $76.71”

### 1.2 业务逻辑
- **利随本清**：本金还款时，仅归还本次还款本金对应的利息
- **未到期利息**：剩余本金对应的利息，需要在后续的利息还款日支付
- **计算示例**：
  - 总利息：$109.59（100000 × 5% ÷ 365 × 8）
  - 利随本清利息：$32.88（30000 × 5% ÷ 365 × 8）
  - 未到期利息：$76.71（109.59 - 32.88）

## 2. 代码分析

### 2.1 相关文件
- `services/calculators/irregularRepayment14Calculator.ts`：核心计算器实现
- `services/calculators/types.ts`：类型定义
- `services/translations/index.ts`：翻译文件

### 2.2 关键代码分析

#### 2.2.1 分段明细生成逻辑（第115-131行）
```typescript
if (segmentDaysCounter > 0) {
  schedule.push({
    type: 'SEGMENT',
    period: i,
    nominalDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
    actualDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
    segmentStartDate: dateOps.format(lastEventDate, 'yyyy-MM-dd'),
    segmentEndDate: dateOps.format(actualDate, 'yyyy-MM-dd'),
    daysCount: segmentDaysCounter,
    principal: 0,
    interest: segmentInterest,
    total: 0,
    outstandingBalance: currentBalance,
    effectiveRate: activeSegmentRate,
    notes: [`${t.noteBasis}: $${currentBalance.toFixed(2)}`]
  });
}
```

#### 2.2.2 利随本清计算逻辑（第152-154行）
```typescript
const dailyRate = params.initialRate / 100 / params.dayCountConvention;
const dailyInterest = principalPayment * dailyRate;
interestPayment = dailyInterest * daysCount;
```

#### 2.2.3 本金还款处理（第143-166行）
```typescript
if (event.type === 'PRINCIPAL') {
  if (dateOps.isSameDay(event.date, loanEndDate) && event.amount === 0 && currentBalance > 0) {
    principalPayment = currentBalance;
    interestPayment = interestForPeriod;
    notes.push(t.loanEndRepayment);
  } else {
    principalPayment = event.amount;
    // 利随本清：仅归还本次还款本金对应的利息
    // 计算方式：还款本金 × 日利率 × 天数
    const dailyRate = params.initialRate / 100 / params.dayCountConvention;
    const dailyInterest = principalPayment * dailyRate;
    interestPayment = dailyInterest * daysCount;
    notes.push(t.principalRepayment);
  }
  // ...
}
```

## 3. 实现计划

### 3.1 步骤1：修改本金还款处理逻辑
- **文件**：`services/calculators/irregularRepayment14Calculator.ts`
- **修改点**：第143-166行
- **功能**：
  1. 计算利随本清利息（已实现）
  2. 计算未到期利息（新增）
  3. 生成利随本清分段明细（新增）
  4. 生成未到期利息分段明细（新增）

### 3.2 步骤2：更新翻译文件
- **文件**：`services/translations/index.ts`
- **修改点**：添加利随本清和未到期利息的翻译
- **功能**：提供相应的翻译文本

### 3.3 步骤3：更新测试用例
- **文件**：`__tests__/test-data/repayment-scheme/irregular-repayment-14-test1.md`
- **修改点**：更新预期结果，包含新的分段明细
- **功能**：验证新功能的正确性

### 3.4 步骤4：运行测试
- **命令**：`npm test`
- **功能**：验证修改是否正确

## 4. 技术实现细节

### 4.1 利随本清分段明细生成
- **时间范围**：与当前分段相同（如5月10日 - 5月18日）
- **基数**：本次还款本金（如$30000.00）
- **天数**：与当前分段相同（如8天）
- **利息**：利随本清利息（如$32.88）
- **备注**：添加“利随本清”说明

### 4.2 未到期利息分段明细生成
- **时间范围**：与当前分段相同（如5月10日 - 5月18日）
- **基数**：剩余本金（如$70000.00）
- **天数**：与当前分段相同（如8天）
- **利息**：未到期利息（如$76.71）
- **备注**：添加“未到期利息”说明

### 4.3 计算逻辑
- **利随本清利息**：`principalPayment × dailyRate × daysCount`
- **未到期利息**：`interestForPeriod - interestPayment`
- **剩余本金**：`currentBalance - principalPayment`

## 5. 风险评估

### 5.1 风险点
- **计算精度**：需要确保利息计算的精度
- **分段明细顺序**：需要确保分段明细的顺序正确
- **测试覆盖**：需要更新测试用例以覆盖新功能

### 5.2 解决方案
- **计算精度**：使用足够的小数位数进行计算，最后四舍五入
- **分段明细顺序**：按时间顺序生成分段明细
- **测试覆盖**：更新测试用例，验证新的分段明细

## 6. 预期效果

### 6.1 分段明细示例

**当前输出**：
- 5月10日 - 5月18日 ， 基数: $100000.00 ，天数 8，利息 $109.59

**预期输出**：
- 5月10日 - 5月18日 ， 基数: $100000.00 ，天数 8，利息 $109.59
- 5月10日 - 5月18日 ， 基数: $30000.00 ，天数 8，利息 $32.88 （利随本清）
- 5月10日 - 5月18日 ， 基数: $70000.00 ，天数 8，利息 $76.71 （未到期利息）

### 6.2 还款计划表变化
- 增加利随本清和未到期利息的明细
- 保持总利息和总还款金额不变
- 确保剩余本金计算正确

## 7. 实施时间表

1. **步骤1**：修改本金还款处理逻辑 - 10分钟
2. **步骤2**：更新翻译文件 - 5分钟
3. **步骤3**：更新测试用例 - 10分钟
4. **步骤4**：运行测试 - 5分钟

## 8. 结论

本计划通过修改不规则还款14计算器的分段明细生成逻辑，实现了利随本清的详细说明和未到期利息的展示功能。修改集中在核心计算器文件中，对其他模块影响较小，风险可控。通过更新测试用例，可以确保新功能的正确性。