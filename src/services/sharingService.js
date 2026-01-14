/**
 * Sharing Service
 * Handles project sharing, link generation, and permission management
 */

import requestService from './request-service/ApiRequestService';

/**
 * Permission levels for shared projects
 */
export const PermissionLevel = {
  VIEW: 'view',
  EDIT: 'edit',
  ADMIN: 'admin'
};

/**
 * Share status
 */
export const ShareStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked'
};

/**
 * Generate share link
 * @param {number} projectId - Project ID
 * @param {string} permission - Permission level
 * @param {number} expiresInDays - Expiration time in days
 * @returns {Promise<object>} Share data with link
 */
export async function createShare(projectId, permission = PermissionLevel.VIEW, expiresInDays = 7) {
  try {
    const response = await requestService.post('/v1/shares', {
      project_id: projectId,
      permission_level: permission,
      expires_in_days: expiresInDays
    });
    return response.data;
  } catch (error) {
    console.error('Error creating share:', error);
    throw error;
  }
}

/**
 * Get share information
 * @param {string} shareId - Share ID
 * @returns {Promise<object>} Share data
 */
export async function getShare(shareId) {
  try {
    const response = await requestService.get(`/v1/shares/${shareId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching share:', error);
    throw error;
  }
}

/**
 * Get all shares for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<array>} List of shares
 */
export async function getProjectShares(projectId) {
  try {
    const response = await requestService.get(`/v1/projects/${projectId}/shares`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project shares:', error);
    throw error;
  }
}

/**
 * Update share permissions
 * @param {string} shareId - Share ID
 * @param {string} permission - New permission level
 * @returns {Promise<object>} Updated share data
 */
export async function updateSharePermission(shareId, permission) {
  try {
    const response = await requestService.put(`/v1/shares/${shareId}`, {
      permission_level: permission
    });
    return response.data;
  } catch (error) {
    console.error('Error updating share permission:', error);
    throw error;
  }
}

/**
 * Revoke share
 * @param {string} shareId - Share ID
 * @returns {Promise<void>}
 */
export async function revokeShare(shareId) {
  try {
    await requestService.delete(`/v1/shares/${shareId}`);
  } catch (error) {
    console.error('Error revoking share:', error);
    throw error;
  }
}

/**
 * Add collaborator to share
 * @param {string} shareId - Share ID
 * @param {string} email - Collaborator email
 * @param {string} permission - Permission level
 * @returns {Promise<object>} Collaborator data
 */
export async function addCollaborator(shareId, email, permission = PermissionLevel.VIEW) {
  try {
    const response = await requestService.post(`/v1/shares/${shareId}/collaborators`, {
      email,
      permission_level: permission
    });
    return response.data;
  } catch (error) {
    console.error('Error adding collaborator:', error);
    throw error;
  }
}

/**
 * Remove collaborator from share
 * @param {string} shareId - Share ID
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export async function removeCollaborator(shareId, userId) {
  try {
    await requestService.delete(`/v1/shares/${shareId}/collaborators/${userId}`);
  } catch (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Get collaborators for a share
 * @param {string} shareId - Share ID
 * @returns {Promise<array>} List of collaborators
 */
export async function getCollaborators(shareId) {
  try {
    const response = await requestService.get(`/v1/shares/${shareId}/collaborators`);
    return response.data;
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    throw error;
  }
}

/**
 * Generate share URL
 * @param {string} shareId - Share ID
 * @returns {string} Full share URL
 */
export function generateShareUrl(shareId) {
  const baseUrl = import.meta.env.VITE_SHARE_BASE_URL || window.location.origin;
  return `${baseUrl}/shared/${shareId}`;
}

/**
 * Check if share is expired
 * @param {object} share - Share object
 * @returns {boolean} True if expired
 */
export function isShareExpired(share) {
  if (!share.expires_at) return false;
  return new Date(share.expires_at) < new Date();
}

/**
 * Check if share is active
 * @param {object} share - Share object
 * @returns {boolean} True if active
 */
export function isShareActive(share) {
  return share.status === ShareStatus.ACTIVE && !isShareExpired(share);
}

/**
 * Validate permission level
 * @param {string} permission - Permission level
 * @returns {boolean} True if valid
 */
export function isValidPermission(permission) {
  return Object.values(PermissionLevel).includes(permission);
}

/**
 * Get permission label
 * @param {string} permission - Permission level
 * @returns {string} Human-readable label
 */
export function getPermissionLabel(permission) {
  const labels = {
    [PermissionLevel.VIEW]: 'View Only',
    [PermissionLevel.EDIT]: 'Can Edit',
    [PermissionLevel.ADMIN]: 'Admin'
  };
  return labels[permission] || permission;
}

/**
 * SharingService class
 */
export class SharingService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Create share with caching
   * @param {number} projectId - Project ID
   * @param {string} permission - Permission level
   * @param {number} expiresInDays - Expiration days
   * @returns {Promise<object>} Share data
   */
  async createShare(projectId, permission, expiresInDays) {
    const share = await createShare(projectId, permission, expiresInDays);
    this.cache.set(share.share_id, share);
    return share;
  }

  /**
   * Get share with caching
   * @param {string} shareId - Share ID
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<object>} Share data
   */
  async getShare(shareId, forceRefresh = false) {
    if (!forceRefresh && this.cache.has(shareId)) {
      return this.cache.get(shareId);
    }

    const share = await getShare(shareId);
    this.cache.set(shareId, share);
    return share;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Remove from cache
   * @param {string} shareId - Share ID
   */
  removeFromCache(shareId) {
    this.cache.delete(shareId);
  }
}

/**
 * Create sharing service instance
 * @returns {SharingService} Service instance
 */
export function useSharingService() {
  return new SharingService();
}

export default {
  PermissionLevel,
  ShareStatus,
  createShare,
  getShare,
  getProjectShares,
  updateSharePermission,
  revokeShare,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
  generateShareUrl,
  isShareExpired,
  isShareActive,
  isValidPermission,
  getPermissionLabel,
  SharingService,
  useSharingService
};
