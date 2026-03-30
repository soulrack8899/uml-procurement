const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
    if (!response.ok) throw new Error("Session Context Error");
    return response.json();
  },

  // --- Companies ---
  getCompanies: async () => {
    const response = await fetch(`${API_BASE_URL}/companies/`);
    if (!response.ok) throw new Error("Failed to fetch companies");
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

  updateCompany: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
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
    
    const response = await fetch(`${API_BASE_URL}/upload/`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("File Upload Failed");
    return response.json();
  }
}
