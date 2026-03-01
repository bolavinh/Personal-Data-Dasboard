# main.py
from fastapi import FastAPI, Depends, HTTPException, Query, APIRouter
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import models
from services import fetch_and_normalize
from datetime import datetime
from typing import List
import schemas
import requests
from jsonpath_ng.ext import parse


app = FastAPI()

# Cho phép React gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên để http://localhost:3000
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SCHEDULER SETUP ---
scheduler = BackgroundScheduler()

def fetch_data_job():
    print("Job đang chạy: Fetch dữ liệu từ các API...")
    # Logic dùng request + jsonpath-ng sẽ viết ở đây
    pass

# Khởi chạy Master Job mỗi 1 phút

def master_scheduler_job():
    print(f"[{datetime.now()}] Master Job đang kiểm tra các luồng fetch...")
    
    # Mở một session DB riêng cho job chạy ngầm
    db = models.SessionLocal()
    try:
        widgets = db.query(models.Widget).all()
        
        for widget in widgets:
            # Tìm log dữ liệu gần nhất của widget này
            last_log = (
                db.query(models.WidgetDataLog)
                .filter(models.WidgetDataLog.widget_id == widget.id)
                .order_by(models.WidgetDataLog.created_at.desc())
                .first()
            )

            # Nếu chưa có data bao giờ, HOẶC thời gian trôi qua >= fetch_interval (phút)
            if not last_log:
                print(f"Lần đầu fetch dữ liệu cho: {widget.name}")
                fetch_and_normalize(widget.id, db)
            else:
                time_diff_minutes = (datetime.utcnow() - last_log.created_at).total_seconds() / 60
                
                if time_diff_minutes >= widget.fetch_interval:
                    fetch_and_normalize(widget.id, db)
                    
    finally:
        db.close()

@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(master_scheduler_job, 'interval', minutes=1)
    scheduler.start()
    
    db = models.SessionLocal()
    try:
        # Tự động tạo 4 widget mặc định nếu DB trống
        if db.query(models.Widget).count() == 0:
            default_widgets = [
                models.Widget(name="Dự báo Thời tiết", widget_type="weather", category="System", api_url="frontend_fetch", fetch_interval=0, data_mapping="", layout={"x": 0, "y": 0, "w": 4, "h": 2}),
                models.Widget(name="Chất lượng Không khí (AQI)", widget_type="aqi", category="System", api_url="frontend_fetch", fetch_interval=0, data_mapping="", layout={"x": 4, "y": 0, "w": 2, "h": 2}),
                models.Widget(name="Giá Vàng Thế Giới (USD/oz)", widget_type="gold", category="Finance", api_url="https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT", fetch_interval=5, data_mapping="$.price", layout={"x": 6, "y": 0, "w": 2, "h": 2}),
                models.Widget(name="Tỷ giá USD/VND", widget_type="forex", category="Finance", api_url="https://api.exchangerate-api.com/v4/latest/USD", fetch_interval=60, data_mapping="$.rates.VND", layout={"x": 0, "y": 2, "w": 4, "h": 2})
            ]
            db.add_all(default_widgets)
            db.commit()
    finally:
        db.close()

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()

# --- API ENDPOINTS ---
@app.get("/widgets")
def get_widgets(db: Session = Depends(get_db)):
    return db.query(models.Widget).all()

# Lệnh chạy: uvicorn main:app --reload

@app.get("/api/widgets", response_model=List[schemas.WidgetDashboardResponse])
def get_dashboard_widgets(db: Session = Depends(get_db)):
    widgets = db.query(models.Widget).all()
    result = []
    
    for widget in widgets:
        # Lấy record mới nhất của từng widget
        latest_log = (
            db.query(models.WidgetDataLog)
            .filter(models.WidgetDataLog.widget_id == widget.id)
            .order_by(models.WidgetDataLog.created_at.desc())
            .first()
        )
        
        result.append({
            "id": widget.id,
            "name": widget.name,
            "category": widget.category,
            "layout": widget.layout,
            "latest_value": latest_log.normalized_value if latest_log else None,
            "last_updated": latest_log.created_at if latest_log else None
        })
        
    return result

# 2. API Lấy lịch sử dữ liệu để vẽ biểu đồ (Dùng khi mở rộng Widget)
@app.get("/api/widgets/{widget_id}/history", response_model=List[schemas.WidgetHistoryResponse])
def get_widget_history(
    widget_id: int, 
    limit: int = Query(50, description="Số lượng điểm dữ liệu trả về"), 
    db: Session = Depends(get_db)
):
    # Kiểm tra widget có tồn tại không
    widget = db.query(models.Widget).filter(models.Widget.id == widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Không tìm thấy Widget")

    # Lấy dữ liệu mới nhất theo limit
    logs = (
        db.query(models.WidgetDataLog)
        .filter(models.WidgetDataLog.widget_id == widget_id)
        .order_by(models.WidgetDataLog.created_at.desc())
        .limit(limit)
        .all()
    )
    
    # Đảo ngược mảng để dữ liệu sắp xếp theo thứ tự thời gian từ cũ đến mới (trái sang phải trên biểu đồ)
    chronological_logs = logs[::-1] 
    
    return chronological_logs

@app.post("/api/widgets/test")
def test_widget_api(req: schemas.TestWidgetRequest):
    print(f"\n--- BẮT ĐẦU TEST API ---")
    print(f"1. URL: {req.api_url}")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://btmc.vn/", # Rất quan trọng với API của BTMC
            "Connection": "keep-alive"
        }
        
        print("2. Đang gửi request...")
        # Đặt timeout chuẩn: 5s để kết nối, 10s để chờ dữ liệu (tránh bị Tarpit treo vĩnh viễn)
        response = requests.get(req.api_url, headers=headers, timeout=(5, 10))
        
        print(f"3. Đã nhận phản hồi! Status Code: {response.status_code}")
        response.raise_for_status()

        print("4. Đang Parse JSON...")
        data = response.json()

        print("5. Đang chạy JSONPath...")
        jsonpath_expression = parse(req.data_mapping)
        match = jsonpath_expression.find(data)

        if not match:
            print("-> Lỗi: Cú pháp JSONPath không khớp.")
            return {"success": False, "message": "Không tìm thấy dữ liệu khớp với JSONPath"}

        raw_value = match[0].value
        print(f"6. Lấy được dữ liệu thô: {raw_value}")
        
        # Chuẩn hóa
        cleaned_string = ''.join(c for c in str(raw_value) if c.isdigit() or c in ['.', '-'])
        normalized_value = float(cleaned_string) if cleaned_string else 0.0
        
        print(f"7. Thành công! Trả dữ liệu về React.")
        return {
            "success": True, 
            "extracted_raw": raw_value, 
            "normalized_value": normalized_value,
            # Cắt ngắn dữ liệu trả về Frontend để tránh làm đơ/crash thẻ Modal của React
            "raw_data": str(data)[:300] + "... (đã cắt bớt)" 
        }

    except requests.exceptions.Timeout:
        print("-> LỖI: Timeout (Server bên kia không phản hồi).")
        return {"success": False, "message": "Lỗi: API phản hồi quá chậm hoặc chặn kết nối."}
    except requests.exceptions.RequestException as e:
        print(f"-> LỖI Request: {e}")
        return {"success": False, "message": f"Bị chặn hoặc lỗi mạng: {e}"}
    except ValueError:
        print("-> LỖI: Server không trả về JSON hợp lệ (có thể trả về HTML cảnh báo).")
        return {"success": False, "message": "Lỗi: Nguồn dữ liệu không phải là chuẩn JSON."}
    except Exception as e:
        print(f"-> LỖI Code: {e}")
        return {"success": False, "message": f"Lỗi hệ thống bóc tách: {e}"}
    
    
@app.get("/api/widgets/{widget_id}/alerts", response_model=List[schemas.AlertRuleResponse])
def get_alerts(widget_id: int, db: Session = Depends(get_db)):
    return db.query(models.AlertRule).filter(models.AlertRule.widget_id == widget_id).all()

@app.post("/api/widgets/{widget_id}/alerts", response_model=schemas.AlertRuleResponse)
def create_alert(widget_id: int, rule: schemas.AlertRuleCreate, db: Session = Depends(get_db)):
    # rule.dict() sẽ unpack: condition, threshold, tier
    new_rule = models.AlertRule(widget_id=widget_id, **rule.dict())
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    db.query(models.AlertRule).filter(models.AlertRule.id == alert_id).delete()
    db.commit()
    return {"success": True, "message": "Đã xóa cảnh báo"}

@app.post("/api/widgets")
def create_widget(widget: schemas.WidgetCreate, db: Session = Depends(get_db)):
    # Thay Infinity bằng 999
    default_layout = {"x": 0, "y": 999, "w": 2, "h": 2} 

    new_widget = models.Widget(
        name=widget.name,
        category=widget.category,
        api_url=widget.api_url,
        fetch_interval=widget.fetch_interval,
        data_mapping=widget.data_mapping,
        layout=default_layout  # Đã sửa ở đây
    )
    db.add(new_widget)
    db.commit()
    db.refresh(new_widget)
    
    # Kích hoạt Fetcher chạy ngay lập tức lần đầu tiên
    from services import fetch_and_normalize
    fetch_and_normalize(new_widget.id, db)
    
    return {"success": True, "message": "Đã tạo Widget thành công", "id": new_widget.id}

@app.delete("/api/widgets/{widget_id}")
def delete_widget(widget_id: int, db: Session = Depends(get_db)):
    # 1. Tìm widget cần xóa
    widget = db.query(models.Widget).filter(models.Widget.id == widget_id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Không tìm thấy Widget")

    # 2. Xóa tất cả lịch sử dữ liệu (Data Logs) của widget này
    db.query(models.WidgetDataLog).filter(models.WidgetDataLog.widget_id == widget_id).delete()
    
    # 3. Xóa tất cả các cảnh báo (Alert Rules) của widget này
    db.query(models.AlertRule).filter(models.AlertRule.widget_id == widget_id).delete()
    
    # 4. Xóa Widget chính
    db.delete(widget)
    db.commit()

    return {"success": True, "message": "Đã xóa Widget và dọn dẹp dữ liệu liên quan thành công"}