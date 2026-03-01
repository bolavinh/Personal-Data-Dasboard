import React, { useState } from 'react';
import axios from 'axios';
import { X, CheckCircle, AlertCircle, Play } from 'lucide-react';

const AddWidgetModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Finance',
    api_url: '',
    fetch_interval: 15,
    data_mapping: '$.'
  });

  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!formData.api_url || !formData.data_mapping) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      // Gọi lên Backend proxy để test
      const res = await axios.post('http://localhost:8000/api/widgets/test', {
        api_url: formData.api_url,
        data_mapping: formData.data_mapping
      });
      setTestResult(res.data);
    } catch (error) {
      setTestResult({ success: false, message: "Lỗi kết nối tới server test." });
    }
    setIsTesting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Gọi API tạo mới Widget thực sự
      await axios.post('http://localhost:8000/api/widgets', formData);
      onSaveSuccess(); // Refresh lại dashboard
      onClose();       // Đóng modal
    } catch (error) {
      alert("Lỗi khi lưu Widget!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Thêm API Widget mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        {/* Body có thể cuộn */}
        <div className="p-5 overflow-y-auto flex-1">
          <form id="widgetForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Widget (VD: Giá Vàng)</label>
                <input required type="text" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Finance">Tài chính (Vàng, Xăng, Ngoại tệ)</option>
                  <option value="Weather">Thời tiết & Môi trường</option>
                  <option value="Custom">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource URL (API)</label>
              <input required type="url" placeholder="https://api.example.com/data" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={formData.api_url} onChange={e => setFormData({...formData, api_url: e.target.value})} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Mapping (JSONPath)</label>
                <input required type="text" placeholder="$.data.current_price" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={formData.data_mapping} onChange={e => setFormData({...formData, data_mapping: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chu kỳ (Phút)</label>
                <input required type="number" min="1" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={formData.fetch_interval} onChange={e => setFormData({...formData, fetch_interval: parseInt(e.target.value)})} />
              </div>
            </div>
          </form>

          {/* Khu vực Test JSONPath */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Kiểm tra trích xuất dữ liệu</h3>
              <button type="button" onClick={handleTest} disabled={isTesting || !formData.api_url} 
                className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 disabled:opacity-50 text-sm font-medium">
                <Play size={14} /> {isTesting ? 'Đang test...' : 'Test API'}
              </button>
            </div>

            {/* Hiển thị kết quả test */}
            {testResult && (
              <div className={`p-3 rounded-md text-sm ${testResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                {testResult.success ? (
                  <>
                    <div className="flex items-center gap-2 mb-2 font-semibold">
                      <CheckCircle size={16} /> Bóc tách thành công!
                    </div>
                    <p>Dữ liệu thô tìm thấy: <span className="font-mono bg-white px-1 rounded border">{String(testResult.extracted_raw)}</span></p>
                    <p className="mt-1">Sau khi chuẩn hóa (lưu DB): <strong className="text-lg">{testResult.normalized_value}</strong></p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2 font-semibold">
                      <AlertCircle size={16} /> Lỗi trích xuất
                    </div>
                    <p>{testResult.message}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Hủy</button>
          <button type="submit" form="widgetForm" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">Lưu Widget</button>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;