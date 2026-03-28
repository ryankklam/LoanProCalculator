# LoanPro Calculator - 架构设计文档 (Technical Specification)

> **文档版本**: 1.0.0  
> **更新日期**: 2026-03-28  
> **项目名称**: LoanPro Calculator  
> **项目类型**: React Web Application (SPA)

---

## 1. 技术栈概览

| 层级 | 技术选型 | 版本 | 说明 |
|-----|---------|------|------|
| **框架** | React | 19.x | UI 框架，支持 Hooks |
| **语言** | TypeScript | 5.8 | 类型安全 |
| **构建工具** | Vite | 6.2 | 快速开发与构建 |
| **样式** | Tailwind CSS | - | 实用优先 CSS (CDN) |
| **图表** | Recharts | 3.5 | 数据可视化 |
| **日期处理** | date-fns | 4.1 | 轻量级日期库 |
| **图标** | Lucide React | - | 开源图标库 |
| **Excel处理** | xlsx (SheetJS) | 0.18.5 | Excel 导入/导出 |

---

## 2. 项目结构

```
LoanProCalculator-1/
├── docs/                        # 项目文档
│   ├── FUNCTIONAL-SPEC.md       # 功能说明文档
│   └── TECHNICAL-SPEC.md        # 架构设计文档
│
├── components/                  # React 组件
│   ├── ConfigurationPanel.tsx   # 贷款参数配置面板
│   ├── EventsPanel.tsx          # 事件管理面板
│   ├── ScheduleTable.tsx        # 还款计划表格
│   └── SummaryChart.tsx         # 数据可视化图表
│
├── contexts/
│   └── LanguageContext.tsx      # 国际化上下文
│
├── services/
│   ├── loanCalculator.ts        # 核心计算引擎
│   └── excelHandler.ts          # Excel 处理服务
│
├── App.tsx                      # 主应用组件
├── index.tsx                    # 入口文件
├── index.html                   # HTML 模板
├── types.ts                     # TypeScript 类型定义
├── translations.ts              # 国际化翻译字典
├── utils.ts                     # 工具函数
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── vite.config.ts               # Vite 构建配置
├── README.md                    # 项目说明
├── PROMPTS.md                   # 开发提示历史
└── metadata.json                # 项目元数据
```

---

## 3. 核心模块设计

### 3.1 类型系统 (types.ts)

```typescript
// 贷款参数
interface LoanParams {
  amount: number;                    // 本金
  initialRate: number;                // 初始利率 (%)
  tenureMonths: number;               // 期限（月）
  startDate: string;                 // 起息日 (YYYY-MM-DD)
  holidayShiftMode: 'BEFORE' | 'AFTER';  // 节假日调休模式
  adjustmentStrategy: 'CHANGE_INSTALLMENT' | 'CHANGE_TENURE'; // 重算策略
}

// 节假日
interface Holiday {
  id: string;
  startDate: string;
  endDate: string;
  name: string;
}

// 利率区间
interface RateRange {
  id: string;
  startDate: string;
  endDate?: string;
  rate: number;
}

// 额外还款
interface RepaymentEvent {
  id: string;
  date: string;
  amount: number;
}

// 还款计划行
interface Installment {
  type: 'INSTALLMENT' | 'REPAYMENT' | 'SEGMENT';
  period: number;
  nominalDate: string;
  actualDate: string;
  segmentStartDate?: string;
  segmentEndDate?: string;
  daysCount: number;
  principal: number;
  interest: number;
  total: number;
  outstandingBalance: number;
  effectiveRate: number;
  notes: string[];
}

// 汇总统计
interface Summary {
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  lastPaymentDate: string;
}
```

### 3.2 计算引擎 (services/loanCalculator.ts)

#### 3.2.1 导出函数

```typescript
export const calculateSchedule = (
  params: LoanParams,
  holidays: Holiday[],
  rateRanges: RateRange[],
  repayments: RepaymentEvent[],
  language: Language
): { schedule: Installment[]; summary: Summary }
```

#### 3.2.2 内部辅助函数

| 函数 | 用途 |
|-----|------|
| `parseISO()` | 解析 YYYY-MM-DD 格式日期 |
| `startOfDay()` | 获取日期当天开始时间 |
| `isHoliday()` | 判断日期是否在节假日区间 |
| `getNextBusinessDay()` | 获取下一工作日 |
| `getPreviousBusinessDay()` | 获取上一工作日 |
| `getRateForDay()` | 获取指定日期的适用利率 |
| `calculatePMT()` | 计算等额本息月供 |
| `calculateSchedule()` | 主计算函数 |

#### 3.2.3 算法流程图

```
                    ┌─────────────────┐
                    │  开始计算       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  初始化状态     │
                    │  - balance      │
                    │  - rate         │
                    │  - pmt          │
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │  主循环 (balance > 0)      │
              │  最多 600 次迭代           │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  1. 计算nominalDate       │
              │     = startDate + n月     │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  2. 节假日调休             │
              │     BEFORE → 前一天        │
              │     AFTER  → 后一天        │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  3. 利率变更检测            │
              │  - 检测期初利率变化        │
              │  - 更新PMT (策略决定)       │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  4. 日复利循环              │
              │  for d = 1 to daysCount     │
              │  ├─ 利率变更? → 新分段     │
              │  └─ 额外还款? → 处理还款   │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  5. 计算Installment        │
              │  - 利息优先                │
              │  - 剩余冲减本金            │
              └──────────────┬─────────────┘
                             │
              ┌──────────────▼──────────────┐
              │  6. 更新状态                │
              │  - balance -= principal    │
              │  - totalInterest += int    │
              └──────────────┬─────────────┘
                             │
                    ┌────────▼────────┐
                    │ balance ≤ 0?   │
                    ├─ YES → 结束   │
                    └─ NO  → 继续   │
```

### 3.3 Excel 处理 (services/excelHandler.ts)

#### 3.3.1 功能

1. **模板下载**: 生成节假日导入模板
2. **文件解析**: 读取用户上传的 Excel 文件

#### 3.3.2 Excel 格式

| 列名 | 类型 | 说明 |
|-----|------|------|
| StartDate | Date | 开始日期 |
| EndDate | Date | 结束日期 |
| Name | String | 节假日名称（可选） |

### 3.4 组件架构

```
App
├── Header (内联)
├── ConfigurationPanel (props: params, onChange)
├── EventsPanel (props: holidays, rateChanges, repayments, ...)
│   ├── HolidaySection
│   ├── RateSection
│   └── RepaymentSection
├── GenerateButton (onClick → handleCalculate)
├── KPI Cards
│   ├── TotalRepayment Card
│   ├── TotalInterest Card
│   └── LastPayment Card
├── SummaryChart (props: data, title)
└── ScheduleTable (props: schedule)
    ├── FilterControls
    ├── ToggleControls
    └── DataGrid
```

### 3.5 状态管理

采用 React Hooks 本地状态管理，无 Redux/MobX 依赖:

```typescript
// App.tsx 中的状态
const [params, setParams] = useState<LoanParams>({...});
const [holidays, setHolidays] = useState<Holiday[]>([]);
const [rateRanges, setRateRanges] = useState<RateRange[]>([]);
const [repayments, setRepayments] = useState<RepaymentEvent[]>([]);
const [calculationResult, setCalculationResult] = useState({...});
```

### 3.6 国际化 (LanguageContext)

```typescript
interface LanguageContextValue {
  language: 'en' | 'cn';
  setLanguage: (lang: 'en' | 'cn') => void;
  t: TranslationKeys;  // 当前语言的翻译字典
  locale: string;      // 区域格式 ('en-US' | 'zh-CN')
}
```

---

## 4. 数据流设计

### 4.1 单向数据流

```
┌─────────────────────────────────────────────────────────────┐
│                        User Input                           │
│  (ConfigurationPanel, EventsPanel)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ params / holidays / rateRanges / repayments
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     App.tsx State                           │
│  useState()                                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ handleCalculate()
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   loanCalculator.ts                         │
│  calculateSchedule()                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ { schedule, summary }
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI Rendering                           │
│  (KPI Cards, SummaryChart, ScheduleTable)                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 计算触发时机

| 触发条件 | 行为 |
|---------|------|
| 点击"生成还款计划"按钮 | 手动触发完整计算 |
| 语言切换 | 重新计算（更新备注语言） |

---

## 5. API 设计

本项目为纯前端应用，无后端 API。但组件间通过 props 传递数据:

### 5.1 Props 接口

```typescript
// ConfigurationPanel
interface ConfigurationPanelProps {
  params: LoanParams;
  onChange: (params: LoanParams) => void;
}

// EventsPanel
interface EventsPanelProps {
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  rateChanges: RateRange[];
  setRateChanges: React.Dispatch<React.SetStateAction<RateRange[]>>;
  repayments: RepaymentEvent[];
  setRepayments: React.Dispatch<React.SetStateAction<RepaymentEvent[]>>;
}

// SummaryChart
interface SummaryChartProps {
  data: Installment[];
  title: string;
}

// ScheduleTable
interface ScheduleTableProps {
  schedule: Installment[];
}
```

---

## 6. 样式设计

### 6.1 Tailwind CSS 配置

使用 CDN 方式引入，无需构建配置:

```html
<!-- index.html -->
<script src="https://cdn.tailwindcss.com"></script>
```

### 6.2 主题色系

| 用途 | 颜色 | Tailwind 类 |
|-----|------|-------------|
| 主色 | 蓝色 | `blue-600`, `blue-700` |
| 成功 | 绿色 | `green-100`, `green-700` |
| 警告 | 红色 | `red-100`, `red-700` |
| 信息 | 蓝色 | `blue-100`, `blue-700` |
| 中性 | 灰色 | `gray-50` ~ `gray-900` |

### 6.3 组件样式

| 组件 | 样式类 | 说明 |
|-----|-------|------|
| KPI Card | `bg-white p-5 rounded-xl shadow-sm border border-gray-200` | 白色卡片带边框 |
| Primary Button | `bg-blue-600 hover:bg-blue-700` | 蓝色主按钮 |
| Input | `border border-gray-300 rounded-lg` | 标准输入框 |

---

## 7. 图表设计 (Recharts)

### 7.1 图表类型

| 视图 | 图表类型 | 数据系列 |
|-----|---------|---------|
| 月度视图 | ComposedChart | Principal (Bar), Interest (Bar), Balance (Line) |
| 累计视图 | AreaChart | Cumulative Total |

### 7.2 配置

```typescript
<ComposedChart>
  <Bar dataKey="principal" stackId="a" fill="#10b981" />
  <Bar dataKey="interest" stackId="a" fill="#ef4444" />
  <Line type="monotone" dataKey="balance" stroke="#3b82f6" />
</ComposedChart>
```

---

## 8. 工具函数 (utils.ts)

| 函数 | 用途 |
|-----|------|
| `formatCurrency()` | 格式化货币显示 |
| `formatDate()` | 格式化日期显示 |
| `formatPercent()` | 格式化百分比 |

---

## 9. 构建与部署

### 9.1 开发环境

```bash
npm install
npm run dev  # 启动 Vite 开发服务器
```

### 9.2 生产构建

```bash
npm run build     # 构建生产版本
npm run preview   # 预览生产版本
```

### 9.3 部署方式

构建产物位于 `dist/` 目录，可部署至任意静态托管服务:
- GitHub Pages
- Vercel
- Netlify
- AWS S3 + CloudFront

---

## 10. 性能考量

### 10.1 计算性能

- **日复利计算**: 12期贷款约 3650 次迭代
- **安全上限**: 600 次月供迭代，防止死循环
- **精度**: 使用 `number` 类型，余额精度阈值 0.01

### 10.2 UI 性能

- React 19 优化渲染
- 图表数据过滤 (`data.filter(s => s.type !== 'SEGMENT')`)
- 条件渲染分段明细

---

## 11. 安全考量

### 11.1 客户端计算

- 所有计算在浏览器端执行
- 无敏感数据发送到服务器

### 11.2 数据验证

| 场景 | 验证 |
|-----|------|
| 贷款金额 | 正数检查 |
| 利率范围 | 0-100% |
| 日期格式 | YYYY-MM-DD 正则 |
| 迭代次数 | 上限 600 |

---

## 12. 可访问性 (a11y)

- 语义化 HTML 标签
- 按钮和输入框有适当的 ARIA 属性
- 颜色对比度符合 WCAG 标准
- 键盘导航支持

---

## 13. 已知问题

| 问题 | 状态 | 说明 |
|-----|------|------|
| EventsPanel.tsx 存在 git merge conflict | 待修复 | 需清理冲突标记 |
| excelHandler.ts 存在 git merge conflict | 待修复 | 需清理冲突标记 |
| 无单元测试 | 待改进 | 建议添加 Vitest/Jest 测试 |

---

## 14. 扩展性设计

### 14.1 新增计算策略

在 `types.ts` 中扩展 `adjustmentStrategy`:

```typescript
adjustmentStrategy: 'CHANGE_INSTALLMENT' | 'CHANGE_TENURE' | 'NEW_STRATEGY';
```

在 `loanCalculator.ts` 中实现对应逻辑。

### 14.2 新增利率类型

可扩展支持:
- 固定利率
- 浮动利率 (LPR + BP)
- 分段阶梯利率

### 14.3 组件化

现有组件高度独立，易于:
- 添加新的可视化图表
- 扩展事件类型
- 替换 UI 框架 (如迁移到 Next.js)

---

## 15. 附录

### 15.1 文件编码

- 源码: UTF-8
- CSV 导出: UTF-8 with BOM (支持 Excel 中文显示)

### 15.2 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 15.3 参考资料

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [date-fns](https://date-fns.org)
- [SheetJS](https://sheetjs.com)
