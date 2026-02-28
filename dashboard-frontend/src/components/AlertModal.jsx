import React, { useState, useEffect } from 'react';
import { X, Trash2, BellRing, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getWidgetAlerts, createWidgetAlert, deleteAlert } from '../services/api';

const AlertModal = ({ isOpen, onClose, widgetId, widgetName }) => {
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ condition: '<', threshold: '', tier: 'warning' });

  useEffect(() => {
    if (isOpen && widgetId) {
      fetchAlerts();
    }
  }, [isOpen, widgetId]);

  const fetchAlerts = async () => {
    try {
      const res = await getWidgetAlerts(widgetId);
      setAlerts(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách alerts", error);
    }
  };

  const handleAddAlert = async (e) => {
    e.preventDefault();
    if (!newAlert.threshold) return;
    
    try {
      await createWidgetAlert(widgetId, {
        condition: newAlert.condition,
        threshold: parseFloat(newAlert.threshold),
        tier: newAlert.tier
      });
      setNewAlert({ condition: '<', threshold: '', tier: 'warning' }); // Reset form
      fetchAlerts(); // Cập nhật lại list
    } catch (error) {
      alert("Lỗi khi tạo cảnh báo");
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await deleteAlert(alertId);
      fetchAlerts();
    } catch (error) {
      console.error("Lỗi xóa alert", error);
    }
  };

  const TierIcon = ({ tier }) => {
    if (tier === 'info') return <Info size={16} className="text-blue-500" />;
    if (tier === 'warning') return <AlertTriangle size={16} className="text-yellow-500" />;
    return <AlertOctagon size={16} className="text-red-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      {/* z-[60] để nổi lên trên cả các modal khác nếu có */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BellRing className="text-gray-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Cảnh báo: {widgetName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Form thêm mới */}
          <form onSubmit={handleAddAlert} className="flex gap-2 mb-6 items-end bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nếu giá trị</label>
              <select className="w-16 p-2 text-sm border border-gray-300 rounded-md outline-none"
                value={newAlert.condition} onChange={e => setNewAlert({...newAlert, condition: e.target.value})}>
                <option value="<">Nhỏ hơn {'<'}</option>
                <option value=">">Lớn hơn {'>'}</option>
                <option value="==">Bằng {'=='}</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Ngưỡng (Số)</label>
              <input type="number" required placeholder="VD: 19000000" className="w-full p-2 text-sm border border-gray-300 rounded-md outline-none"
                value={newAlert.threshold} onChange={e => setNewAlert({...newAlert, threshold: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Gửi Email mức</label>
              <select className="w-28 p-2 text-sm border border-gray-300 rounded-md outline-none"
                value={newAlert.tier} onChange={e => setNewAlert({...newAlert, tier: e.target.value})}>
                <option value="info">Thông báo</option>
                <option value="warning">Cảnh báo</option>
                <option value="alert">Khẩn cấp</option>
              </select>
            </div>

            <button type="submit" className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium text-sm h-[38px] px-4">
              Thêm
            </button>
          </form>

          {/* Danh sách Alert hiện có */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Các quy tắc đang chạy</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 italic">Chưa có cảnh báo nào được cài đặt.</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <TierIcon tier={alert.tier} />
                    <span>
                      Khi dữ liệu <strong>{alert.condition} {new Intl.NumberFormat('vi-VN').format(alert.threshold)}</strong>
                    </span>
                  </div>
                  <button onClick={() => handleDelete(alert.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AlertModal;