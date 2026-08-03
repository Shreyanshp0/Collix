import axiosClient from './axiosClient';

export const groupsApi = {
  list: async () => {
    const response = await axiosClient.get('/groups');
    return response.data?.data?.groups || response.data?.data || response.data;
  },

  browse: async () => {
    const response = await axiosClient.get('/groups/browse');
    return response.data?.data?.groups || response.data?.data || response.data;
  },

  getById: async (groupId) => {
    const response = await axiosClient.get(`/groups/${groupId}`);
    return response.data?.data || response.data;
  },

  create: async ({ name, description, visibility = 'private', aiConfiguration }) => {
    const response = await axiosClient.post('/groups', { name, description, visibility, aiConfiguration });
    return response.data?.data?.group || response.data?.data || response.data;
  },

  getAIConfig: async (groupId) => {
    const response = await axiosClient.get(`/groups/${groupId}/ai/configuration`);
    return response.data?.data || response.data;
  },

  updateAIConfig: async (groupId, aiConfiguration) => {
    const response = await axiosClient.post(`/groups/${groupId}/ai/configure`, { aiConfiguration });
    return response.data?.data || response.data;
  },

  join: async (groupId) => {
    const response = await axiosClient.post(`/groups/${groupId}/join`);
    return response.data?.data || response.data;
  },

  leave: async (groupId) => {
    const response = await axiosClient.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  addMember: async ({ groupId, userId, role = 'member' }) => {
    const response = await axiosClient.post(`/groups/${groupId}/members`, { userId, role });
    return response.data?.data?.member || response.data?.data || response.data;
  },
};

export default groupsApi;
