const API_BASE_URL = "http://localhost:8000";

export const procurementApi = {
  getRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/requests/`);
    if (!response.ok) throw new Error("Failed to fetch requests");
    return response.json();
  },
  
  getRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`);
    if (!response.ok) throw new Error("Failed to fetch request details");
    return response.json();
  },
  
  createRequest: async (data) => {
    const response = await fetch(`${API_BASE_URL}/requests/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create request");
    return response.json();
  },
  
  transitionStatus: async (requestId, targetStatus, userName, userRole) => {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/transition?target_status=${targetStatus}&user_name=${userName}&user_role=${userRole}`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Transition failed");
    }
    return response.json();
  }
};
