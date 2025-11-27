import React, { useState } from 'react';
import { Installment } from '../types';
import { formatCurrency, formatDate, formatPercent } from '../utils';
import { Eye, EyeOff, Layers, Banknote } from 'lucide-react';

interface Props {
  schedule: Installment[];
}

export const ScheduleTable: React.FC<Props> = ({ schedule }) => {
  // Separate visibility controls
  const [showRepayments, setShowRepayments] = useState(true);
  const [showSegments, setShowSegments] = useState(false);

  // Helper to format date ranges for segments
  const formatSegmentDate = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${new Intl.DateTimeFormat('en-US', opts).format(s)} - ${new Intl.DateTimeFormat('en-US', opts).format(e)}`;
  };

  const visibleSchedule = schedule.filter(row => {
    if (row.type === 'REPAYMENT') return showRepayments;
    if (row.type === 'SEGMENT') return showSegments;
    return true; // Always show INSTALLMENT
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      {/* Table Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-end gap-3">
        <button 
          onClick={() => setShowRepayments(!showRepayments)}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-all border ${
            showRepayments 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Banknote className="w-3 h-3" />
          {showRepayments ? 'Hide Repayments' : 'Show Repayments'}
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
          {showSegments ? 'Hide Breakdown' : 'Show Breakdown'}
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-16">Days</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Eff. Rate</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Principal</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Interest</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Balance</th>
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
                            {formatDate(row.actualDate)}
                        </div>
                        {row.notes.map((note, i) => (
                            <div key={i} className={`text-xs mt-0.5 ${isRepayment ? 'text-emerald-600 italic' : 'text-orange-600'}`}>
                            {note}
                            </div>
                        ))}
                    </>
                  )}
                  {!isRepayment && !isSegment && row.nominalDate !== row.actualDate && row.notes.length === 0 && (
                      <div className="text-xs text-gray-400">Orig: {formatDate(row.nominalDate)}</div>
                  )}
                </td>

                <td className="px-4 py-3 text-center font-mono">
                  {/* Don't show 0 for repayment events */}
                  {isRepayment ? '' : row.daysCount}
                </td>

                <td className="px-4 py-3 text-right">
                  {!isSegment && !isRepayment && (
                     <span className="bg-gray-100 px-2 py-1 rounded text-xs">{formatPercent(row.effectiveRate)}</span>
                  )}
                  {isSegment && '-'}
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