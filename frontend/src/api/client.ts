/**
 * API base URL. In development, use Vite proxy (/api) or VITE_BACKEND_URL.
 * In production, set VITE_BACKEND_URL to your backend URL.
 */
const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_BACKEND_URL;
  if (url && String(url).trim()) {
    return String(url).replace(/\/$/, '');
  }
  return '/api';
};

const baseUrl = getBaseUrl();

export interface LoginResponse {
  token: string;
  user?: { user_id: string; email: string; role?: string };
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface ApiError {
  error?: string;
  message?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Login failed');
  }
  return data;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Registration failed');
  }
  return data;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as ApiError;
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data as T;
}

export interface AdminDevice {
  device_id: string;
  name: string;
  location_description?: string | null;
  status?: string | null;
  door_status?: boolean | null;
  last_checkin_time?: string | null;
  default_temperature?: number | string | null;
}

export interface DeviceAlert {
  alert_id: string;
  device_id: string;
  timestamp: string;
  alert_type: string;
  message: string;
  status_id: number;
}

export interface DeviceTelemetry {
  telemetry_id: string;
  device_id: string;
  timestamp: string;
  internal_temperature: number;
  door_sensor_status: boolean;
}

export interface DeviceInventoryItem {
  product_id: string;
  product_name: string;
  brand_name?: string | null;
  current_stock: number;
  critic_stock: number;
  last_stock_update?: string | null;
}

export interface TransactionItem {
  transaction_item_id: string;
  product_id: string;
  quantity: number;
  action_type?: string | null;
  product?: { name?: string | null } | null;
}

export interface DeviceTransaction {
  transaction_id: string;
  device_id: string;
  start_time: string;
  end_time?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  items?: TransactionItem[] | null;
}

export interface SysadminAdmin {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  role_id: string | number;
  active?: boolean;
}

export interface DeviceAssignment {
  assignment_id: string;
  device_id: string;
  admin_user_id: string;
  is_active: boolean;
  device?: { device_id: string; name?: string | null } | null;
}

export async function getAdminDevices(): Promise<AdminDevice[]> {
  return apiRequest<AdminDevice[]>('/devices');
}

export async function getDeviceAlerts(deviceId: string, statusId?: number): Promise<DeviceAlert[]> {
  const query = statusId !== undefined ? `?status_id=${statusId}` : '';
  return apiRequest<DeviceAlert[]>(`/devices/${deviceId}/alerts${query}`);
}

export async function getDeviceTelemetry(deviceId: string, limit = 20): Promise<DeviceTelemetry[]> {
  return apiRequest<DeviceTelemetry[]>(`/devices/${deviceId}/telemetry?limit=${limit}`);
}

export async function getDeviceInventory(deviceId: string): Promise<DeviceInventoryItem[]> {
  return apiRequest<DeviceInventoryItem[]>(`/devices/${deviceId}/inventory`);
}

export async function getDeviceTransactions(deviceId: string, limit = 100): Promise<DeviceTransaction[]> {
  return apiRequest<DeviceTransaction[]>(`/devices/${deviceId}/transactions?limit=${limit}`);
}

export async function updateAlert(alertId: string, statusId: number, message?: string): Promise<DeviceAlert> {
  return apiRequest<DeviceAlert>(`/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status_id: statusId, message }),
  });
}

export async function getSysadminAdmins(): Promise<SysadminAdmin[]> {
  return apiRequest<SysadminAdmin[]>('/admins');
}


export async function createSysadminAdmin(payload: {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  role_id?: string | number;
}): Promise<SysadminAdmin> {
  return apiRequest<SysadminAdmin>('/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSysadminAdmin(adminId: string, payload: {
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: string | number;
  active?: boolean;
  password?: string;
}): Promise<SysadminAdmin> {
  return apiRequest<SysadminAdmin>(`/admins/${adminId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSysadminAdmin(adminId: string): Promise<{ message: string; user_id: string }> {
  return apiRequest<{ message: string; user_id: string }>(`/admins/${adminId}`, {
    method: 'DELETE',
  });
}

export async function getSysadminDevices(): Promise<AdminDevice[]> {
  return apiRequest<AdminDevice[]>('/devices');
}

export async function getSysadminAssignments(): Promise<DeviceAssignment[]> {
  return apiRequest<DeviceAssignment[]>('/assignments');
}

export async function createSysadminAssignment(payload: {
  device_id: string;
  admin_user_id: string;
}): Promise<DeviceAssignment> {
  return apiRequest<DeviceAssignment>('/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSysadminAssignment(assignmentId: string, payload: { is_active: boolean }): Promise<DeviceAssignment> {
  return apiRequest<DeviceAssignment>(`/assignments/${assignmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Get stored auth token (e.g. for API calls). */
export function getToken(): string | null {
  return localStorage.getItem('orvio_token');
}

/** Store token after login. */
export function setToken(token: string): void {
  localStorage.setItem('orvio_token', token);
}

/** Store current user role after login. */
export function setCurrentUserRole(role: string | number): void {
  localStorage.setItem('orvio_user_role', String(role));
}

/** Get current user role from storage. */
export function getCurrentUserRole(): string | null {
  return localStorage.getItem('orvio_user_role');
}

/** Clear token on logout. */
export function clearToken(): void {
  localStorage.removeItem('orvio_token');
  localStorage.removeItem('orvio_user_role');
}
