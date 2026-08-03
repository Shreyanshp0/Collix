import axiosClient from './axiosClient';

export const aiApi = {
  ask: async ({ groupId, question, options = {} }) => {
    if (!groupId || !question) return null;
    const response = await axiosClient.post('/ai/ask', {
      groupId,
      question,
      options,
    });
    return response.data?.data || response.data;
  },
};

export default aiApi;
