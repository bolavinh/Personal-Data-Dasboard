# schemas.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Lịch sử dữ liệu dùng để vẽ biểu đồ
class WidgetHistoryResponse(BaseModel):
    id: int
    normalized_value: float
    created_at: datetime

    class Config:
        from_mode = True

# Thông tin Widget kèm giá trị mới nhất dùng cho màn hình chính
class WidgetDashboardResponse(BaseModel):
    id: int
    name: str
    category: str
    layout: Optional[Dict[str, Any]] = None
    latest_value: Optional[float] = None
    last_updated: Optional[datetime] = None

    class Config:
        from_mode = True
        
class TestWidgetRequest(BaseModel):
    api_url: str
    data_mapping: str
    
class AlertRuleCreate(BaseModel):
    condition: str
    threshold: float
    tier: str

class AlertRuleResponse(AlertRuleCreate):
    id: int
    is_active: int
    last_triggered: Optional[datetime] = None

    class Config:
        from_mode = True
        
class WidgetCreate(BaseModel):
    name: str
    category: str
    api_url: str
    fetch_interval: int
    data_mapping: str