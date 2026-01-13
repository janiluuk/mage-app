import axios from 'axios';
import authHeader from '../auth-header';
import { API_BASE_URL } from '@/utils/api-base-urls';

const BASE_URL = API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Service for managing hierarchical node data with backend API integration
 */
class NodeService {
  /**
   * Get tree table nodes for hierarchical data display
   * @returns {Promise<Array>} Tree structure nodes
   */
  async getTreeTableNodes() {
    try {
      const { data } = await axios.get(`${BASE_URL}/nodes/tree-table`, {
        headers: authHeader()
      });
      return data.root || [];
    } catch (error) {
      console.error('Error fetching tree table nodes:', error);
      return [];
    }
  }

  /**
   * Get tree nodes for tree view components
   * @returns {Promise<Array>} Tree structure nodes
   */
  async getTreeNodes() {
    try {
      const { data } = await axios.get(`${BASE_URL}/nodes/tree`, {
        headers: authHeader()
      });
      return data.root || [];
    } catch (error) {
      console.error('Error fetching tree nodes:', error);
      return [];
    }
  }
}

export default NodeService;
