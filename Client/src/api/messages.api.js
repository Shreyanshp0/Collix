import axiosClient from './axiosClient';

export const messagesApi = {
  list: async ({ groupId, page = 1, limit = 30 }) => {
    if (!groupId) return { messages: [], page: 1, limit, total: 0, totalPages: 0, hasNextPage: false };
    const response = await axiosClient.get(`/groups/${groupId}/messages`, {
      params: { page, limit },
    });
    return response.data?.data || response.data;
  },
};

export default messagesApi;
