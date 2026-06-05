const API_BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function login(userName, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function register(userName, password) {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

export async function getStockInRecords(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/stockin?${query}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stock in records');
  return res.json();
}

export async function createStockIn(data) {
  const res = await fetch(`${API_BASE}/stockin`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create stock in record');
  }
  return res.json();
}

export async function updateStockIn(id, data) {
  const res = await fetch(`${API_BASE}/stockin/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update stock in record');
  }
  return res.json();
}

export async function deleteStockIn(id) {
  const res = await fetch(`${API_BASE}/stockin/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete stock in record');
  }
  return res.json();
}

export async function updateStockOut(id, data) {
  const res = await fetch(`${API_BASE}/stockout/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update stock out record');
  }
  return res.json();
}

export async function deleteStockOut(id) {
  const res = await fetch(`${API_BASE}/stockout/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete stock out record');
  }
  return res.json();
}

export async function getCurrentStock() {
  const res = await fetch(`${API_BASE}/stockin/current-stock`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch current stock');
  return res.json();
}

export async function getStockOutRecords(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/stockout?${query}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stock out records');
  return res.json();
}

export async function createStockOut(data) {
  const res = await fetch(`${API_BASE}/stockout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create stock out record');
  }
  return res.json();
}

export async function getAvailableItems() {
  const res = await fetch(`${API_BASE}/stockout/available-items`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch available items');
  return res.json();
}
