import React, { useMemo, useState } from 'react';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Installment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart3, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils';

interface Props {
  data: Installment[];
  title: string;
}

type ChartMode = 'monthly' | 'cumulative';

export const SummaryChart: React.FC<Props> = ({ data, title }) => {
  const { t, locale } = useLanguage();
  const [mode, setMode] = useState<ChartMode>('monthly');

  // Filter out SEGMENTs for the chart to avoid clutter. 
  // We only want to see the aggregate result per period (INSTALLMENT) or specific REPAYMENT events.
  const chartData = useMemo(() => {
    let accInterest = 0;
    let accPrincipal = 0;
    
    // Filter to get only the rows that represent a payment event
    const relevantRows = data.filter(d => d.type === 'INSTALLMENT' || d.type === 'REPAYMENT');

    return relevantRows.map(d => {
      accInterest += d.interest;
      accPrincipal += d.principal; // Use principal paid
      return {
        ...d,
        accInterest,
        accPrincipal,
        accTotal: accInterest + accPrincipal,
        // Ensure strictly non-negative for charts
        principal: d.principal < 0 ? 0 : d.principal,
        interest: d.interest < 0 ? 0 : d.interest
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateStr = new Date(label).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-xs z-50">
          <p className="font-bold text-gray-700 mb-2 border-b pb-1">{dateStr}</p>
          {payload.map((p: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                {p.name}:
              </span>
              <span className="font-mono font-medium">
                {formatCurrency(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
            {title}
        </h3>
        
        {/* Toggle Switch */}
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
            <button
                onClick={() => setMode('monthly')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === 'monthly' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <BarChart3 className="w-3.5 h-3.5" />
                {t.colTotal} ({t.colPeriod})
            </button>
            <button
                onClick={() => setMode('cumulative')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === 'cumulative' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <TrendingUp className="w-3.5 h-3.5" />
                {t.scheduleProjection} (Cumul.)
            </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'monthly' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="actualDate" 
                tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getFullYear().toString().substr(2)}`;
                }}
                tick={{fontSize: 10, fill: '#9ca3af'}}
                minTickGap={30}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              {/* Left Y-Axis: Monthly Payments (Bars) */}
              <YAxis 
                yAxisId="left"
                tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                tick={{fontSize: 10, fill: '#9ca3af'}}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Payment ($)', angle: -90, position: 'insideLeft', style: {fontSize: 10, fill: '#9ca3af'} }}
              />
              {/* Right Y-Axis: Outstanding Balance (Line) */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                tick={{fontSize: 10, fill: '#9ca3af'}}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Balance ($)', angle: 90, position: 'insideRight', style: {fontSize: 10, fill: '#9ca3af'} }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
              
              {/* Stacked Bars for Principal vs Interest */}
              <Bar yAxisId="left" dataKey="principal" stackId="a" name={t.colPrincipal} fill="#10b981" barSize={20} radius={[0, 0, 4, 4]} />
              <Bar yAxisId="left" dataKey="interest" stackId="a" name={t.colInterest} fill="#ef4444" barSize={20} radius={[4, 4, 0, 0]} />
              
              {/* Line for Balance */}
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="outstandingBalance" 
                name={t.colBalance} 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          ) : (
            // Cumulative View (Area Chart)
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
               <XAxis 
                dataKey="actualDate" 
                tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getFullYear().toString().substr(2)}`;
                }}
                tick={{fontSize: 10, fill: '#9ca3af'}}
                minTickGap={30}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                tick={{fontSize: 10, fill: '#9ca3af'}}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>

              <Area 
                type="monotone" 
                dataKey="accPrincipal" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6} 
                name={`Cumul. ${t.colPrincipal}`} 
              />
              <Area 
                type="monotone" 
                dataKey="accInterest" 
                stackId="1" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.6} 
                name={`Cumul. ${t.colInterest}`} 
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};