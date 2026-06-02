import React from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip, ReferenceLine, Area, AreaChart } from 'recharts';
import type { KPITrend } from '../../types';

interface Props {
  data: KPITrend[];
  dataKey: keyof KPITrend;
  color: string;
  label: string;
  unit?: string;
  threshold?: number;
}

export default function TrendSparkline({ data, dataKey, color, label, unit = '', threshold }: Props) {
  const latest = data.length > 0 ? data[data.length - 1][dataKey] : null;

  return (
    <div className="bg-navy-800/50 border border-navy-700/50 rounded-xl px-4 py-2.5 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</span>
        {latest !== null && (
          <span className="text-sm font-bold" style={{ color }}>
            {typeof latest === 'number' ? Math.round(latest as number) : latest}{unit}
          </span>
        )}
      </div>
      <div style={{ height: 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {threshold && (
              <ReferenceLine
                y={threshold}
                stroke="#EF4444"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}
            <Tooltip
              contentStyle={{
                background: '#111547',
                border: '1px solid rgba(0,229,195,0.2)',
                borderRadius: 6,
                fontSize: 11,
                padding: '6px 10px',
              }}
              labelFormatter={() => ''}
              formatter={(v: number) => [`${Math.round(v)}${unit}`, label]}
            />
            <Area
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${label})`}
              dot={false}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
