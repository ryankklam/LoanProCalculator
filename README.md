# LoanPro Calculator

A professional-grade, React-based loan repayment calculator designed to handle complex financial scenarios including holiday shifting, variable interest rates, and irregular extra repayments.

## 🚀 Features

### Core Functionality
- **Dynamic Scheduling:** Generates accurate repayment plans based on Principal, Interest Rate, Tenure, and Start Date.
- **Visual Analytics:** Interactive Area Chart visualizing the outstanding balance over time.
- **Detailed Table View:** A comprehensive schedule table showing breakdown of Principal, Interest, and Balance.
- **CSV Export:** Download the full schedule, including segmented calculation details, for analysis in Excel.

### Advanced Financial Logic
- **Holiday Management:** Define holiday intervals. Repayment dates falling on holidays are automatically shifted to the next business day, with interest accruing for the deferred days.
- **Variable Interest Rates:** Support for floating rates. Define specific date ranges where the interest rate changes; the calculator adjusts daily accruals and recalculates the monthly installment (PMT) automatically.
- **Extra Repayments:** Add one-off lump sum payments. The system recalculates the schedule, reducing the principal and future interest immediately.

### Segmented Precision
- **Interest Segmentation:** When a rate change or repayment event occurs *during* a billing period, the calculator splits the period into segments.
- **Transparency:** "Show Breakdown" mode reveals exactly how many days and how much interest accrued on which principal balance for every partial period.
- **Actual/365:** Calculations use the Actual/365 day count convention for maximum precision.

## 🛠️ Tech Stack

- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Date Manipulation:** date-fns
- **Charting:** Recharts
- **Tooling:** Vite / Create React App (Compatible)

## 📖 Usage Guide

### 1. Basic Configuration
Use the panel on the left to input:
- **Loan Amount**: The principal to be borrowed.
- **Interest Rate**: The annual nominal interest rate.
- **Tenure**: Total duration in months.
- **Start Date**: The date of loan disbursement.

### 2. Managing Events
Use the **Events Panel** to handle irregularities:
- **Holiday Intervals**: Add start/end dates for holidays. Payments due on these days move forward.
- **Interest Rate Intervals**: If the rate changes (e.g., after 1 year), add the new rate and the date range.
- **Extra Repayments**: Add the date and amount for any pre-payments.

### 3. Analyzing the Schedule
Click **Generate Repayment Plan** to calculate.

**Table Controls:**
- **Show/Hide Repayments:** Toggles the visibility of the extra repayment event rows (highlighted in Green).
- **Show/Hide Breakdown:** Toggles the visibility of "Segment" rows (highlighted in Gray).
    - *Segment Rows:* These show the calculation "under the hood". For example, if you make a repayment in the middle of a month, you will see one segment calculated on the old principal, and a second segment calculated on the new reduced principal.

## 🧮 Calculation Methodology

1.  **PMT Calculation:** Uses the standard annuity formula.
2.  **Daily Interest:** `Balance * (Rate / 100) / 365`.
3.  **Payment Priority:** Interest is paid first; the remainder of the installment reduces the Principal.
4.  **Recalculation:**
    - If a **Repayment** occurs: The principal is reduced immediately. The PMT is recalculated for the remaining term using the current rate.
    - If a **Rate Change** occurs: The PMT is recalculated for the remaining term using the new rate.

## 📦 Installation

To run this project locally:

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    # or
    npm run dev
    ```

## 📄 License
MIT
