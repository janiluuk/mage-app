import requestService from '@/services/request-service/ApiRequestService';

export default {
  async process(formData) {
    try {
      const response = await requestService.post('/v1/custom-jobs/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error processing custom job:', error);
      throw error;
    }
  },

  async getStatus(jobId) {
    try {
      const response = await requestService.get(`/v1/custom-jobs/${jobId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  },
};
