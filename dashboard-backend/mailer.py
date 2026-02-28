# mailer.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
load_dotenv()

# Cấu hình Email của bạn (Trong thực tế nên dùng file .env để bảo mật)
GMAIL_SENDER = os.getenv("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
RECEIVER_EMAIL = os.getenv("RECEIVER_EMAIL")

def send_alert_email(widget_name: str, condition: str, threshold: float, current_value: float, tier: str):
    # Định dạng tiêu đề dựa trên Tier
    subject_prefix = {
        "info": "[INFO] ℹ️",
        "warning": "[WARNING] ⚠️",
        "alert": "[ALERT] 🚨"
    }.get(tier.lower(), "[NOTICE]")

    subject = f"{subject_prefix} Biến động từ Dashboard: {widget_name}"
    
    # Nội dung Email
    body = f"""
    Hệ thống Dashboard vừa phát hiện sự kiện đáng chú ý:
    
    📊 Widget: {widget_name}
    📈 Giá trị hiện tại: {current_value}
    ⚙️ Điều kiện vi phạm: {condition} {threshold}
    🔴 Mức độ: {tier.upper()}
    
    Vui lòng kiểm tra lại Dashboard của bạn!
    """

    msg = MIMEMultipart()
    msg['From'] = GMAIL_SENDER
    msg['To'] = RECEIVER_EMAIL
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        # Kết nối tới server Gmail
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls() # Mã hóa đường truyền
        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"📧 Đã gửi email cảnh báo ({tier}) cho '{widget_name}' thành công!")
    except Exception as e:
        print(f"❌ Lỗi khi gửi email: {e}")