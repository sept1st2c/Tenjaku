
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const formatYAxis = (tickItem) => {
  const levels = {
    0: 'Low',
    33: 'Mild',
    66: 'High',
    100: 'Critical'
  };
  
  return levels[tickItem] || '';
};

const StressLevelChart = ({ data, title = "Stress Level Trend" }) => {
  const formattedData = Object.entries(data).map(([date, values]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: values.stressLevel || 0
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} ticks={[0, 33, 66, 100]} tickFormatter={formatYAxis} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Stress Level']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#FF6B6B"
                fillOpacity={1}
                fill="url(#colorStress)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StressLevelChart;
