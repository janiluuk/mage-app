import axios from 'axios';
import authHeader from '../auth-header';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Service for managing photo/media data with backend API integration
 */
class PhotoService {
  /**
   * Get all images/photos from the media library
   * @returns {Promise<Array>} List of images
   */
  async getImages() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/media/images`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      return [];
    }
  }
}

export default PhotoService;
