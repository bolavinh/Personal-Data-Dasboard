# services.py
import requests
from jsonpath_ng.ext import parse
from datetime import datetime, timedelta
import models
from mailer import send_alert_email

def fetch_and_normalize(widget_id: int, db):
    # 1. Lấy cấu hình Widget từ DB
    widget = db.query(models.Widget).filter(models.Widget.id == widget_id).first()
    if not widget:
        return

    if widget.api_url == "frontend_fetch" or widget.category == "System":
        return

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01"
        }
        # 2. Data Fetcher: Gọi external API
        # Timeout 10s để tránh việc một API bị treo làm kẹt toàn bộ hệ thống
        response = requests.get(widget.api_url, timeout=10)
        response.raise_for_status() 
        data = response.json()

        # 3. Normalizer Layer: Trích xuất dữ liệu bằng JSONPath
        # Ví dụ mapping: '$.current.temp_c' hoặc '$.rates.VND'
        jsonpath_expression = parse(widget.data_mapping)
        match = jsonpath_expression.find(data)

        if not match:
            print(f"[Warning] Không tìm thấy data cho mapping '{widget.data_mapping}' ở widget ID {widget.id}")
            return

        # Lấy kết quả đầu tiên match được
        raw_value = match[0].value

        # --- CHUẨN HÓA DỮ LIỆU ---
        # API có thể trả về string "79,000 VND", "25°C", "1,200.5". 
        # Cần lọc bỏ chữ, giữ lại số, dấu chấm (thập phân) và dấu trừ (âm) để ép kiểu Float.
        cleaned_string = ''.join(c for c in str(raw_value) if c.isdigit() or c in ['.', '-'])
        normalized_value = float(cleaned_string) if cleaned_string else 0.0

        # 4. Lưu lịch sử vào SQLite
        new_log = models.WidgetDataLog(
            widget_id=widget.id,
            normalized_value=normalized_value,
            raw_json=data, # Lưu lại toàn bộ response để fallback hoặc debug sau này
            created_at=datetime.utcnow()
        )
        db.add(new_log)
        db.commit()

        print(f"[Success] Đã cập nhật '{widget.name}': {normalized_value}")

        # 5. Gọi Alert Engine (Chúng ta sẽ code phần này sau)
        check_alerts(widget.id, normalized_value, db)

    except requests.exceptions.RequestException as e:
        print(f"[Error] Lỗi kết nối API của widget '{widget.name}': {e}")
    except ValueError as e:
        print(f"[Error] Không thể ép kiểu dữ liệu thu được thành số cho widget '{widget.name}': {e}")
    except Exception as e:
        print(f"[Error] Lỗi không xác định ở widget '{widget.name}': {e}")
        
# Cooldown time: Không gửi lại cảnh báo tương tự trong vòng 60 phút
COOLDOWN_MINUTES = 60 

def check_alerts(widget_id: int, current_value: float, db):
    # Lấy thông tin widget để biết tên
    widget = db.query(models.Widget).filter(models.Widget.id == widget_id).first()
    if not widget:
        return

    # Lấy tất cả các rule ĐANG HOẠT ĐỘNG của widget này
    rules = db.query(models.AlertRule).filter(
        models.AlertRule.widget_id == widget_id,
        models.AlertRule.is_active == 1
    ).all()

    now = datetime.utcnow()

    for rule in rules:
        is_triggered = False

        # 1. Đánh giá điều kiện
        if rule.condition == '>' and current_value > rule.threshold:
            is_triggered = True
        elif rule.condition == '<' and current_value < rule.threshold:
            is_triggered = True
        elif rule.condition == '==' and current_value == rule.threshold:
            is_triggered = True

        # 2. Xử lý gửi mail nếu thỏa mãn điều kiện
        if is_triggered:
            # Kiểm tra thời gian Cooldown để tránh spam
            if rule.last_triggered is None or (now - rule.last_triggered) > timedelta(minutes=COOLDOWN_MINUTES):
                
                # Gọi hàm gửi mail
                send_alert_email(
                    widget_name=widget.name,
                    condition=rule.condition,
                    threshold=rule.threshold,
                    current_value=current_value,
                    tier=rule.tier
                )

                # Cập nhật thời gian gửi mail cuối cùng vào DB
                rule.last_triggered = now
                db.commit()
            else:
                print(f"⏳ Cảnh báo '{widget.name}' đang trong thời gian cooldown, bỏ qua gửi mail.")