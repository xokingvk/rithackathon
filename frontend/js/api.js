/* ============================================================
   API client — thin wrapper around the FastAPI backend.
   Change API_BASE if the backend runs on a different host/port.
   ============================================================ */

const API_BASE = window.__API_BASE__ || 'http://localhost:8000/api';

async function apiRequest(path, { method = 'GET', body, isForm = false, params } = {}) {
  let url = `${API_BASE}${path}`;
  if (params) url += `?${new URLSearchParams(params)}`;

  const opts = { method, headers: {} };
  if (body) {
    if (isForm) {
      opts.body = body; // FormData sets its own content-type
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    let detail = res.statusText;
    try { const err = await res.json(); detail = err.detail || detail; } catch (_) {}
    throw new Error(detail);
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.blob();
}

const api = {
  // Battery health analytics
  uploadCsv: (file, batteryId) => {
    const fd = new FormData();
    fd.append('file', file);
    if (batteryId) fd.append('battery_id', batteryId);
    return apiRequest('/battery/upload-csv', { method: 'POST', body: fd, isForm: true });
  },
  submitManualEntry: (payload) =>
    apiRequest('/battery/manual-entry', { method: 'POST', body: payload }),
  getHealthEstimate: (batteryId) =>
    apiRequest(`/battery/${batteryId}/health`),
  getRulPrediction: (batteryId) =>
    apiRequest(`/battery/${batteryId}/rul`),
  getChargingAnalysis: (batteryId) =>
    apiRequest(`/battery/${batteryId}/charging`),

  // Dashboard
  getKpis: () => apiRequest('/dashboard/kpis'),
  getSohTrend: (batteryId) => apiRequest('/dashboard/charts/soh-trend', { params: batteryId ? { battery_id: batteryId } : {} }),
  getDegradationTrend: (batteryId) => apiRequest('/dashboard/charts/degradation', { params: batteryId ? { battery_id: batteryId } : {} }),
  getChargingEfficiency: (batteryId) => apiRequest('/dashboard/charts/charging-efficiency', { params: batteryId ? { battery_id: batteryId } : {} }),
  getAlerts: () => apiRequest('/dashboard/alerts'),

  // Reports
  listReports: () => apiRequest('/reports'),
  downloadReport: (reportId) => apiRequest(`/reports/${reportId}/download`),
  generateReport: (batteryId) => apiRequest('/reports/generate', { method: 'POST', body: { battery_id: batteryId } }),

  // Fleet
  listFleet: () => apiRequest('/fleet'),
  getFleetSummary: () => apiRequest('/fleet/summary'),
  getBatteryDetail: (batteryId) => apiRequest(`/fleet/${batteryId}`),

  // Chatbot
  sendChatMessage: (message, context) =>
    apiRequest('/chatbot/message', { method: 'POST', body: { message, context } }),
};
