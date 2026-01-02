import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import tagsService from './tags.service';

vi.mock('axios');

describe('tags.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('fetches tags list with parameters', async () => {
      const mockResponse = {
        data: {
          data: [
            { type: 'tags', id: '1', attributes: { name: 'Tag 1' } }
          ],
          meta: { total: 1 }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tagsService.list({ page: 1 });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/tags'),
        expect.objectContaining({
          params: { page: 1 },
          headers: expect.objectContaining({
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          })
        })
      );
      expect(result.list).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it('handles empty list response', async () => {
      const mockResponse = {
        data: {
          data: [],
          meta: { total: 0 }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tagsService.list({});

      expect(result.list).toBeDefined();
      expect(result.meta.total).toBe(0);
    });
  });

  describe('get', () => {
    it('fetches single tag by id', async () => {
      const mockResponse = {
        data: {
          data: { type: 'tags', id: '1', attributes: { name: 'Tag 1' } }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tagsService.get('1');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/tags/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.api+json'
          })
        })
      );
      expect(result).toBeDefined();
      expect(result.links).toBeUndefined(); // links should be removed
    });
  });

  describe('add', () => {
    it('creates new tag', async () => {
      const newTag = { type: 'tags', name: 'New Tag', color: '#ff0000' };
      const mockResponse = {
        data: {
          data: { type: 'tags', id: '2', attributes: newTag }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await tagsService.add(newTag);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/tags'),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          })
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('updates existing tag', async () => {
      const updatedTag = { type: 'tags', id: '1', name: 'Updated Tag', color: '#00ff00' };
      const mockResponse = {
        data: {
          data: { type: 'tags', id: '1', attributes: updatedTag }
        }
      };

      axios.patch.mockResolvedValue(mockResponse);

      const result = await tagsService.update(updatedTag);

      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/tags/1'),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          })
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('deletes tag by id', async () => {
      axios.delete.mockResolvedValue({ status: 204 });

      await tagsService.destroy('1');

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/tags/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          })
        })
      );
    });
  });

  describe('error handling', () => {
    it('propagates errors from list', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await expect(tagsService.list({})).rejects.toThrow('Network error');
    });

    it('propagates errors from get', async () => {
      const error = new Error('Not found');
      axios.get.mockRejectedValue(error);

      await expect(tagsService.get('999')).rejects.toThrow('Not found');
    });

    it('propagates errors from add', async () => {
      const error = new Error('Validation error');
      axios.post.mockRejectedValue(error);

      await expect(tagsService.add({ type: 'tags', name: '' })).rejects.toThrow('Validation error');
    });

    it('propagates errors from update', async () => {
      const error = new Error('Update failed');
      axios.patch.mockRejectedValue(error);

      await expect(tagsService.update({ type: 'tags', id: '1' })).rejects.toThrow('Update failed');
    });

    it('propagates errors from destroy', async () => {
      const error = new Error('Delete failed');
      axios.delete.mockRejectedValue(error);

      await expect(tagsService.destroy('1')).rejects.toThrow('Delete failed');
    });
  });
});
