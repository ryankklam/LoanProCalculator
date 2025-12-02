
import React, { useState, useRef } from 'react';
import { Holiday, RateRange, RepaymentEvent } from '../types';
import { Trash2, CalendarOff, TrendingUp, ArrowRight, DollarSign, Coins, Info, Upload, FileDown, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { downloadHolidayTemplate, parseHolidayExcel } from '../services/excelHandler';

interface Props {
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  rateChanges: RateRange[];
  setRateChanges: React.Dispatch<React.SetStateAction<RateRange[]>>;
  repayments: RepaymentEvent[];
  setRepayments: React.Dispatch<React.SetStateAction<RepaymentEvent[]>>;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex items-center ml-2">
    <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center pointer-events-none leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export const EventsPanel: React.FC<Props> = ({ 
  holidays, 
  setHolidays, 
  rateChanges: rateRanges, 
  setRateChanges: setRateRanges,
  repayments,
  setRepayments
}) => {
  const { t } = useLanguage();
  const [newHoliday, setNewHoliday] = useState({ startDate: '', endDate: '', name: '' });
  const [newRate, setNewRate] = useState({ startDate: '', endDate: '', rate: '' });
  const [newRepayment, setNewRepayment] = useState({ date: '', amount: '' });
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addHoliday = () => {
    if (newHoliday.startDate && newHoliday.endDate) {
      if (newHoliday.startDate > newHoliday.endDate) {
          alert("Start date must be before or equal to End date");
          return;
      }
      setHolidays(prev => [...prev, { 
        id: Date.now().toString(), 
        startDate: newHoliday.startDate, 
        endDate: newHoliday.endDate, 
        name: newHoliday.name.trim() || t.noteHoliday
      }]);
      setNewHoliday({ startDate: '', endDate: '', name: '' });
    }
  };

  const removeHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
          const importedHolidays = await parseHolidayExcel(file);
          if (importedHolidays.length > 0) {
              setHolidays(prev => [...prev, ...importedHolidays]);
              alert(t.importSuccess + ` (${importedHolidays.length})`);
          } else {
              alert(t.importError);
          }
      } catch (error) {
          console.error(error);
          alert(t.importError);
      } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const addRateRange = () => {
    if (newRate.startDate && newRate.rate) {
       if (newRate.endDate && newRate.startDate > newRate.endDate) {
          alert("Start date must be before or equal to End date");
          return;
      }
      setRateRanges(prev => [...prev, { 
        id: Date.now().toString(), 
        startDate: newRate.startDate,
        endDate: newRate.endDate || undefined, // Allow empty string to be undefined
        rate: parseFloat(newRate.rate) 
      }]);
      setNewRate({ startDate: '', endDate: '', rate: '' });
    }
  };

  const removeRateRange = (id: string) => {
    setRateRanges(prev => prev.filter(r => r.id !== id));
  };

  const addRepayment = () => {
    if (newRepayment.date && newRepayment.amount) {
      setRepayments(prev => [...prev, {
        id: Date.now().toString(),
        date: newRepayment.date,
        amount: parseFloat(newRepayment.amount)
      }]);
      setNewRepayment({ date: '', amount: '' });
    }
  };

  const removeRepayment = (id: string) => {
    setRepayments(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Holidays Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center text-rose-700">
                <CalendarOff className="w-5 h-5 mr-2" />
                <h3 className="font-bold text-lg">{t.holidayIntervals}</h3>
                <Tooltip text={t.holidayIntervalsTooltip} />
            </div>
            
            {/* Excel Actions */}
            <div className="flex gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Import Excel"
                >
                    {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>}
                    {t.importExcel}
                </button>
                <button 
                    onClick={downloadHolidayTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Download Template"
                >
                    <FileDown className="w-3.5 h-3.5"/>
                    <span className="hidden sm:inline">{t.downloadTemplate}</span>
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 mb-4">
          <div className="flex items-center gap-2">
            <input
                type="date"
                className="border rounded px-3 py-1.5 text-sm flex-1 bg-white"
                style={{ colorScheme: 'light' }}
                value={newHoliday.startDate}
                onChange={(e) => setNewHoliday({ ...newHoliday, startDate: e.target.value })}
            />
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <input
                type="date"
                className="border rounded px-3 py-1.5 text-sm flex-1 bg-white"
                style={{ colorScheme: 'light' }}
                value={newHoliday.endDate}
                onChange={(e) => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <input
                type="text"
                placeholder={t.holidayNamePlaceholder}
                className="border rounded px-3 py-1.5 text-sm flex-1"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            />
            <button 
                onClick={addHoliday}
                className="bg-rose-100 text-rose-700 px-4 rounded hover:bg-rose-200 transition-colors font-medium text-sm"
            >
                {t.add}
            </button>
          </div>
        </div>

        <div className="max-h-32 overflow-y-auto space-y-2">
            {holidays.length === 0 && <p className="text-gray-400 text-xs italic text-center">{t.noHolidays}</p>}
          {holidays.map(h => (
            <div key={h.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm border border-gray-100">
              <div className="flex flex-col">
                  <span className="font-medium text-gray-700">{h.name}</span>
                  <span className="text-xs text-gray-500">{h.startDate === h.endDate ? h.startDate : `${h.startDate} to ${h.endDate}`}</span>
              </div>
              <button onClick={() => removeHoliday(h.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Rates Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-4 text-indigo-700">
          <TrendingUp className="w-5 h-5 mr-2" />
          <h3 className="font-bold text-lg">{t.rateIntervals}</h3>
          <Tooltip text={t.rateIntervalsTooltip} />
        </div>
        
        <div className="grid grid-cols-1 gap-2 mb-4">
             <div className="flex items-center gap-2">
                <input
                    type="date"
                    className="border rounded px-3 py-1.5 text-sm flex-1 bg-white"
                    style={{ colorScheme: 'light' }}
                    value={newRate.startDate}
                    onChange={(e) => setNewRate({ ...newRate, startDate: e.target.value })}
                />
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <input
                    type="date"
                    className="border rounded px-3 py-1.5 text-sm flex-1 bg-white"
                    style={{ colorScheme: 'light' }}
                    placeholder="Optional End"
                    value={newRate.endDate}
                    onChange={(e) => setNewRate({ ...newRate, endDate: e.target.value })}
                />
            </div>
            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder={t.ratePlaceholder}
                    step="0.01"
                    className="border rounded px-3 py-1.5 text-sm flex-1"
                    value={newRate.rate}
                    onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                />
                <button 
                    onClick={addRateRange}
                    className="bg-indigo-100 text-indigo-700 px-4 rounded hover:bg-indigo-200 transition-colors font-medium text-sm"
                >
                    {t.add}
                </button>
            </div>
        </div>

        <div className="max-h-32 overflow-y-auto space-y-2">
            {rateRanges.length === 0 && <p className="text-gray-400 text-xs italic text-center">{t.noRates}</p>}
          {rateRanges.map(r => (
            <div key={r.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm border border-gray-100">
              <div className="flex flex-col">
                 <span className="font-bold text-indigo-600">{r.rate}%</span>
                 <span className="text-xs text-gray-500">{r.startDate} to {r.endDate || 'Next/End'}</span>
              </div>
              <button onClick={() => removeRateRange(r.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Extra Repayments Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-4 text-emerald-700">
          <Coins className="w-5 h-5 mr-2" />
          <h3 className="font-bold text-lg">{t.extraRepayments}</h3>
          <Tooltip text={t.extraRepaymentsTooltip} />
        </div>
        
        <div className="flex gap-2 mb-4">
            <input
                type="date"
                className="border rounded px-3 py-1.5 text-sm flex-1 bg-white"
                style={{ colorScheme: 'light' }}
                value={newRepayment.date}
                onChange={(e) => setNewRepayment({ ...newRepayment, date: e.target.value })}
            />
            <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                </div>
                <input
                    type="number"
                    placeholder={t.amountPlaceholder}
                    className="border rounded px-3 py-1.5 pl-6 text-sm w-full"
                    value={newRepayment.amount}
                    onChange={(e) => setNewRepayment({ ...newRepayment, amount: e.target.value })}
                />
            </div>
            <button 
                onClick={addRepayment}
                className="bg-emerald-100 text-emerald-700 px-4 rounded hover:bg-emerald-200 transition-colors font-medium text-sm"
            >
                {t.add}
            </button>
        </div>

        <div className="max-h-32 overflow-y-auto space-y-2">
            {repayments.length === 0 && <p className="text-gray-400 text-xs italic text-center">{t.noRepayments}</p>}
          {repayments.map(r => (
            <div key={r.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm border border-gray-100">
              <div className="flex flex-col">
                 <span className="font-bold text-emerald-600">${r.amount}</span>
                 <span className="text-xs text-gray-500">{r.date}</span>
              </div>
              <button onClick={() => removeRepayment(r.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
