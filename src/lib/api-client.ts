"use client";

const BASE = "/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fluense_token");
}

async function request(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (res.status === 401) {
    localStorage.removeItem("fluense_token");
    window.location.href = "/login";
    return;
  }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getMe: () => request("/auth/me"),
  impersonate: (id: string) => request(`/auth/impersonate/${id}`, { method: "POST" }),

  // Users
  getUsers: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)));
    return request(`/users?${q}`);
  },
  getUser: (id: string) => request(`/users/${id}`),
  createUser: (data: Record<string, unknown>) =>
    request("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: Record<string, unknown>) =>
    request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  toggleStatus: (id: string) => request(`/users/${id}/toggle-status`, { method: "PATCH" }),
  uploadAvatar: (id: string, file: File) => {
    const form = new FormData(); form.append("file", file);
    return request(`/users/${id}/avatar`, { method: "POST", body: form });
  },

  // Regions
  getRegions: () => request("/regions"),

  // Attendance
  getAttendance: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)));
    return request(`/attendance?${q}`);
  },
  checkIn:  (location?: { lat: number; lng: number }) =>
    request("/attendance/check-in",  { method: "POST", body: JSON.stringify({ location }) }),
  checkOut: (location?: { lat: number; lng: number }) =>
    request("/attendance/check-out", { method: "POST", body: JSON.stringify({ location }) }),
  getTodaySummary: () => request("/attendance/today-summary"),

  // Visits
  getVisits: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)));
    return request(`/visits?${q}`);
  },
  logVisit: (data: Record<string, unknown>) =>
    request("/visits", { method: "POST", body: JSON.stringify(data) }),
  getVisitTrend: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)));
    return request(`/visits/trend?${q}`);
  },

  // Clients
  getClients: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v)));
    return request(`/clients?${q}`);
  },
  createClient: (data: Record<string, unknown>) =>
    request("/clients", { method: "POST", body: JSON.stringify(data) }),
  deleteClient: (id: string) => request(`/clients/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboardStats:   (params: Record<string, string> = {}) => { const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=>v))); return request(`/dashboard/stats?${q}`); },
  getMRPerformance:    (params: Record<string, string> = {}) => { const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=>v))); return request(`/dashboard/mr-performance?${q}`); },
  getProductStats:     (params: Record<string, string> = {}) => { const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=>v))); return request(`/dashboard/product-stats?${q}`); },
  getRegionComparison: (params: Record<string, string> = {}) => { const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=>v))); return request(`/dashboard/region-comparison?${q}`); },
  getGoals: (params: Record<string, string> = {}) => { const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=>v))); return request(`/dashboard/goals?${q}`); },
  createGoal: (data: Record<string, unknown>) => request("/dashboard/goals", { method: "POST", body: JSON.stringify(data) }),
};

export default api;
