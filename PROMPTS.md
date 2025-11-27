# Project Prompt History

Here is a record of the prompts used to build the **LoanPro Calculator**.

## 1. Initial Project Setup
> 帮我生成一个银行的贷款还款计划计算器，基于输入贷款金额，利率，期限，repayment scheme更新readme文档

**Result:** Created the core React application with loan calculation logic (Principal, Interest, Balance), chart visualization, and basic Holiday Shift logic (Preceding/Following).

## 2. Advanced Repayment Strategies
> 支持选择 “变额不变期” ，“变期不变额”两个选项，当有特殊事件的时候能对应调整repayment schedule

**Result:**
- Added `adjustmentStrategy` to `LoanParams`.
- Implemented logic for "Variable Installment" (Recalculate PMT, fixed end date) and "Variable Tenure" (Fixed PMT, dynamic end date).
- Refactored the calculation loop to a `while` loop to handle dynamic tenure.

## 3. UI/UX Improvements
> 添加holiday的时候 如果holiday name没有填，也可以添加holiday，system default一个holiday name

**Result:** Updated `EventsPanel` to make the Holiday Name optional, defaulting to "Holiday" if left blank.

## 4. Documentation
> 可以帮我创建一个markdown文件，把这个项目从开始 我所问的提示词 全部列出来吗

**Result:** Generated this `PROMPTS.md` file.
