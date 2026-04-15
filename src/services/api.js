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

export const procurementApi = {
  // --- Session & Active Role Context ---
  whoami: async () => {
    const response = await fetch(`${API_BASE_URL}/session/whoami`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Session Context Error");
    return response.json();
  },

  // --- Companies ---
  getCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch companies");
    return response.json();
  },

  getPublicCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/public`);
    if (!response.ok) throw new Error("Failed to fetch public companies");
    return response.json();
  },

  onboardCompany: async (data) => {
    const response = await fetch(`${API_BASE_URL}/companies/onboard`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Onboarding failed");
    return response.json();
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
    if (!response.ok) throw new Error("Update failed");
    return response.json();
  },

  getSettings: async (companyId) => {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/settings`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },

  updateSettings: async (companyId, threshold) => {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/settings?threshold=${threshold}`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Update failed");
    return response.json();
  },

  // --- Procurement ---
  getRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/requests/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Unauthorized/Forbidden Context");
    return response.json();
  },

  getRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Request not found in this tenant.");
    return response.json();
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
    if (!response.ok) throw new Error("Update failed");
    return response.json();
  },

  createRequest: async (data) => {
    const response = await fetch(`${API_BASE_URL}/requests/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Creation failed");
    }
    return response.json();
  },

  transitionStatus: async (requestId, action) => {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/transition`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ action: action || "Transition" }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Transition failed: Role or Policy check error.");
    }
    return response.json();
  },

  // --- Vendors ---
  getVendors: async () => {
    const response = await fetch(`${API_BASE_URL}/vendors/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch vendors");
    return response.json();
  },

  createVendor: async (data) => {
    const response = await fetch(`${API_BASE_URL}/vendors/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to register vendor");
    return response.json();
  },

  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: getHeaders() });
    return response.json();
  },

  getRecentAuditLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/audit/recent`, { headers: getHeaders() });
    return response.json();
  },

  // --- Petty Cash ---
  getPettyCash: async () => {
    const response = await fetch(`${API_BASE_URL}/petty-cash/`, { headers: getHeaders() });
    return response.json();
  },

  createPettyCash: async (data) => {
    const response = await fetch(`${API_BASE_URL}/petty-cash/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
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

  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Unauthorized to access user directory");
    return response.json();
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
