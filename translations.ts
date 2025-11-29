export type Language = 'en' | 'cn';

export const dictionary = {
  en: {
    appTitle: 'LoanPro',
    appSubtitle: 'Calculator',
    methodology: 'Straight Line Method • Actual/365',
    
    // Config Panel
    loanDetails: 'Loan Details',
    loanAmount: 'Loan Amount',
    loanAmountTooltip: 'The total principal amount borrowed from the bank.',
    rate: 'Rate (%)',
    rateTooltip: 'The annual nominal interest rate used for daily interest calculation (Actual/365).',
    tenure: 'Tenure',
    tenureTooltip: 'The total duration of the loan in months.',
    startDate: 'Start Date',
    startDateTooltip: 'The date when the loan is disbursed. The first installment is usually due one month after this date.',
    holidayAdjustment: 'Holiday Adjustment',
    holidayAdjustmentTooltip: "Determines how payment dates are shifted if they fall on a holiday defined in the Events panel. 'Next Business Day' moves forward, 'Previous' moves backward.",
    recalculationStrategy: 'Recalculation Strategy',
    recalculationStrategyTooltip: "Defines behavior when Rate Changes or Extra Repayments occur. 'Variable Installment' changes the monthly payment amount to keep the tenure fixed. 'Variable Tenure' keeps the payment amount fixed, shortening or extending the loan duration.",
    
    // Options
    nextBusinessDay: 'Next Business Day (Following)',
    prevBusinessDay: 'Previous Business Day (Preceding)',
    varInstallment: 'Variable Installment',
    varTenure: 'Variable Tenure',
    varInstallmentDesc: 'Keeps the end date fixed. Monthly payment changes.',
    varTenureDesc: 'Keeps monthly payment fixed. End date changes.',

    // Events Panel
    holidayIntervals: 'Holiday Intervals',
    holidayIntervalsTooltip: 'Specify date ranges when the bank is closed (e.g., National Holidays). Payments falling on these dates will be shifted to the nearest business day according to your Global Configuration.',
    holidayNamePlaceholder: 'Holiday Name (Optional)',
    noHolidays: 'No holidays added',
    
    rateIntervals: 'Interest Rate Intervals',
    rateIntervalsTooltip: "Define periods where the interest rate changes. The schedule will recalculate daily interest. If 'Variable Installment' is active, the monthly payment will change for the remaining tenure.",
    ratePlaceholder: 'Rate %',
    noRates: 'No custom rates added',

    extraRepayments: 'Extra Repayments',
    extraRepaymentsTooltip: 'Add lump sum payments that reduce the principal immediately. Depending on your Strategy, this will either reduce your future monthly payments or shorten the loan tenure.',
    amountPlaceholder: 'Amount',
    noRepayments: 'No extra repayments',
    add: 'Add',

    // Buttons
    generatePlan: 'Generate Repayment Plan',
    exportCsv: 'CSV',
    toggleLang: 'Switch to Chinese',

    // Summary
    totalRepayment: 'Total Repayment',
    totalInterest: 'Total Interest',
    lastPayment: 'Last Payment',
    scheduleProjection: 'Schedule Projection',
    repaymentSchedule: 'Repayment Schedule',

    // Table
    hideRepayments: 'Hide Repayments',
    showRepayments: 'Show Repayments',
    hideBreakdown: 'Hide Breakdown',
    showBreakdown: 'Show Breakdown',
    
    // Table Headers
    colPeriod: '#',
    colDate: 'Date',
    colDays: 'Days',
    colEffRate: 'Eff. Rate',
    colPrincipal: 'Principal',
    colInterest: 'Interest',
    colTotal: 'Total',
    colBalance: 'Balance',
    colOrig: 'Orig',
    
    // CSV Specific
    csvType: 'Type',
    csvPeriod: 'Period',
    csvDate: 'Date',
    csvEndDate: 'End Date',
    csvDays: 'Days',
    csvEffRate: 'Effective Rate (%)',
    csvPrincipal: 'Principal / Basis',
    csvInterest: 'Interest',
    csvTotal: 'Total Payment',
    csvBalance: 'Balance',
    csvNotes: 'Notes',
    
    // Calculation Notes
    noteDeferred: 'Deferred',
    notePreponed: 'Preponed',
    noteFrom: 'from',
    noteHoliday: 'Holiday',
    noteRateChanged: 'Rate changed to',
    notePmtRecalculated: 'PMT Recalculated',
    notePmtFixed: 'PMT Fixed',
    noteBasis: 'Basis',
    noteExtraRepayment: 'Extra Repayment',
    noteTenureExtended: 'Tenure Extended',
    notePaidOffEarly: 'Paid Off Early',
  },
  cn: {
    appTitle: '贷款',
    appSubtitle: '计算器',
    methodology: '等额本息 • 年基准天数365',

    // Config Panel
    loanDetails: '贷款详情',
    loanAmount: '贷款金额',
    loanAmountTooltip: '向银行借款的总本金金额。',
    rate: '年利率 (%)',
    rateTooltip: '用于每日利息计算的名义年利率 (Actual/365)。',
    tenure: '期限 (月)',
    tenureTooltip: '贷款的总时长（以月为单位）。',
    startDate: '起息日',
    startDateTooltip: '贷款发放日期。通常第一期还款日为此日期后一个月。',
    holidayAdjustment: '节假日调整',
    holidayAdjustmentTooltip: '确定还款日若落在节假日（在事件面板定义）时如何调整。“后顺”顺延至下一工作日，“前顺”提前至上一工作日。',
    recalculationStrategy: '重算策略',
    recalculationStrategyTooltip: '定义当发生利率变更或提前还款时的行为。“变额不变期”改变月供金额以保持期限不变。“变期不变额”保持月供不变，从而缩短或延长贷款期限。',

    // Options
    nextBusinessDay: '下一工作日 (后顺)',
    prevBusinessDay: '上一工作日 (前顺)',
    varInstallment: '变额不变期 (Variable Installment)',
    varTenure: '变期不变额 (Variable Tenure)',
    varInstallmentDesc: '保持结束日期固定。月供金额变化。',
    varTenureDesc: '保持月供金额固定。结束日期变化。',

    // Events Panel
    holidayIntervals: '节假日区间',
    holidayIntervalsTooltip: '指定银行休息的日期范围（如法定节假日）。落在这些日期的还款将根据您的全局配置调整到最近的工作日。',
    holidayNamePlaceholder: '节日名称 (选填)',
    noHolidays: '未添加节假日',

    rateIntervals: '利率调整区间',
    rateIntervalsTooltip: '定义利率发生变化的期间。还款计划将重新计算每日利息。如果启用“变额不变期”，剩余期限的月供将发生变化。',
    ratePlaceholder: '利率 %',
    noRates: '未添加自定义利率',

    extraRepayments: '提前还款',
    extraRepaymentsTooltip: '添加一次性大额还款，这将立即减少本金。根据您的策略，这将减少未来的月供或缩短贷款期限。',
    amountPlaceholder: '金额',
    noRepayments: '无提前还款',
    add: '添加',

    // Buttons
    generatePlan: '生成还款计划',
    exportCsv: '导出 CSV',
    toggleLang: 'Switch to English',

    // Summary
    totalRepayment: '还款总额',
    totalInterest: '利息总额',
    lastPayment: '最后还款日',
    scheduleProjection: '计划走势',
    repaymentSchedule: '还款计划表',

    // Table
    hideRepayments: '隐藏还款记录',
    showRepayments: '显示还款记录',
    hideBreakdown: '隐藏分段明细',
    showBreakdown: '显示分段明细',

    // Table Headers
    colPeriod: '期数',
    colDate: '日期',
    colDays: '天数',
    colEffRate: '实际利率',
    colPrincipal: '本金',
    colInterest: '利息',
    colTotal: '合计',
    colBalance: '余额',
    colOrig: '原定',

    // CSV Specific
    csvType: '类型',
    csvPeriod: '期数',
    csvDate: '日期',
    csvEndDate: '结束日期',
    csvDays: '天数',
    csvEffRate: '实际利率 (%)',
    csvPrincipal: '本金 / 基数',
    csvInterest: '利息',
    csvTotal: '付款总额',
    csvBalance: '余额',
    csvNotes: '备注',

    // Calculation Notes
    noteDeferred: '顺延',
    notePreponed: '提前',
    noteFrom: '自',
    noteHoliday: '节假日',
    noteRateChanged: '利率变更为',
    notePmtRecalculated: '月供重算',
    notePmtFixed: '月供固定',
    noteBasis: '基数',
    noteExtraRepayment: '提前还款',
    noteTenureExtended: '期限延长',
    notePaidOffEarly: '提前还清',
  }
};