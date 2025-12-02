# LoanPro Calculator

A professional-grade, React-based loan repayment calculator designed to handle complex financial scenarios including holiday shifting, variable interest rates, and irregular extra repayments. Fully supports English and Chinese interfaces.

## 🚀 Features

### Core Functionality
- **Dynamic Scheduling:** Generates accurate repayment plans based on Principal, Interest Rate, Tenure, and Start Date.
- **Visual Analytics:** Interactive Composed Chart offering two distinct views:
  - **Monthly View:** Bar chart showing Principal vs Interest breakdown per payment, with a line for Outstanding Balance.
  - **Cumulative View:** Area chart visualizing the projected total cost (Principal + Interest) accumulation over time.
- **Detailed Table View:** A comprehensive schedule table showing breakdown of Principal, Interest, and Balance.
  - **Smart Filtering:** Filter schedule rows by date.
  - **Toggle Views:** Show/Hide extra repayment events or detailed calculation segments.
- **CSV Export:** Download the full schedule, including segmented calculation details and notes, for analysis in Excel.

### Advanced Financial Logic
- **Recalculation Strategies:**
  - **Variable Installment (Change Installment / 变额不变期):** Default. The loan duration remains fixed. If you make an extra repayment or the interest rate changes, your monthly payment amount is recalculated to ensure the loan ends on the original date.
  - **Variable Tenure (Change Tenure / 变期不变额):** The monthly payment amount remains fixed (based on the initial plan). If you make an extra repayment, the loan duration is shortened. If rates rise, the tenure extends automatically.
- **Holiday Management:**
  - **Custom Intervals:** Define specific start and end dates for holidays. Smart input automatically syncs end dates for single-day holidays.
  - **Excel Import:** Bulk import holiday schedules using a provided Excel template.
  - **Smart Adjustment:** Repayment dates falling on holidays are automatically adjusted to the **Next Business Day (Following)** or **Previous Business Day (Preceding)** based on configuration.
- **Variable Interest Rates:** Support for floating rates. Define specific date ranges where the interest rate changes; the calculator adjusts daily accruals and recalibrates the schedule automatically.
- **Extra Repayments:** Add one-off lump sum payments. The system recalculates the schedule, reducing the principal and future interest immediately.

### Segmented Precision
- **Interest Segmentation:** When a rate change or repayment event occurs *during* a billing period, the calculator splits the period into segments.
- **Transparency:** "Show Breakdown" mode reveals exactly how many days and how much interest accrued on which principal balance for every partial period.
- **Actual/365:** Calculations use the Actual/365 day count convention for maximum precision.

### 🌐 Internationalization
- **Bi-lingual Support:** Seamlessly switch between English (EN) and Chinese (CN).
- **Localized Formatting:** Dates and currencies adjust to the selected locale.

## 🛠️ Tech Stack

- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Date Manipulation:** date-fns
- **Charting:** Recharts
- **Data Processing:** xlsx (SheetJS)
- **Tooling:** Vite / Create React App (Compatible)

## 📖 Usage Guide

### 1. Basic Configuration
Use the panel on the left to input:
- **Loan Amount**: The principal to be borrowed.
- **Interest Rate**: The annual nominal interest rate.
- **Tenure**: Total duration in months.
- **Start Date**: The date of loan disbursement.
- **Holiday Adjustment**: Select whether to shift due dates to the "Next Business Day" or "Previous Business Day" when they fall on a holiday.
- **Recalculation Strategy**: Choose between "Variable Installment" (Keep end date, change payment) or "Variable Tenure" (Keep payment, change end date).

### 2. Managing Events
Use the **Events Panel** to handle irregularities:
- **Holiday Intervals**: Manually add start/end dates for holidays, or use the **Import Excel** feature to upload a list in bulk. A template is provided for download.
- **Interest Rate Intervals**: If the rate changes (e.g., after 1 year), add the new rate and the date range.
- **Extra Repayments**: Add the date and amount for any pre-payments.

### 3. Analyzing the Schedule
Click **Generate Repayment Plan** to calculate.

**Chart Controls:**
- Toggle between **Total (Period)** for monthly cash flow view and **Projection (Cumul.)** for total cost analysis.

**Table Controls:**
- **Show/Hide Repayments:** Toggles the visibility of the extra repayment event rows (highlighted in Green).
- **Show/Hide Breakdown:** Toggles the visibility of "Segment" rows (highlighted in Gray).
    - *Segment Rows:* These show the calculation "under the hood". For example, if you make a repayment in the middle of a month, you will see one segment calculated on the old principal, and a second segment calculated on the new reduced principal.

## 🧮 Calculation Methodology

1.  **PMT Calculation:** Uses the standard annuity formula.
2.  **Daily Interest:** `Balance * (Rate / 100) / 365`.
3.  **Payment Priority:** Interest is paid first; the remainder of the installment reduces the Principal.
4.  **Recalculation:**
    - If a **Repayment** occurs:
      - **Change Installment:** The principal is reduced immediately. The PMT is recalculated for the remaining term using the current rate.
      - **Change Tenure:** The PMT remains constant. Since principal reduces, the interest portion of the PMT drops, the principal repayment portion increases, paying off the loan faster.
    - If a **Rate Change** occurs:
      - **Change Installment:** The PMT is recalculated for the remaining term using the new rate.
      - **Change Tenure:** The PMT generally remains constant, extending or shortening the loan duration naturally.

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