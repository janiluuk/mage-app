import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import itemsService from './items.service';

vi.mock('axios');
vi.mock('./auth-header', () => ({
  default: () => ({ Authorization: 'Bearer test-token' })
}));

describe('items.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      axios.get.mockResolvedValue(mockResponse);

      const result = await itemsService.list({ page: 1 });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/video-jobs'),
        expect.objectContaining({
          params: { page: 1 },
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
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

      axios.get.mockResolvedValue(mockResponse);

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

      axios.get.mockResolvedValue(mockResponse);

      const result = await itemsService.get('1');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/video-jobs/1?include=modelfile,user'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
      expect(result).toBeDefined();
      expect(result.links).toBeUndefined();
    });
  });

  describe('add', () => {
    it('creates new video job', async () => {
      const newItem = { type: 'video-jobs', title: 'New Job', status: 'pending' };
      const mockResponse = {
        data: {
          data: { type: 'video-jobs', id: '2', attributes: newItem }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await itemsService.add(newItem);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/video-jobs?include=modelfile,user'),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
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

      axios.patch.mockResolvedValue(mockResponse);

      const result = await itemsService.update(updatedItem);

      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/video-jobs/1?include=modelfile,user'),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('deletes video job by id', async () => {
      axios.delete.mockResolvedValue({ status: 204 });

      await itemsService.destroy('1');

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/video-jobs/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
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

      axios.post.mockResolvedValue(mockResponse);

      const result = await itemsService.upload(item, image);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/uploads/video-jobs/1/image'),
        expect.any(FormData)
      );
      expect(result).toBe('https://example.com/uploads/image.jpg');
    });

    it('handles upload errors', async () => {
      const error = new Error('Upload failed');
      axios.post.mockRejectedValue(error);

      await expect(
        itemsService.upload({ id: '1' }, new File([''], 'test.jpg'))
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('error handling', () => {
    it('propagates errors from list', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await expect(itemsService.list({})).rejects.toThrow('Network error');
    });

    it('propagates errors from get', async () => {
      const error = new Error('Not found');
      axios.get.mockRejectedValue(error);

      await expect(itemsService.get('999')).rejects.toThrow('Not found');
    });

    it('propagates errors from add', async () => {
      const error = new Error('Validation error');
      axios.post.mockRejectedValue(error);

      await expect(itemsService.add({ type: 'video-jobs', title: '' })).rejects.toThrow('Validation error');
    });

    it('propagates errors from update', async () => {
      const error = new Error('Update failed');
      axios.patch.mockRejectedValue(error);

      await expect(itemsService.update({ type: 'video-jobs', id: '1' })).rejects.toThrow('Update failed');
    });

    it('propagates errors from destroy', async () => {
      const error = new Error('Delete failed');
      axios.delete.mockRejectedValue(error);

      await expect(itemsService.destroy('1')).rejects.toThrow('Delete failed');
    });
  });
});
