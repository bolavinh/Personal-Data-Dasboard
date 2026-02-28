import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Thay bằng URL Backend của bạn

export const getWidgets = () => axios.get(`${API_BASE_URL}/widgets`);
export const updateWidgetLayout = (layouts) => axios.put(`${API_BASE_URL}/widgets/layout`, layouts);
export const getWidgetHistory = (id) => axios.get(`${API_BASE_URL}/widgets/${id}/history`);
export const createWidget = (data) => axios.post(`${API_BASE_URL}/widgets`, data);

export const deleteWidget = (id) => axios.delete(`${API_BASE_URL}/widgets/${id}`);


export const getWidgetAlerts = (widgetId) => axios.get(`${API_BASE_URL}/widgets/${widgetId}/alerts`);
export const createWidgetAlert = (widgetId, data) => axios.post(`${API_BASE_URL}/widgets/${widgetId}/alerts`, data);
export const deleteAlert = (alertId) => axios.delete(`${API_BASE_URL}/alerts/${alertId}`);
// Thêm các API cài đặt Alert sau...

