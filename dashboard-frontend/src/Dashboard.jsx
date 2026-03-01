import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { getWidgets } from './services/api';
import { Plus } from 'lucide-react';
import AddWidgetModal from './components/AddWidgetModal'; // Import Modal

import GenericWidget from './components/GenericWidget';
import WeatherWidget from './components/widgets/WeatherWidget';
import AqiWidget from './components/widgets/AqiWidget';
import GoldWidget from './components/widgets/GoldWidget';
import ForexWidget from './components/widgets/ForexWidget';

// console.log("Widgets:", widgets);

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard = () => {
  const [widgets, setWidgets] = useState([]);
  const [layout, setLayout] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getWidgets();
      const fetchedWidgets = res.data;
      setWidgets(fetchedWidgets);
      console.log("Fetched widgets:", fetchedWidgets);
      // Khôi phục layout từ DB
      const loadedLayout = fetchedWidgets.map(w => ({
        i: w.id.toString(),
        ...(w.layout ? w.layout : { x: 0, y: Infinity, w: 4, h: 3 }) // Default nếu chưa có layout
      }));
      setLayout(loadedLayout);

    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
    }
  };

  const handleLayoutChange = async (newLayout) => {
    setLayout(newLayout);
    // Chuẩn bị dữ liệu để gửi xuống Backend lưu lại
    const layoutUpdates = newLayout.map(item => ({
      id: parseInt(item.i),
      layout: { x: item.x, y: item.y, w: item.w, h: item.h }
    }));
    // await updateWidgetLayout(layoutUpdates); // Mở comment khi đã làm API PUT ở backend
  };

  const renderWidget = (widget) => {
    const type =
      widget.widget_type ||
      (widget.name.includes("Thời tiết") && "weather") ||
      (widget.name.includes("AQI") && "aqi");


    switch (type) {
      case 'weather':
        return <WeatherWidget widget={widget} />;
      case 'aqi':
        return <AqiWidget widget={widget} />;
      case 'gold':
        return <GoldWidget widget={widget} onDeleteSuccess={fetchData} />;
      case 'forex':
        return <ForexWidget widget={widget} onDeleteSuccess={fetchData} />;
      default:
        // 'custom' - Các Widget người dùng tự thêm
        return <GenericWidget widget={widget} onDeleteSuccess={fetchData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <div className="flex justify-between items-center mb-8 w-full">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">My Workspace</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
          <Plus size={20} /> Thêm Widget (API)
        </button>
      </div>

      <div className="w-full ">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={120}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".cursor-grab" // Chỉ kéo thả khi nắm vào những vùng không có tương tác
          isDraggable={true}
          isResizable={true}
        >
          {widgets.map((widget) => (
            <div key={widget.id.toString()} className="cursor-grab active:cursor-grabbing">
              {renderWidget(widget)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
      {/* Gắn Modal vào */}
      <AddWidgetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSaveSuccess={() => {
          fetchData(); // Tải lại danh sách widget sau khi lưu thành công
        }}
      />
    </div>
  );
};

export default Dashboard;