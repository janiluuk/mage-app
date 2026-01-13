import axios from 'axios';
import authHeader from '../auth-header';
import env from '@/utils/env';

const API_BASE_URL = env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Service for managing customer data with backend API integration
 */
class CustomerService {
  /**
   * Get a small list of customers (for quick loading/preview)
   * @returns {Promise<Array>} List of customers
   */
  async getCustomersSmall() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/customers?limit=10`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching small customers:', error);
      return [];
    }
  }

  /**
   * Get a medium list of customers
   * @returns {Promise<Array>} List of customers
   */
  async getCustomersMedium() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/customers?limit=50`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching medium customers:', error);
      return [];
    }
  }

  /**
   * Get a large list of customers
   * @returns {Promise<Array>} List of customers
   */
  async getCustomersLarge() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/customers?limit=200`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching large customers:', error);
      return [];
    }
  }

  /**
   * Get an extra large list of customers
   * @returns {Promise<Array>} List of customers
   */
  async getCustomersXLarge() {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/customers?limit=1000`, {
        headers: authHeader()
      });
      return data.data || [];
    } catch (error) {
      console.error('Error fetching xlarge customers:', error);
      return [];
    }
  }

  /**
   * Get customers with custom query parameters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated customer response
   */
  async getCustomers(params) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const { data } = await axios.get(`${API_BASE_URL}/customers?${queryParams}`, {
        headers: authHeader()
      });
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { data: [], totalRecords: 0 };
    }
  }
}

export default CustomerService;
