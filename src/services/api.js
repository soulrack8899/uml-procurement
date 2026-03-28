const API_BASE_URL = "http://localhost:8000";

const getHeaders = () => {
  const companyId = localStorage.getItem("currentCompanyId") || "1"; // Default to UMLAB Sarawak
  return {
    "Content-Type": "application/json",
    "X-Company-ID": companyId
  };
};

export const procurementApi = {
  // --- Companies & Onboarding ---
  getCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/`);
    return response.json();
  },
  
  createCompany: async (data) => {
    const response = await fetch(`${API_BASE_URL}/companies/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getSettings: async (cid) => {
    const response = await fetch(`${API_BASE_URL}/companies/${cid}/settings`);
    return response.json();
  },

  updateSettings: async (cid, threshold) => {
    const response = await fetch(`${API_BASE_URL}/companies/${cid}/settings?threshold=${threshold}`, {
      method: "PATCH"
    });
    return response.json();
  },

  // --- Procurement ---
  getRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/requests/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch requests");
    return response.json();
  },
  
  getRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch request details");
    return response.json();
  },
  
  createRequest: async (data) => {
    const response = await fetch(`${API_BASE_URL}/requests/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create request");
    return response.json();
  },
  
  transitionStatus: async (requestId, targetStatus, userName, userRole) => {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/transition?target_status=${targetStatus}&user_name=${userName}&user_role=${userRole}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Transition failed");
    }
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

  disbursePettyCash: async (pcId, userName) => {
    const response = await fetch(`${API_BASE_URL}/petty-cash/${pcId}/disburse?user_name=${userName}`, {
      method: "POST",
      headers: getHeaders(),
    });
    return response.json();
  }
};
