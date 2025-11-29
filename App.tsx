import React, { useState, useEffect } from 'react';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { EventsPanel } from './components/EventsPanel';
import { ScheduleTable } from './components/ScheduleTable';
import { SummaryChart } from './components/SummaryChart';
import { calculateSchedule } from './services/loanCalculator';
import { LoanParams, Holiday, RateRange, RepaymentEvent } from './types';
import { formatCurrency } from './utils';
import { LayoutDashboard, Wallet, PiggyBank, RefreshCw, Download, Languages } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  const { language, setLanguage, t, locale } = useLanguage();

  // Initial State
  const [params, setParams] = useState<LoanParams>({
    amount: 100000,
    initialRate: 5.0,
    tenureMonths: 12,
    startDate: new Date().toISOString().split('T')[0],
    holidayShiftMode: 'AFTER',
    adjustmentStrategy: 'CHANGE_INSTALLMENT',
  });

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [rateRanges, setRateRanges] = useState<RateRange[]>([]);
  const [repayments, setRepayments] = useState<RepaymentEvent[]>([]);

  // State for calculation results (Manual Trigger)
  const [calculationResult, setCalculationResult] = useState(() => 
    calculateSchedule(params, [], [], [], language)
  );

  // Recalculate when language changes so notes update
  useEffect(() => {
    handleCalculate();
  }, [language]);

  const handleCalculate = () => {
    const result = calculateSchedule(params, holidays, rateRanges, repayments, language);
    setCalculationResult(result);
  };

  const { schedule, summary } = calculationResult;

  const handleExportCSV = () => {
    if (!schedule || schedule.length === 0) return;

    const headers = [
      t.csvType,
      t.csvPeriod,
      t.csvDate,
      t.csvEndDate,
      t.csvDays,
      t.csvEffRate,
      t.csvPrincipal,
      t.csvInterest,
      t.csvTotal,
      t.csvBalance,
      t.csvNotes
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

    // Add BOM for Excel Chinese character support
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'cn' : 'en');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">{t.appTitle} <span className="font-light text-blue-600">{t.appSubtitle}</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-500 hidden sm:block">
              {t.methodology}
            </div>
            <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                title={t.toggleLang}
            >
                <Languages className="w-4 h-4" />
                {language === 'en' ? 'CN' : 'EN'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Controls */}
          <div className="lg:col-span-4 space-y-5">
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
              {t.generatePlan}
            </button>
          </div>

          {/* Right Content: Summary & Table */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg text-green-700">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{t.totalRepayment}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPaid)}</p>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-lg text-red-700">
                        <PiggyBank className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{t.totalInterest}</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalInterest)}</p>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{t.lastPayment}</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{summary.lastPaymentDate ? new Date(summary.lastPaymentDate).toLocaleDateString(locale) : '-'}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <SummaryChart 
                    data={schedule.filter(s => s.type !== 'SEGMENT')} 
                    title={t.scheduleProjection}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{t.repaymentSchedule}</h3>
                    <div className="flex gap-2">
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
                        >
                          <Download className="w-4 h-4" />
                          {t.exportCsv}
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