import Jsona from 'jsona';
import requestService from '@/services/request-service/ApiRequestService';

const API_URL = process.env.VUE_APP_API_V1_BASE_URL;
const jsona = new Jsona();

export default {
    async list(params) {
        try {            
            
                const response = await requestService.get('/v1/model-files?filter[enabled]=1', params);

                return jsona.deserialize(response.data);
            } catch (error) {
            console.error('Failed to fetch model files:', error.message);
            throw error;
        }
    }
 
}