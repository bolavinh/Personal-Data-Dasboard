import React, { useState, useEffect } from 'react';
import { getWidgetHistory } from '../../services/api';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ForexWidget = ({ widget }) => {
  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState({ isUp: true });

  useEffect(() => {
    getWidgetHistory(widget.id, 24).then(res => {
      const data = res.data;
      setHistory(data);
      if (data.length >= 2) {
        setTrend({ isUp: data[data.length - 1].normalized_value >= data[data.length - 2].normalized_value });
      }
    }).catch(err => console.error(err));
  }, [widget.id]);

  const currentValue = widget.latest_value || (history.length > 0 ? history[history.length - 1].normalized_value : 0);
  const formattedValue = new Intl.NumberFormat('vi-VN').format(currentValue);

  return (
    <div className="h-full w-full bg-white rounded-xl shadow-sm border border-emerald-100 flex flex-col overflow-hidden cursor-grab relative">
      <div className="p-4 flex-1 z-10 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign size={24} />
          </div>
          <div className={`flex items-center gap-1 text-sm font-bold ${trend.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.isUp ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          </div>
        </div>

        <div>
          <h3 className="text-gray-500 text-sm font-medium">{widget.name}</h3>
          <span className="text-3xl font-bold text-gray-800">{formattedValue} ₫</span>
        </div>
      </div>

      <div className="h-12 w-full absolute bottom-0 left-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area type="step" dataKey="normalized_value" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForexWidget;