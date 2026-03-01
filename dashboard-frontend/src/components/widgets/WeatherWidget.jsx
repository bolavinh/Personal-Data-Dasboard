import React, { useState, useEffect } from 'react';
import * as openmeteo from "openmeteo";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CloudRain, Wind, Maximize2, Minimize2 } from 'lucide-react';


const WeatherWidget = ({ widget }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchWeather = async () => {
    try {
      const params = {
        latitude: 21.0221,
        longitude: 105.7926,
        hourly: ["temperature_2m", "rain", "wind_speed_10m"],
        timezone: "Asia/Bangkok",
        forecast_days: 1,
      };

      const url = "https://api.open-meteo.com/v1/forecast";

      const responses = await openmeteo.fetchWeatherApi(url, params);
      const response = responses[0];

      const hourly = response.hourly();
      const utcOffsetSeconds = response.utcOffsetSeconds();

      const timeArray = Array.from(
        { length: hourly.variables(0).valuesArray().length },
        (_, i) =>
          new Date(
            (Number(hourly.time()) +
              i * hourly.interval() +
              utcOffsetSeconds) *
              1000
          )
      );

      const temps = hourly.variables(0).valuesArray();
      const rains = hourly.variables(1).valuesArray();
      const winds = hourly.variables(2).valuesArray();

      const chartData = timeArray.map((date, index) => ({
        time: `${date.getUTCHours()}h`,
        temp: Number(temps[index]),
        rain: Number(rains[index]),
        wind: Number(winds[index]),
      }));

      const currentData =
        chartData[new Date().getHours()] || chartData[0];

      setData({ current: currentData, forecast: chartData });

    } catch (err) {
      console.error(err);
      setError("Lỗi lấy dữ liệu thời tiết");
    }
  };

  fetchWeather();
}, []);

  // Trạng thái Loading hoặc Lỗi
  if (error) return <div className="h-full flex items-center justify-center text-red-500 text-sm">{error}</div>;
  if (!data) return <div className="h-full flex items-center justify-center text-gray-500 text-sm animate-pulse">Đang tải thời tiết...</div>;

  return (
    <div className="h-full flex flex-col w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">

      {/* THÊM HEADER: Có tên Widget và Nút Phóng to/Thu nhỏ */}
      <div className="flex justify-between items-start p-4 pb-0">
        <h3 className="text-gray-500 font-medium text-sm">{widget?.name || "Dự báo thời tiết"}</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-gray-400 hover:text-blue-500 cursor-pointer z-10"
          onMouseDown={(e) => e.stopPropagation()} // Chặn kéo thả khi bấm nút
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Giao diện khi thẻ BỊ THU GỌN */}
      {!isExpanded ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-2 p-4">
          <div className="text-4xl font-bold text-orange-500">{data.current.temp}°C</div>
          <div className="flex gap-4 text-sm text-gray-500 font-medium mt-2">
            <span className="flex items-center gap-1"><CloudRain size={16} className="text-blue-500"/> {data.current.rain}mm</span>
            <span className="flex items-center gap-1"><Wind size={16} className="text-teal-500"/> {data.current.wind}km/h</span>
          </div>
        </div>
      ) : (
        /* Giao diện khi thẻ ĐƯỢC MỞ RỘNG (Hiện biểu đồ) */
        <div className="flex-1 min-h-0 mt-4 p-4" onMouseDown={(e) => e.stopPropagation()}>
          <div className="text-2xl font-bold text-orange-500 mb-2">{data.current.temp}°C</div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{fontSize: 12}} />
              <YAxis yAxisId="left" tick={{fontSize: 12}} unit="°C" width={40} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} width={40} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
              <Bar yAxisId="right" dataKey="rain" name="Mưa (mm)" fill="#3b82f6" opacity={0.5} barSize={20} />
              <Line yAxisId="left" type="monotone" dataKey="temp" name="Nhiệt độ" stroke="#f97316" strokeWidth={3} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="wind" name="Gió (km/h)" stroke="#14b8a6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;