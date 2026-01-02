import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');
vi.mock('./auth-header', () => ({
  default: () => ({ Authorization: 'Bearer test-token' })
}));

// Mock ApiRequestService completely
vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

import profileService from './profile.service';
import requestService from '@/services/request-service/ApiRequestService';

describe('profile.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('fetches user profile successfully', async () => {
      const mockProfile = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      };

      requestService.get.mockResolvedValue({
        data: {
          data: mockProfile
        }
      });

      const result = await profileService.getProfile();

      expect(requestService.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockProfile);
    });

    it('handles missing data in response', async () => {
      requestService.get.mockResolvedValue({
        data: {}
      });

      const result = await profileService.getProfile();

      expect(result).toBeUndefined();
    });

    it('handles null response', async () => {
      requestService.get.mockResolvedValue(null);

      const result = await profileService.getProfile();

      expect(result).toBeUndefined();
    });

    it('propagates errors from request service', async () => {
      const error = new Error('Network error');
      requestService.get.mockRejectedValue(error);

      await expect(profileService.getProfile()).rejects.toThrow('Network error');
    });
  });

  describe('editProfile', () => {
    it('updates user profile successfully', async () => {
      const profileData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const mockResponse = {
        data: {
          data: { ...profileData, id: '1' }
        }
      };

      axios.patch.mockResolvedValue(mockResponse);

      const result = await profileService.editProfile(profileData);

      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/me'),
        profileData,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
      expect(result).toEqual({ ...profileData, id: '1' });
    });

    it('handles missing data in response', async () => {
      axios.patch.mockResolvedValue({
        data: {}
      });

      const result = await profileService.editProfile({ name: 'Test' });

      expect(result).toBeUndefined();
    });

    it('propagates errors from axios', async () => {
      const error = new Error('Update failed');
      axios.patch.mockRejectedValue(error);

      await expect(profileService.editProfile({})).rejects.toThrow('Update failed');
    });
  });

  describe('uploadPic', () => {
    it('uploads profile picture successfully', async () => {
      const pic = new File(['content'], 'profile.jpg', { type: 'image/jpeg' });
      const userId = '123';

      const mockResponse = {
        data: {
          url: 'https://example.com/profile.jpg'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await profileService.uploadPic(pic, userId);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining(`/uploads/users/${userId}/profile-image`),
        expect.objectContaining({ attachment: pic }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
      expect(result).toEqual({ url: 'https://example.com/profile.jpg' });
    });

    it('handles upload errors', async () => {
      const error = new Error('Upload failed');
      axios.post.mockRejectedValue(error);

      await expect(
        profileService.uploadPic(new File([''], 'test.jpg'), '123')
      ).rejects.toThrow('Upload failed');
    });
  });
});
