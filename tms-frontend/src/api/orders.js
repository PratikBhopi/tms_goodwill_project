import axios from 'axios';

const BASE = 'http://localhost:5000/api';

export const ordersAPI = {
  placeOrder:      (data)       => axios.post(`${BASE}/orders`, data),
  getMyOrders:     ()           => axios.get(`${BASE}/orders/my`),
  getOrderById:    (id)         => axios.get(`${BASE}/orders/${id}`),
  getEstimate:     (params)     => axios.get(`${BASE}/ai/price-estimate`, { params }),

  getAllOrders:     (filters)   => axios.get(`${BASE}/orders`, { params: filters }),
  assignOrder:     (id, data)   => axios.put(`${BASE}/orders/${id}/assign`, data),
  updatePrice:     (id, data)   => axios.put(`${BASE}/orders/${id}/price`, data),

  getMyTrips:      ()           => axios.get(`${BASE}/orders/driver/trips`),
  updateStatus:    (id, status) => axios.put(`${BASE}/orders/${id}/status`, { status }),
  uploadPOD:       (id, form)   => axios.post(`${BASE}/orders/${id}/pod`, form, {
                                     headers: { 'Content-Type': 'multipart/form-data' }
                                   }),
};
