import axiosClient from './axiosClient';

export const authApi = {
  login: async ({ email, password }) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    return response.data?.data || response.data;
  },
  register: async ({ username, email, password }) => {
    const response = await axiosClient.post('/auth/register', { username, email, password });
    return response.data?.data || response.data;
  },
  getMe: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data?.data || response.data;
  },
  searchUsers: async ({ query, groupId }) => {
    const response = await axiosClient.get('/auth/users/search', {
      params: { q: query, groupId },
    });
    return response.data?.data?.users || response.data?.data || response.data;
  },
};

export default authApi;
