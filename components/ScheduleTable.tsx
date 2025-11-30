import React, { useState } from 'react';
import { Installment } from '../types';
import { formatCurrency, formatDate, formatPercent } from '../utils';
import { Layers, Banknote, CalendarSearch, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  schedule: Installment[];
}

export const ScheduleTable: React.FC<Props> = ({ schedule }) => {
  const { t, locale } = useLanguage();
  // Separate visibility controls
  const [showRepayments, setShowRepayments] = useState(true);
  const [showSegments, setShowSegments] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  // Helper to format date ranges for segments
  const formatSegmentDate = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${new Intl.DateTimeFormat(locale, opts).format(s)} - ${new Intl.DateTimeFormat(locale, opts).format(e)}`;
  };

  const visibleSchedule = schedule.filter(row => {
    // 1. Check Date Filter (using string comparison for ISO YYYY-MM-DD)
    if (filterDate && row.actualDate < filterDate) {
        return false;
    }

    // 2. Check Type Toggles
    if (row.type === 'REPAYMENT') return showRepayments;
    if (row.type === 'SEGMENT') return showSegments;
    
    return true; // Always show INSTALLMENT if it passes date filter
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      {/* Table Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        
        {/* Date Filter Control */}
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500">
                <CalendarSearch className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t.filterFrom}</span>
            </div>
            <div className="relative flex items-center">
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-1.5 text-gray-900 border bg-white"
                    style={{ colorScheme: 'light' }}
                />
                {filterDate && (
                    <button 
                        onClick={() => setFilterDate('')}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title={t.clearFilter}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-3">
            <button 
            onClick={() => setShowRepayments(!showRepayments)}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-all border ${
                showRepayments 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            >
            <Banknote className="w-3 h-3" />
            {showRepayments ? t.hideRepayments : t.showRepayments}
            </button>

            <button 
            onClick={() => setShowSegments(!showSegments)}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-all border ${
                showSegments 
                ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            >
            <Layers className="w-3 h-3" />
            {showSegments ? t.hideBreakdown : t.showBreakdown}
            </button>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider w-12">{t.colPeriod}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">{t.colDate}</th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-16">{t.colDays}</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">{t.colEffRate}</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">{t.colPrincipal}</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">{t.colInterest}</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">{t.colTotal}</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">{t.colBalance}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {visibleSchedule.map((row, index) => {
            const isRepayment = row.type === 'REPAYMENT';
            const isSegment = row.type === 'SEGMENT';
            
            // Row styling
            let rowClass = 'hover:bg-gray-50';
            if (isRepayment) rowClass = 'bg-emerald-50 hover:bg-emerald-100';
            if (isSegment) rowClass = 'bg-gray-50 text-gray-500 italic text-xs';

            return (
              <tr key={`${row.period}-${index}`} className={`transition-colors ${rowClass}`}>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                  {isSegment || isRepayment ? '' : row.period}
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  {/* Date Column Logic */}
                  {isSegment ? (
                    <div className="flex flex-col">
                        <span>{formatSegmentDate(row.segmentStartDate, row.segmentEndDate)}</span>
                        {/* Show Basis Note here nicely */}
                        <span className="text-[10px] text-gray-400 font-normal not-italic">
                           {row.notes[0]}
                        </span>
                    </div>
                  ) : (
                    <>
                        <div className={`font-medium ${isRepayment ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {formatDate(row.actualDate, locale)}
                        </div>
                        {row.notes.map((note, i) => (
                            <div key={i} className={`text-xs mt-0.5 ${isRepayment ? 'text-emerald-600 italic' : 'text-orange-600'}`}>
                            {note}
                            </div>
                        ))}
                    </>
                  )}
                  {!isRepayment && !isSegment && row.nominalDate !== row.actualDate && row.notes.length === 0 && (
                      <div className="text-xs text-gray-400">{t.colOrig}: {formatDate(row.nominalDate, locale)}</div>
                  )}
                </td>

                <td className="px-4 py-3 text-center font-mono">
                  {/* Don't show 0 for repayment events */}
                  {isRepayment ? '' : row.daysCount}
                </td>

                <td className="px-4 py-3 text-right">
                  {!isRepayment && (
                     <span className={`px-2 py-1 rounded text-xs ${isSegment ? 'bg-orange-50 text-orange-700 font-medium' : 'bg-gray-100'}`}>
                        {formatPercent(row.effectiveRate)}
                     </span>
                  )}
                </td>

                <td className="px-4 py-3 text-right font-medium">
                   {isSegment ? '-' : formatCurrency(row.principal)}
                </td>

                <td className="px-4 py-3 text-right">
                   {/* Interest is key for segments */}
                  <span className={isSegment ? 'text-gray-600' : (isRepayment ? 'text-gray-400' : 'text-red-600')}>
                     {isRepayment ? '-' : formatCurrency(row.interest)}
                  </span>
                </td>

                <td className="px-4 py-3 text-right font-bold">
                  {isSegment ? '-' : formatCurrency(row.total)}
                </td>

                <td className="px-4 py-3 text-right text-gray-500">
                  {/* For segments, show the Balance Basis (outstanding during segment) */}
                  {isSegment ? formatCurrency(row.outstandingBalance) : formatCurrency(row.outstandingBalance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};