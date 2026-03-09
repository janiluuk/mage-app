import { describe, it, expect, beforeEach, vi } from 'vitest';
import itemsService from './items.service';
import requestService from '@/services/request-service/ApiRequestService';
import apiCache from '@/utils/apiCache';

vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('items.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCache.clear();
  });

  describe('list', () => {
    it('fetches video jobs list with parameters', async () => {
      const mockResponse = {
        data: {
          data: [
            { type: 'video-jobs', id: '1', attributes: { title: 'Job 1' } }
          ],
          meta: { page: { total: 1 } }
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await itemsService.list({ page: 1 });

      expect(requestService.get).toHaveBeenCalledWith(
        '/video-jobs',
        { page: 1 },
        expect.objectContaining({
          paramsSerializer: expect.any(Function),
        }),
        'list-video-jobs'
      );
      expect(result.list).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('provides default meta when response has no meta', async () => {
      const mockResponse = {
        data: {
          data: [
            { type: 'video-jobs', id: '1', attributes: { title: 'Job 1' } }
          ]
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await itemsService.list({});

      expect(result.meta).toEqual({ page: { total: 1 } });
    });
  });

  describe('get', () => {
    it('fetches single video job by id with includes', async () => {
      const mockResponse = {
        data: {
          data: { type: 'video-jobs', id: '1', attributes: { title: 'Job 1' } }
        }
      };

      requestService.get.mockResolvedValue(mockResponse);

      const result = await itemsService.get('1');

      expect(requestService.get).toHaveBeenCalledWith('/video-jobs/1?include=modelfile,user', {}, {}, true);
      expect(result).toBeDefined();
    });
  });

  describe('add', () => {
    it('creates new video job', async () => {
      const newItem = { stuff: { type: 'video-jobs', title: 'New Job', status: 'pending' } };
      const mockResponse = {
        data: {
          data: { type: 'video-jobs', id: '2', attributes: newItem }
        }
      };

      requestService.post.mockResolvedValue(mockResponse);

      const result = await itemsService.add(newItem);

      expect(requestService.post).toHaveBeenCalledWith(
        '/video-jobs?filter[generator]=vid2vid&include=modelfile,user',
        expect.any(Object)
      );
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('updates existing video job', async () => {
      const updatedItem = { type: 'video-jobs', id: '1', title: 'Updated Job', status: 'completed' };
      const mockResponse = {
        data: {
          data: { type: 'video-jobs', id: '1', attributes: updatedItem }
        }
      };

      requestService.patch.mockResolvedValue(mockResponse);

      const result = await itemsService.update(updatedItem);

      expect(requestService.patch).toHaveBeenCalledWith('/video-jobs/1?include=modelfile,user', expect.any(Object));
      expect(result).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('deletes video job by id', async () => {
      requestService.delete.mockResolvedValue({ status: 204 });

      await itemsService.destroy('1');

      expect(requestService.delete).toHaveBeenCalledWith('/video-jobs/1');
    });
  });

  describe('upload', () => {
    it('uploads image for video job', async () => {
      const item = { id: '1', title: 'Job 1' };
      const image = new File(['content'], 'image.jpg', { type: 'image/jpeg' });

      const mockResponse = {
        data: {
          url: 'https://example.com/uploads/image.jpg'
        }
      };

      requestService.post.mockResolvedValue(mockResponse);

      const result = await itemsService.upload(item, image);

      expect(requestService.post).toHaveBeenCalledWith(
        '/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('handles upload errors', async () => {
      const error = new Error('Upload failed');
      requestService.post.mockRejectedValue(error);

      await expect(
        itemsService.upload({ id: '1' }, new File([''], 'test.jpg'))
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('error handling', () => {
    it('propagates errors from list', async () => {
      const error = new Error('Network error');
      requestService.get.mockRejectedValue(error);

      await expect(itemsService.list({})).rejects.toThrow('Network error');
    });

    it('propagates errors from get', async () => {
      const error = new Error('Not found');
      requestService.get.mockRejectedValue(error);

      await expect(itemsService.get('999')).rejects.toThrow('Not found');
    });

    it('propagates errors from add', async () => {
      const error = new Error('Validation error');
      requestService.post.mockRejectedValue(error);

      await expect(itemsService.add({ stuff: { type: 'video-jobs', title: '' } })).rejects.toThrow('Validation error');
    });

    it('propagates errors from update', async () => {
      const error = new Error('Update failed');
      requestService.patch.mockRejectedValue(error);

      await expect(itemsService.update({ type: 'video-jobs', id: '1' })).rejects.toThrow('Update failed');
    });

    it('propagates errors from destroy', async () => {
      const error = new Error('Delete failed');
      requestService.delete.mockRejectedValue(error);

      await expect(itemsService.destroy('1')).rejects.toThrow('Delete failed');
    });
  });
});
