import React from 'react';
import { LoanParams } from '../types';
import { Calculator, Calendar, DollarSign, Percent, Settings2, SlidersHorizontal } from 'lucide-react';

interface Props {
  params: LoanParams;
  onChange: (params: LoanParams) => void;
}

export const ConfigurationPanel: React.FC<Props> = ({ params, onChange }) => {
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
        <h2 className="text-xl font-bold">Loan Details</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Months)</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              name="startDate"
              value={params.startDate}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 py-2 border sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Adjustment</label>
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
                <option value="AFTER">Next Business Day (后顺)</option>
                <option value="BEFORE">Previous Business Day (前顺)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recalculation Strategy</label>
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
                <option value="CHANGE_INSTALLMENT">Variable Installment (变额不变期)</option>
                <option value="CHANGE_TENURE">Variable Tenure (变期不变额)</option>
            </select>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {params.adjustmentStrategy === 'CHANGE_INSTALLMENT' 
                ? "Keeps the end date fixed. Monthly payment changes."
                : "Keeps monthly payment fixed. End date changes."}
          </p>
        </div>

      </div>
    </div>
  );
};