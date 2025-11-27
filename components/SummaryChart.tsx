import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Installment } from '../types';

interface Props {
  data: Installment[];
}

export const SummaryChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
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
            tick={{fontSize: 12}}
            minTickGap={30}
          />
          <YAxis 
            tickFormatter={(val) => `$${val/1000}k`} 
            tick={{fontSize: 12}}
          />
          <Tooltip 
            formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Area type="monotone" dataKey="outstandingBalance" stackId="1" stroke="#3b82f6" fill="#eff6ff" name="Balance" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};