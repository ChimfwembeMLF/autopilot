const BASE_URL = import.meta.env.MODE === "production" ? "https://agriwide.gigalixirapp.com" : "";

const TOKEN_KEY = "ag_token";

/* =========================
   TOKEN HELPERS
========================= */

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/* =========================
   CORE REQUEST WRAPPER
========================= */

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers || {});

  // Ensure JSON by default
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
    credentials: "include",
  });

  if (!res.ok) {
    let body: any = {};

    try {
      body = await res.json();
    } catch { }

    throw new Error(
      body?.message?.error ||
      body?.description ||
      `Request failed (${res.status})`
    );
  }

  return res.json();
}

/* =========================
   AUTH
========================= */

export async function login(username: string, password: string) {
  const credentials = btoa(`${username}:${password}`);

  const res = await fetch(`${BASE_URL}/api/auth/log-in`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let body: any = {};

    try {
      body = await res.json();
    } catch { }

    throw new Error(body?.description || "Login failed");
  }

  const data = await res.json();

  const token = data?.data?.token;

  console.log('<<<<<<<<<<<<<<<<<<token<<<<<<<<<<<<<<<<<<<', token);
  if (token) setToken(token);

  return data.data;
}

export async function logout() {
  try {
    const token = getToken();

    if (token) {
      await fetch(`${BASE_URL}/api/logout`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }
  } finally {
    clearToken();
  }
}

// ---------------------------------------------------------------------
// Debug helper – call this anywhere (e.g., from a component or console) to
// verify that the token is persisted in localStorage and can be retrieved.
export function debugToken() {
  console.log("🗝️ Token from localStorage:", getToken());
}

// Make the helper globally accessible for quick console checks
if (typeof window !== "undefined") {
  (window as any).debugToken = debugToken;
}

/* =========================
   DASHBOARD
========================= */

export async function getDashboardStats() {
  return request<any>("/api/dashboard/stats");
}

export async function getRecentShipments(limit = 5) {
  return request<any>(
    `/api/dashboard/recent-shipments?limit=${limit}`
  );
}

/* =========================
   SHIPMENTS
========================= */

export async function getAssignedShipments(
  page = 1,
  pageSize = 20,
  status?: string
) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (status) params.set("status", status);

  return request<any>(`/api/shipments/assigned?${params}`);
}

export async function getShipment(id: number | string) {
  return request<any>(`/api/shipments/${id}`);
}

export async function getCourierOrders(courierCode: string) {
  return request<any>(`/api/shipments/orders/${courierCode}`);
}

export async function verifyShipment(data: {
  order_id: number;
  verification_code: string;
  notes?: string;
}) {
  return request<any>("/api/shipments/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getVerificationStatus(
  shipmentId: number | string
) {
  return request<any>(
    `/api/shipments/${shipmentId}/verification_status`
  );
}

/* =========================
   PROFILE
========================= */

export async function getProfile() {
  return request<any>("/api/user/profile");
}

export async function updateProfile(user: Record<string, string>) {
  return request<any>("/api/user/profile", {
    method: "PUT",
    body: JSON.stringify({ user }),
  });
}

export async function changePassword(data: {
  password: string;
  current_password: string;
  password_confirmation: string;
}) {
  return request<any>("/api/user/change_password", {
    method: "PUT",
    body: JSON.stringify({ user: data }),
  });
}

export async function forgotPassword(email: string) {
  return request<any>("/api/user/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}