import React, { useMemo, useState } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Installment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  data: Installment[];
  title: string;
}

export const SummaryChart: React.FC<Props> = ({ data, title }) => {
  const { t, locale } = useLanguage();
  const [visibility, setVisibility] = useState({
    balance: true,
    repayment: true,
    interest: true
  });

  const chartData = useMemo(() => {
    let accInterest = 0;
    let accPaid = 0;
    return data.map(d => {
      accInterest += d.interest;
      accPaid += d.total;
      return {
        ...d,
        accInterest,
        accPaid
      };
    });
  }, [data]);

  const toggle = (key: keyof typeof visibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleButton = ({ active, onClick, color, label }: { active: boolean, onClick: () => void, color: string, label: string }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
        active 
          ? `bg-${color}-50 text-${color}-700 border-${color}-200` 
          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${active ? `bg-${color}-500` : 'bg-gray-300'}`} />
      {label}
      {active ? <Eye className="w-3 h-3 ml-0.5" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
    </button>
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <div className="flex gap-2">
            <ToggleButton 
                active={visibility.balance} 
                onClick={() => toggle('balance')} 
                color="blue" 
                label={t.colBalance} 
            />
            <ToggleButton 
                active={visibility.repayment} 
                onClick={() => toggle('repayment')} 
                color="emerald" 
                label={t.totalRepayment} 
            />
            <ToggleButton 
                active={visibility.interest} 
                onClick={() => toggle('interest')} 
                color="red" 
                label={t.totalInterest} 
            />
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="actualDate" 
              tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getMonth() + 1}/${d.getFullYear().toString().substr(2)}`;
              }}
              tick={{fontSize: 11}}
              minTickGap={30}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tickFormatter={(val) => `$${val/1000}k`} 
              tick={{fontSize: 11}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
              labelFormatter={(label) => new Date(label).toLocaleDateString(locale)}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '5px', fontSize: '12px' }} />
            
            {visibility.balance && (
              <Area 
                type="monotone" 
                dataKey="outstandingBalance" 
                stroke="#3b82f6" 
                fill="#eff6ff" 
                fillOpacity={0.6}
                name={t.colBalance} 
              />
            )}
            {visibility.repayment && (
              <Line 
                type="monotone" 
                dataKey="accPaid" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={false} 
                name={t.totalRepayment} 
              />
            )}
            {visibility.interest && (
              <Line 
                type="monotone" 
                dataKey="accInterest" 
                stroke="#ef4444" 
                strokeWidth={2} 
                dot={false} 
                name={t.totalInterest} 
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};