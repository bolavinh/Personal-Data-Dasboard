import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Maximize2, Minimize2, Bell, Trash2 } from 'lucide-react';
import { getWidgetHistory, deleteWidget } from '../services/api';
import AlertModal from './AlertModal';

const WidgetCard = ({ widget }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Format số liệu cho đẹp (ví dụ: 79000000 -> 79,000,000)
  const formattedValue = new Intl.NumberFormat('vi-VN').format(widget.latest_value || 0);

  const handleDeleteWidget = async () => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa widget "${widget.name}" và toàn bộ dữ liệu lịch sử của nó không?`);
    if (confirmDelete) {
      try {
        await deleteWidget(widget.id);
        if (onDeleteSuccess) onDeleteSuccess(); // Gọi hàm refresh Dashboard
      } catch (error) {
        alert("Lỗi khi xóa Widget!");
        console.error(error);
      }
    }
  }; 

  const toggleExpand = async () => {
    if (!isExpanded && historyData.length === 0) {
      // Chỉ fetch data lịch sử khi mở rộng lần đầu
      try {
        const res = await getWidgetHistory(widget.id);
        // Format lại thời gian cho trục X của biểu đồ
        const formattedData = res.data.map(item => ({
          ...item,
          time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setHistoryData(formattedData);
      } catch (error) {
        console.error("Lỗi tải lịch sử:", error);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
    <div className="h-full w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col transition-all duration-300">
        
        {/* Header cập nhật thêm Nút Xóa */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-gray-500 font-medium text-sm">{widget.name}</h3>
          
          <div className="flex items-center gap-2 z-10" onMouseDown={(e) => e.stopPropagation()}>
            {/* Nút Xóa (Màu đỏ khi hover) */}
            <button onClick={handleDeleteWidget} className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors" title="Xóa Widget">
              <Trash2 size={16} />
            </button>
            
            {/* Nút Phóng to/Thu nhỏ cũ */}
            <button onClick={toggleExpand} className="text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

      {/* Nội dung chính */}
      {!isExpanded ? (
        // Chế độ thu gọn: Hiện số to
        <div className="flex-1 flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-800">{formattedValue}</span>
        </div>
      ) : (
        // Chế độ mở rộng: Hiện biểu đồ và Nút cài đặt
        <div className="flex-1 flex flex-col h-full" onMouseDown={(e) => e.stopPropagation()}>
          {/* onMouseDown chặn sự kiện kéo thả của grid để có thể tương tác với biểu đồ */}
          <div className="text-2xl font-bold text-gray-800 mb-2">{formattedValue}</div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} tickLine={false} axisLine={false} width={40} />
                <Tooltip />
                <Line type="monotone" dataKey="normalized_value" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          
          {/* Nút cài đặt thông báo */}
          <button onClick={() => setIsAlertOpen(true)} className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200 transition-colors">
            <Bell size={16} /> Cài đặt cảnh báo (Alert)
          </button>
        </div>
      )}
    </div>
    {/* Gắn AlertModal ở bên ngoài div chính để tránh bị Grid Layout kìm hãm kích thước */}
    <AlertModal 
        isOpen={isAlertOpen} 
        onClose={() => setIsAlertOpen(false)} 
        widgetId={widget.id} 
        widgetName={widget.name} 
    />
    </>
  );
};

export default WidgetCard;