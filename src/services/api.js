const API_BASE_URL = "http://localhost:8000";

const getHeaders = () => {
  const companyId = localStorage.getItem("currentCompanyId") || "1"; 
  const userId = localStorage.getItem("currentUserId") || "1"; 
  return {
    "Content-Type": "application/json",
    "X-Company-ID": companyId,
    "X-User-ID": userId
  };
};

export const procurementApi = {
  // --- Session & Active Role Context ---
  whoami: async () => {
    const response = await fetch(`${API_BASE_URL}/session/whoami`, { headers: getHeaders() });
    return response.json();
  },

  // --- Companies ---
  getCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/`);
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
  
  createRequest: async (data) => {
    const response = await fetch(`${API_BASE_URL}/requests/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  transitionStatus: async (requestId) => {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/transition`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Transition failed: Role or Policy check error.");
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
  }
};
