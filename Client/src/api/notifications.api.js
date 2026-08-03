import axiosClient from './axiosClient.js';

export const notificationsApi = {
  list: async (params = {}) => {
    const response = await axiosClient.get('/notifications', { params });
    return response.data?.data || response.data;
  },

  getUnreadCount: async () => {
    const response = await axiosClient.get('/notifications/unread-count');
    return response.data?.data?.count ?? 0;
  },

  markRead: async (notificationId) => {
    const response = await axiosClient.patch(`/notifications/${notificationId}/read`);
    return response.data?.data?.notification || response.data;
  },

  markAllRead: async (category) => {
    const response = await axiosClient.patch('/notifications/read-all', { category });
    return response.data?.data || response.data;
  },

  remove: async (notificationId) => {
    const response = await axiosClient.delete(`/notifications/${notificationId}`);
    return response.data?.data || response.data;
  },
};

export default notificationsApi;
