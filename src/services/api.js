const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getHeaders = () => {
  const companyId = localStorage.getItem("currentCompanyId") || "1";
  const token = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
    "X-Company-ID": companyId
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response, defaultMsg = "Request failed") => {
  if (!response.ok) {
    let errData;
    try {
      errData = await response.json();
    } catch (e) {
      throw new Error(`Server Error (${response.status}): Could not parse response.`);
    }
    throw new Error(errData.detail || defaultMsg);
  }
  return response.json();
};

export const procurementApi = {
  // --- Session & Active Role Context ---
  whoami: async () => {
    const response = await fetch(`${API_BASE_URL}/session/whoami`, { headers: getHeaders() });
    return handleResponse(response, "Session Context Error");
  },

  // --- Companies ---
  getCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/`, { headers: getHeaders() });
    return handleResponse(response, "Failed to fetch companies");
  },

  getPublicCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/public`);
    return handleResponse(response, "Failed to fetch public companies");
  },

  onboardCompany: async (data) => {
    const response = await fetch(`${API_BASE_URL}/companies/onboard`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, "Onboarding failed");
  },
  createCompany: async (data) => {
    // Alias for onboarding a new company tenant
    return procurementApi.onboardCompany(data);
  },

  updateCompany: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, "Update failed");
  },

  getSettings: async (companyId) => {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/settings`, { headers: getHeaders() });
    return handleResponse(response, "Failed to fetch settings");
  },

  updateSettings: async (companyId, threshold) => {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/settings?threshold=${threshold}`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response, "Update failed");
  },

  // --- Procurement ---
  getRequests: async (skip = 0, limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/requests/?skip=${skip}&limit=${limit}`, { headers: getHeaders() });
    const data = await handleResponse(response, "Unauthorized/Forbidden Context");
    return data.items || data;
  },

  getRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, { headers: getHeaders() });
    return handleResponse(response, "Request not found in this tenant.");
  },

  getAuditLogs: async (id) => {
    const response = await fetch(`${API_BASE_URL}/requests/${id}/audit`, { headers: getHeaders() });
    return response.json();
  },

  generatePO: async (id) => {
    const response = await fetch(`${API_BASE_URL}/requests/${id}/generate-po`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to generate PO");
    return response.blob();
  },

  updateRequest: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, "Update failed");
  },

  createRequest: async (data) => {
    const response = await fetch(`${API_BASE_URL}/requests/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, "Creation failed");
  },

  transitionStatus: async (requestId, action, notes) => {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/transition`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ action: action || "Transition", notes: notes || undefined }),
    });
    return handleResponse(response, "Transition failed: Role or Policy check error.");
  },

  // --- Vendors ---
  getVendors: async () => {
    const response = await fetch(`${API_BASE_URL}/vendors/`, { headers: getHeaders() });
    return handleResponse(response, "Failed to fetch vendors");
  },

  createVendor: async (data) => {
    const response = await fetch(`${API_BASE_URL}/vendors/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, "Failed to register vendor");
  },

  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: getHeaders() });
    return handleResponse(response, "Failed to fetch stats");
  },

  getRecentAuditLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/audit/recent`, { headers: getHeaders() });
    return handleResponse(response, "Failed to fetch logs");
  },

  // --- Petty Cash ---
  getPettyCash: async () => {
    const response = await fetch(`${API_BASE_URL}/petty-cash/`, { headers: getHeaders() });
    return handleResponse(response, "Failed to fetch petty cash");
  },

  createPettyCash: async (data) => {
    const response = await fetch(`${API_BASE_URL}/petty-cash/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, "Petty Cash submission failed");
  },

  approvePettyCash: async (pcId) => {
    const response = await fetch(`${API_BASE_URL}/petty-cash/${pcId}/approve`, {
      method: "POST",
      headers: getHeaders(),
    });
    return response.json();
  },

  disbursePettyCash: async (pcId) => {
    const response = await fetch(`${API_BASE_URL}/petty-cash/${pcId}/disburse`, {
      method: "POST",
      headers: getHeaders(),
    });
    return response.json();
  },

  // --- Users & Auth ---
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/session/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Authentication Failed");
    }
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("accessToken", data.access_token);
    }
    return data;
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/session/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/session/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration Failed");
    }
    return response.json();
  },

  onboardUser: async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/onboard`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "User Creation Failed");
    }
    return response.json();
  },

  getUsers: async (skip = 0, limit = 50) => {
    const response = await fetch(`${API_BASE_URL}/users/?skip=${skip}&limit=${limit}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Unauthorized to access user directory");
    const data = await response.json();
    return data.items || data;
  },

  updateUser: async (userId, data) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("User update failed");
    return response.json();
  },

  changePassword: async (newPassword) => {
    const response = await fetch(`${API_BASE_URL}/session/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ new_password: newPassword }),
    });
    if (!response.ok) throw new Error("Password change failed");
    return response.json();
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    // We don't use getHeaders() directly because it sets Content-Type to JSON
    const token = localStorage.getItem("accessToken");
    const companyId = localStorage.getItem("currentCompanyId") || "1";

    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Company-ID": companyId
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "File Upload Failed");
    }
    return response.json();
  }
}
