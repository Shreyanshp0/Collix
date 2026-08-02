import axiosClient from './axiosClient';

export const documentsApi = {
  list: async (groupId) => {
    if (!groupId) return [];
    const response = await axiosClient.get(`/groups/${groupId}/documents`);
    return response.data?.data?.documents || response.data?.data || response.data;
  },

  upload: async ({ groupId, files, onProgress }) => {
    if (!groupId || !files || files.length === 0) return [];
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('documents', file);
    });

    const response = await axiosClient.post(`/groups/${groupId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data?.data?.documents || response.data?.data || response.data;
  },

  remove: async (documentId) => {
    if (!documentId) return;
    const response = await axiosClient.delete(`/documents/${documentId}`);
    return response.data;
  },
};

export default documentsApi;
