import Jsona from 'jsona';
import requestService from '@/services/request-service/ApiRequestService';

const jsona = new Jsona();

export default {
    async list(params) {
        try {
            const response = await requestService.get('/model-files?filter[enabled]=1', params);
            return jsona.deserialize(response.data);
        } catch (error) {
            console.error('Failed to fetch model files:', error.message);
            throw error;
        }
    }
}
