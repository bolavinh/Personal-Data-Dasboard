import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wind, AlertCircle, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AqiWidget = ({ widget }) => {
  // THÊM STATE ĐÓNG/MỞ
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAqi = async () => {
      try {
        // Cập nhật URL: Lấy thêm dữ liệu dự báo (hourly) để vẽ biểu đồ
        const url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=21.0221&longitude=105.7926&current=european_aqi,pm10,pm2_5&hourly=european_aqi,pm10,pm2_5&timezone=Asia%2FBangkok&forecast_days=1";
        const res = await axios.get(url);

        const current = res.data.current;
        const hourly = res.data.hourly;

        // Chuẩn hóa dữ liệu biểu đồ
        const chartData = hourly.time.map((timeStr, index) => {
          const date = new Date(timeStr);
          return {
            time: `${date.getHours()}h`,
            aqi: hourly.european_aqi[index],
            pm10: hourly.pm10[index],
            pm2_5: hourly.pm2_5[index]
          };
        });

        setData({ current, forecast: chartData });
      } catch (err) {
        console.error("Lỗi tải AQI:", err);
        setError("Không thể tải dữ liệu không khí");
      }
    };

    fetchAqi();
    const interval = setInterval(fetchAqi, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Hàm xác định mức độ ô nhiễm, màu nền và màu biểu đồ
  const getAqiStatus = (aqi) => {
    if (aqi <= 20) return { label: 'Tốt', color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle size={20} className="text-green-500"/>, chartStroke: '#22c55e', chartFill: '#dcfce7' };
    if (aqi <= 40) return { label: 'Khá', color: 'bg-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50', icon: <AlertCircle size={20} className="text-yellow-500"/>, chartStroke: '#facc15', chartFill: '#fef9c3' };
    if (aqi <= 60) return { label: 'Trung bình', color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', icon: <AlertCircle size={20} className="text-orange-500"/>, chartStroke: '#f97316', chartFill: '#ffedd5' };
    return { label: 'Xấu', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle size={20} className="text-red-500"/>, chartStroke: '#ef4444', chartFill: '#fee2e2' };
  };

  if (error) return <div className="h-full bg-white rounded-xl shadow-sm p-4 text-red-500 text-sm flex justify-center items-center">{error}</div>;
  if (!data) return <div className="h-full bg-white rounded-xl shadow-sm p-4 animate-pulse text-gray-500 text-sm flex justify-center items-center">Đang tải AQI...</div>;

  const status = getAqiStatus(data.current.european_aqi);

  return (
    // Khi mở rộng, đổi nền thành trắng để dễ nhìn biểu đồ. Khi thu gọn, giữ màu nền cảnh báo.
    <div className={`h-full w-full rounded-xl shadow-sm border border-gray-200 flex flex-col transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white' : status.bg}`}>
      
      {/* HEADER CÓ NÚT BẤM */}
      <div className="flex justify-between items-start p-4 pb-0">
        <h3 className={`font-semibold flex items-center gap-2 ${isExpanded ? 'text-gray-700' : status.text}`}>
          <Wind size={18} /> {widget?.name || "Chất lượng Không khí"}
        </h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className={`${isExpanded ? 'text-gray-400' : status.text} hover:opacity-70 cursor-pointer z-10`}
          onMouseDown={(e) => e.stopPropagation()} // Chặn Grid Layout kéo thả khi bấm nút
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
      
      {/* THU GỌN: Hiện số to và chỉ số phụ */}
      {!isExpanded ? (
        <div className="flex-1 flex flex-col justify-center items-center p-4 pt-2">
          <span className={`text-4xl font-bold ${status.text}`}>{data.current.european_aqi}</span>
          <span className={`text-sm font-medium mt-1 px-3 py-1 rounded-full ${status.color} text-white`}>
            {status.label}
          </span>
          
          <div className="mt-4 flex justify-center gap-6 border-t border-black/10 pt-3 text-sm font-medium text-gray-600 w-full">
            <div>PM2.5: <span className="text-gray-900">{data.current.pm2_5}</span></div>
            <div>PM10: <span className="text-gray-900">{data.current.pm10}</span></div>
          </div>
        </div>
      ) : (
        /* MỞ RỘNG: Hiện biểu đồ AreaChart trong ngày */
        <div className="flex-1 flex flex-col min-h-0 p-4 pt-2" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-2xl font-bold ${status.text}`}>{data.current.european_aqi}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.color} text-white`}>{status.label}</span>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.forecast}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis width={30} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="aqi" 
                  name="Chỉ số AQI" 
                  stroke={status.chartStroke} 
                  fill={status.chartFill} 
                  strokeWidth={2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AqiWidget;