import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PermissionLevel,
  ShareStatus,
  createShare,
  getShare,
  getProjectShares,
  updateSharePermission,
  revokeShare,
  generateShareUrl,
  isShareExpired,
  isShareActive,
  isValidPermission,
  getPermissionLabel,
  SharingService,
  useSharingService
} from './sharingService';
import requestService from './request-service/ApiRequestService';

// Mock request service
vi.mock('./request-service/ApiRequestService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('sharingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PermissionLevel', () => {
    it('defines permission levels', () => {
      expect(PermissionLevel.VIEW).toBe('view');
      expect(PermissionLevel.EDIT).toBe('edit');
      expect(PermissionLevel.ADMIN).toBe('admin');
    });
  });

  describe('ShareStatus', () => {
    it('defines share statuses', () => {
      expect(ShareStatus.ACTIVE).toBe('active');
      expect(ShareStatus.EXPIRED).toBe('expired');
      expect(ShareStatus.REVOKED).toBe('revoked');
    });
  });

  describe('createShare', () => {
    it('creates a share successfully', async () => {
      const mockShare = {
        share_id: 'abc123',
        project_id: 1,
        permission_level: 'view',
        expires_at: '2026-01-21T00:00:00Z'
      };

      requestService.post.mockResolvedValue({ data: mockShare });

      const result = await createShare(1, PermissionLevel.VIEW, 7);

      expect(requestService.post).toHaveBeenCalledWith('/v1/shares', {
        project_id: 1,
        permission_level: 'view',
        expires_in_days: 7
      });
      expect(result).toEqual(mockShare);
    });

    it('handles errors gracefully', async () => {
      requestService.post.mockRejectedValue(new Error('API Error'));

      await expect(createShare(1)).rejects.toThrow('API Error');
    });
  });

  describe('getShare', () => {
    it('fetches share by ID', async () => {
      const mockShare = { share_id: 'abc123', status: 'active' };
      requestService.get.mockResolvedValue({ data: mockShare });

      const result = await getShare('abc123');

      expect(requestService.get).toHaveBeenCalledWith('/v1/shares/abc123');
      expect(result).toEqual(mockShare);
    });

    it('handles errors gracefully', async () => {
      requestService.get.mockRejectedValue(new Error('Not Found'));

      await expect(getShare('invalid')).rejects.toThrow('Not Found');
    });
  });

  describe('getProjectShares', () => {
    it('fetches all shares for a project', async () => {
      const mockShares = [
        { share_id: 'abc123' },
        { share_id: 'def456' }
      ];
      requestService.get.mockResolvedValue({ data: mockShares });

      const result = await getProjectShares(1);

      expect(requestService.get).toHaveBeenCalledWith('/v1/projects/1/shares');
      expect(result).toEqual(mockShares);
    });
  });

  describe('updateSharePermission', () => {
    it('updates share permission', async () => {
      const mockShare = { share_id: 'abc123', permission_level: 'edit' };
      requestService.put.mockResolvedValue({ data: mockShare });

      const result = await updateSharePermission('abc123', PermissionLevel.EDIT);

      expect(requestService.put).toHaveBeenCalledWith('/v1/shares/abc123', {
        permission_level: 'edit'
      });
      expect(result).toEqual(mockShare);
    });
  });

  describe('revokeShare', () => {
    it('revokes a share', async () => {
      requestService.delete.mockResolvedValue({});

      await revokeShare('abc123');

      expect(requestService.delete).toHaveBeenCalledWith('/v1/shares/abc123');
    });
  });

  describe('generateShareUrl', () => {
    it('generates share URL with custom base URL', () => {
      import.meta.env.VITE_SHARE_BASE_URL = 'https://mage.app';
      
      const url = generateShareUrl('abc123');

      expect(url).toBe('https://mage.app/shared/abc123');
    });

    it('generates share URL with window origin when no env var', () => {
      delete import.meta.env.VITE_SHARE_BASE_URL;
      
      const url = generateShareUrl('abc123');

      expect(url).toContain('/shared/abc123');
    });
  });

  describe('isShareExpired', () => {
    it('returns false when no expiration date', () => {
      const share = { status: 'active' };
      expect(isShareExpired(share)).toBe(false);
    });

    it('returns true when expired', () => {
      const share = {
        status: 'active',
        expires_at: '2020-01-01T00:00:00Z'
      };
      expect(isShareExpired(share)).toBe(true);
    });

    it('returns false when not expired', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const share = {
        status: 'active',
        expires_at: futureDate.toISOString()
      };
      expect(isShareExpired(share)).toBe(false);
    });
  });

  describe('isShareActive', () => {
    it('returns true for active non-expired share', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const share = {
        status: 'active',
        expires_at: futureDate.toISOString()
      };
      expect(isShareActive(share)).toBe(true);
    });

    it('returns false for revoked share', () => {
      const share = { status: 'revoked' };
      expect(isShareActive(share)).toBe(false);
    });

    it('returns false for expired share', () => {
      const share = {
        status: 'active',
        expires_at: '2020-01-01T00:00:00Z'
      };
      expect(isShareActive(share)).toBe(false);
    });
  });

  describe('isValidPermission', () => {
    it('validates correct permissions', () => {
      expect(isValidPermission('view')).toBe(true);
      expect(isValidPermission('edit')).toBe(true);
      expect(isValidPermission('admin')).toBe(true);
    });

    it('rejects invalid permissions', () => {
      expect(isValidPermission('invalid')).toBe(false);
      expect(isValidPermission('')).toBe(false);
      expect(isValidPermission(null)).toBe(false);
    });
  });

  describe('getPermissionLabel', () => {
    it('returns human-readable labels', () => {
      expect(getPermissionLabel('view')).toBe('View Only');
      expect(getPermissionLabel('edit')).toBe('Can Edit');
      expect(getPermissionLabel('admin')).toBe('Admin');
    });

    it('returns original value for unknown permission', () => {
      expect(getPermissionLabel('unknown')).toBe('unknown');
    });
  });

  describe('SharingService', () => {
    let service;

    beforeEach(() => {
      service = new SharingService();
    });

    describe('constructor', () => {
      it('initializes with empty cache', () => {
        expect(service.cache).toBeInstanceOf(Map);
        expect(service.cache.size).toBe(0);
      });
    });

    describe('createShare', () => {
      it('creates share and caches it', async () => {
        const mockShare = {
          share_id: 'abc123',
          project_id: 1,
          permission_level: 'view'
        };
        requestService.post.mockResolvedValue({ data: mockShare });

        const result = await service.createShare(1, PermissionLevel.VIEW, 7);

        expect(result).toEqual(mockShare);
        expect(service.cache.has('abc123')).toBe(true);
        expect(service.cache.get('abc123')).toEqual(mockShare);
      });
    });

    describe('getShare', () => {
      it('returns cached share when available', async () => {
        const mockShare = { share_id: 'abc123', status: 'active' };
        service.cache.set('abc123', mockShare);

        const result = await service.getShare('abc123');

        expect(result).toEqual(mockShare);
        expect(requestService.get).not.toHaveBeenCalled();
      });

      it('fetches from API when not cached', async () => {
        const mockShare = { share_id: 'abc123', status: 'active' };
        requestService.get.mockResolvedValue({ data: mockShare });

        const result = await service.getShare('abc123');

        expect(result).toEqual(mockShare);
        expect(requestService.get).toHaveBeenCalled();
        expect(service.cache.has('abc123')).toBe(true);
      });

      it('force refreshes when requested', async () => {
        const cachedShare = { share_id: 'abc123', status: 'active' };
        const freshShare = { share_id: 'abc123', status: 'expired' };
        
        service.cache.set('abc123', cachedShare);
        requestService.get.mockResolvedValue({ data: freshShare });

        const result = await service.getShare('abc123', true);

        expect(result).toEqual(freshShare);
        expect(requestService.get).toHaveBeenCalled();
      });
    });

    describe('clearCache', () => {
      it('clears all cached shares', () => {
        service.cache.set('abc123', { share_id: 'abc123' });
        service.cache.set('def456', { share_id: 'def456' });

        service.clearCache();

        expect(service.cache.size).toBe(0);
      });
    });

    describe('removeFromCache', () => {
      it('removes specific share from cache', () => {
        service.cache.set('abc123', { share_id: 'abc123' });
        service.cache.set('def456', { share_id: 'def456' });

        service.removeFromCache('abc123');

        expect(service.cache.has('abc123')).toBe(false);
        expect(service.cache.has('def456')).toBe(true);
      });
    });
  });

  describe('useSharingService', () => {
    it('creates service instance', () => {
      const service = useSharingService();
      expect(service).toBeInstanceOf(SharingService);
    });
  });
});
