import React, { useState } from 'react';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { EventsPanel } from './components/EventsPanel';
import { ScheduleTable } from './components/ScheduleTable';
import { SummaryChart } from './components/SummaryChart';
import { calculateSchedule } from './services/loanCalculator';
import { LoanParams, Holiday, RateRange, RepaymentEvent } from './types';
import { formatCurrency } from './utils';
import { LayoutDashboard, Wallet, PiggyBank, RefreshCw, Download } from 'lucide-react';

const App: React.FC = () => {
  // Initial State
  const [params, setParams] = useState<LoanParams>({
    amount: 100000,
    initialRate: 5.0,
    tenureMonths: 12,
    startDate: new Date().toISOString().split('T')[0],
    holidayShiftMode: 'AFTER',
  });

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [rateRanges, setRateRanges] = useState<RateRange[]>([]);
  const [repayments, setRepayments] = useState<RepaymentEvent[]>([]);

  // State for calculation results (Manual Trigger)
  // Initialize with the calculation based on default params
  const [calculationResult, setCalculationResult] = useState(() => 
    calculateSchedule(params, [], [], [])
  );

  const handleCalculate = () => {
    const result = calculateSchedule(params, holidays, rateRanges, repayments);
    setCalculationResult(result);
  };

  const { schedule, summary } = calculationResult;

  const handleExportCSV = () => {
    if (!schedule || schedule.length === 0) return;

    const headers = [
      "Type",
      "Period",
      "Date",
      "End Date",
      "Days",
      "Effective Rate (%)",
      "Principal / Basis",
      "Interest",
      "Total Payment",
      "Balance",
      "Notes"
    ];

    const rows = schedule.map(row => {
        let dateStr = row.actualDate;
        let endDateStr = '';
        if (row.type === 'SEGMENT') {
            dateStr = row.segmentStartDate || '';
            endDateStr = row.segmentEndDate || '';
        }

        return [
            row.type,
            row.type === 'INSTALLMENT' ? row.period : '',
            dateStr,
            endDateStr,
            row.daysCount,
            row.type === 'INSTALLMENT' ? row.effectiveRate.toFixed(4) : '',
            // For Segment, we put outstandingBalance as Principal Basis to show what was calculated on
            row.type === 'SEGMENT' ? row.outstandingBalance.toFixed(2) : row.principal.toFixed(2),
            row.interest.toFixed(2),
            row.total.toFixed(2),
            row.outstandingBalance.toFixed(2),
            `"${row.notes.join('; ')}"`
        ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `repayment_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">LoanPro <span className="font-light text-blue-600">Calculator</span></h1>
          </div>
          <div className="text-sm text-gray-500">
            Straight Line Method • Actual/365
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <ConfigurationPanel params={params} onChange={setParams} />
            <EventsPanel 
              holidays={holidays} 
              setHolidays={setHolidays}
              rateChanges={rateRanges}
              setRateChanges={setRateRanges}
              repayments={repayments}
              setRepayments={setRepayments}
            />
            
            {/* Generate Button */}
            <button
              onClick={handleCalculate}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Generate Repayment Plan
            </button>
          </div>

          {/* Right Content: Summary & Table */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg text-green-700">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Total Repayment</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPaid)}</p>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-lg text-red-700">
                        <PiggyBank className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Total Interest</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalInterest)}</p>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Last Payment</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{summary.lastPaymentDate ? new Date(summary.lastPaymentDate).toLocaleDateString() : '-'}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Balance Projection</h3>
                <SummaryChart data={schedule.filter(s => s.type !== 'SEGMENT')} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Repayment Schedule</h3>
                    <div className="flex gap-2">
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
                        >
                          <Download className="w-4 h-4" />
                          CSV
                        </button>
                    </div>
                </div>
                <ScheduleTable schedule={schedule} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;