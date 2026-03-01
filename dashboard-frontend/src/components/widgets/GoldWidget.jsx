import React, { useState, useEffect } from 'react';
import { getWidgetHistory } from '../../services/api';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Coins } from 'lucide-react';

const GoldWidget = ({ widget }) => {
  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState({ isUp: true, diff: 0 });

  useEffect(() => {
    // Lấy 20 điểm dữ liệu gần nhất từ Backend của bạn
    getWidgetHistory(widget.id, 20).then(res => {
      const data = res.data;
      setHistory(data);
      
      // Tính toán xu hướng (So sánh giá hiện tại và giá trước đó)
      if (data.length >= 2) {
        const current = data[data.length - 1].normalized_value;
        const previous = data[data.length - 2].normalized_value;
        setTrend({
          isUp: current >= previous,
          diff: Math.abs(current - previous)
        });
      }
    }).catch(err => console.error(err));
  }, [widget.id]);

  const currentValue = widget.latest_value || (history.length > 0 ? history[history.length - 1].normalized_value : 0);
  const formattedValue = new Intl.NumberFormat('vi-VN').format(currentValue);
  const formattedDiff = new Intl.NumberFormat('vi-VN').format(trend.diff);

  return (
    <div className="h-full w-full bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm border border-yellow-200 flex flex-col overflow-hidden cursor-grab relative">
      <div className="p-4 flex-1 z-10">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
            <Coins size={18} /> {widget.name}
          </h3>
        </div>
        
        <div className="mt-4">
          <span className="text-3xl font-bold text-yellow-900">{formattedValue} $</span>
          <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${trend.isUp ? 'text-green-600' : 'text-red-500'}`}>
            {trend.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend.diff === 0 ? 'Đứng giá' : `${trend.isUp ? '+' : '-'}${formattedDiff} ₫`}
          </div>
        </div>
      </div>

      {/* Biểu đồ chạy ngầm ở đáy thẻ */}
      <div className="h-16 w-full absolute bottom-0 left-0 opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area type="monotone" dataKey="normalized_value" stroke="#eab308" fill="#fef08a" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GoldWidget;