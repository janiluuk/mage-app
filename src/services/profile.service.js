import axios from 'axios';
import authHeader from './auth-header';
import Jsona from 'jsona';
import requestService from '@/services/request-service/ApiRequestService';

const API_URL = process.env.VUE_APP_API_BASE_URL;
const API_V1_URL = process.env.VUE_APP_API_V1_BASE_URL;

const dataFormatter = new Jsona();

export default {
  async getProfile() {
    const response = await requestService.get('/auth/me');
    return response?.data?.data;
  },

  async editProfile(profile) {
    const response = await axios.patch(API_URL + "/me", profile, { headers: authHeader() })
    return response?.data?.data;
  },

  async uploadPic(pic, userId) {
    const postUrl = API_V1_URL + "/uploads/users/" + userId + "/profile-image";
    const response = await axios.post(postUrl,
      { attachment: pic },
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

}