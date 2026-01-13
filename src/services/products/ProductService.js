import axios from 'axios';
import authHeader from '../auth-header';
import { API_BASE_URL } from '@/utils/api-base-urls';

const BASE_URL = API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Service for managing product data with backend API integration
 */
class ProductService {
  /**
   * Get a small list of products (for quick loading/preview)
   * @returns {Promise<Array>} List of products
   */
  async getProductsSmall() {
    try {
      const { data } = await axios.get(`${BASE_URL}/products?limit=10`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching small products:', error);
      return [];
    }
  }

  /**
   * Get all products
   * @returns {Promise<Array>} List of products
   */
  async getProducts() {
    try {
      const { data } = await axios.get(`${BASE_URL}/products`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Get products with their orders
   * @returns {Promise<Array>} List of products with order information
   */
  async getProductsWithOrdersSmall() {
    try {
      const { data } = await axios.get(`${BASE_URL}/products?include=orders&limit=10`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching products with orders:', error);
      return [];
    }
  }
}

export default ProductService;
