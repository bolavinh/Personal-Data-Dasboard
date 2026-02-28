# Personal Data Dashboard

Một ứng dụng Dashboard cá nhân hóa giúp theo dõi giá vàng, tỷ giá ngoại tệ, thời tiết và các API tùy chỉnh trong một giao diện duy nhất. Hỗ trợ kéo thả Widget và hệ thống cảnh báo qua Gmail.

## **Tính năng chính**
- Widget Dashboard: Theo dõi dữ liệu thực tế (Vàng, USD, Thời tiết...).

- Drag & Drop: Tùy chỉnh vị trí và kích thước Widget theo ý muốn.

- Normalizer Layer: Trích xuất dữ liệu từ bất kỳ API nào bằng JSONPath.

- Smart Alert: Cài đặt ngưỡng cảnh báo và nhận thông báo qua Gmail (có chế độ chống spam).

- Hybrid Data: Hỗ trợ cả dữ liệu lưu trữ lịch sử và dữ liệu thời gian thực từ API ngoài.

## **Cài đặt & Chạy ứng dụng**

### **1. Backend(FastAPI + Python)**
- Python 3.9+
```
cd dashboard-backend

# Khởi tạo môi trường ảo
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Cài đặt thư viện
pip install fastapi uvicorn sqlalchemy apscheduler requests jsonpath-ng python-dotenv

# Cấu hình môi trường
# Tạo file .env và điền thông tin Gmail của bạn (app password, 

# Chạy Server
uvicorn main:app --reload
```

### **2. Frontend(React+Vite)**
- Node.js 18+
```
cd dashboard-frontend

# Cài đặt thư viện
npm install

# Các thư viện chính đã sử dụng:
# npm install react-grid-layout recharts lucide-react axios tailwindcss

# Chạy ứng dụng
npm run dev
```

## **3. Hướng dẫn sử dụng**
- Thêm các API bằng nút **[Thêm Widget (API)]**
![alt text](/image/image.png)
- Điền thông tin bao gồm
    - Tên Widget(VD: Giá vàng, nhiệt độ, giá xăng)
    - Danh mục (VD: Tài chính,...)
    - Resource URL(địa chỉ API để lấy dữ liệu dạng Json)
    - Data Mapping(JsonPath đường dẫn key dữ liệu để lấy value, VD: **$.DataList.Data[45]."data123"**  )
    - Chu kỳ(Phút): Chu kỳ backend fetch dữ liệu 
-  Nút **[Test API]** để fetch thử dữ liệu từ API được cung cấp xem đã đúng chưa
- **Lưu Widget** và widget mới có thể kéo thả, mở rộng trên dashboard