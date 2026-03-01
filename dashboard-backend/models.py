# models.py
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./dashboard.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Widget(Base):
    __tablename__ = "widgets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String) # gold, weather, crypto...
    widget_type = Column(String, default="custom")
    api_url = Column(String)
    fetch_interval = Column(Integer) # Tính bằng phút
    data_mapping = Column(String) # Ví dụ: $.current.temp_c
    layout = Column(JSON) # Lưu {x: 0, y: 0, w: 2, h: 2}

class WidgetDataLog(Base):
    __tablename__ = "widget_data_logs"
    id = Column(Integer, primary_key=True, index=True)
    widget_id = Column(Integer, ForeignKey("widgets.id"))
    normalized_value = Column(Float)
    raw_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(Integer, primary_key=True, index=True)
    widget_id = Column(Integer, ForeignKey("widgets.id"))
    condition = Column(String) # '>', '<', '=='
    threshold = Column(Float)
    tier = Column(String) # info, warning, alert
    is_active = Column(Integer, default=1) # 1: Bật, 0: Tắt
    last_triggered = Column(DateTime, nullable=True) # MỚI: Tránh gửi mail liên tục

# Tạo bảng
Base.metadata.create_all(bind=engine)