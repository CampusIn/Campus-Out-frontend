import api from './axios';

/**
 * Create a new repair request (Multipart FormData)
 * @param {FormData} formData
 */
export const createRepairRequest = async (formData) => {
  return await api.post('/repair-requests', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Fetch repair requests for current user
 * @param {Object} params { search, status, page, limit }
 */
export const getAllRepairRequests = async (params = {}) => {
  return await api.get('/repair-requests', { params });
};

/**
 * Fetch detailed repair request by ID
 * @param {string} requestId
 */
export const getRepairRequestById = async (requestId) => {
  return await api.get(`/repair-requests/${requestId}`);
};

/**
 * Customer decision (ACCEPT / REJECT price quote)
 * @param {string} requestId
 * @param {string} requestStatus 'ACCEPTED' | 'REJECTED'
 */
export const updateCustomerDecision = async (requestId, requestStatus) => {
  return await api.patch(`/repair-requests/${requestId}`, { requestStatus });
};
