import React from 'react';
import { LoanParams } from '../types';
import { Calculator, Calendar, DollarSign, Percent, Settings2, SlidersHorizontal, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  params: LoanParams;
  onChange: (params: LoanParams) => void;
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

export const ConfigurationPanel: React.FC<Props> = ({ params, onChange }) => {
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...params,
      [name]: (name === 'startDate' || name === 'holidayShiftMode' || name === 'adjustmentStrategy') 
        ? value 
        : parseFloat(value) || 0,
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-6 text-blue-800">
        <Calculator className="w-6 h-6" />
        <h2 className="text-xl font-bold">{t.loanDetails}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            {t.loanAmount}
            <Tooltip text={t.loanAmountTooltip} />
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="number"
              name="amount"
              value={params.amount}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2 border sm:text-sm"
              placeholder="e.g. 100000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {t.rate}
                <Tooltip text={t.rateTooltip} />
            </label>
            <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Percent className="h-4 w-4 text-gray-400" />
                </div>
                <input
                type="number"
                name="initialRate"
                step="0.01"
                value={params.initialRate}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2 border sm:text-sm"
                placeholder="e.g. 5.5"
                />
            </div>
            </div>

            <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {t.tenure}
                <Tooltip text={t.tenureTooltip} />
            </label>
            <div className="relative rounded-md shadow-sm">
                <input
                type="number"
                name="tenureMonths"
                value={params.tenureMonths}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 pl-3 focus:border-blue-500 focus:ring-blue-500 py-2 border sm:text-sm"
                placeholder="e.g. 12"
                />
            </div>
            </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            {t.startDate}
            <Tooltip text={t.startDateTooltip} />
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              name="startDate"
              value={params.startDate}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2 border sm:text-sm bg-white"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            {t.holidayAdjustment}
            <Tooltip text={t.holidayAdjustmentTooltip} />
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Settings2 className="h-4 w-4 text-gray-400" />
            </div>
            <select
              name="holidayShiftMode"
              value={params.holidayShiftMode}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2 border sm:text-sm bg-white"
            >
                <option value="AFTER">{t.nextBusinessDay}</option>
                <option value="BEFORE">{t.prevBusinessDay}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            {t.recalculationStrategy}
            <Tooltip text={t.recalculationStrategyTooltip} />
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            </div>
            <select
              name="adjustmentStrategy"
              value={params.adjustmentStrategy}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2 border sm:text-sm bg-white"
            >
                <option value="CHANGE_INSTALLMENT">{t.varInstallment}</option>
                <option value="CHANGE_TENURE">{t.varTenure}</option>
            </select>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {params.adjustmentStrategy === 'CHANGE_INSTALLMENT' 
                ? t.varInstallmentDesc
                : t.varTenureDesc}
          </p>
        </div>

      </div>
    </div>
  );
};