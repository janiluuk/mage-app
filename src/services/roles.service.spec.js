import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import rolesService from './roles.service';

vi.mock('axios');

describe('roles.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('fetches roles list with parameters', async () => {
      const mockResponse = {
        data: {
          data: [
            { type: 'roles', id: '1', attributes: { name: 'Admin' } }
          ],
          meta: { total: 1 }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await rolesService.list({ page: 1 });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/roles'),
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

      const result = await rolesService.list({});

      expect(result.list).toBeDefined();
      expect(result.meta.total).toBe(0);
    });
  });

  describe('get', () => {
    it('fetches single role by id', async () => {
      const mockResponse = {
        data: {
          data: { type: 'roles', id: '1', attributes: { name: 'Admin' } }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await rolesService.get('1');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/roles/1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.api+json'
          })
        })
      );
      expect(result).toBeDefined();
      expect(result.links).toBeUndefined();
    });
  });

  describe('add', () => {
    it('creates new role', async () => {
      const newRole = { type: 'roles', name: 'Editor', permissions: ['read', 'write'] };
      const mockResponse = {
        data: {
          data: { type: 'roles', id: '2', attributes: newRole }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await rolesService.add(newRole);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/roles'),
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
    it('updates existing role', async () => {
      const updatedRole = { type: 'roles', id: '1', name: 'Super Admin' };
      const mockResponse = {
        data: {
          data: { type: 'roles', id: '1', attributes: updatedRole }
        }
      };

      axios.patch.mockResolvedValue(mockResponse);

      const result = await rolesService.update(updatedRole);

      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/roles/1'),
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
    it('deletes role by id', async () => {
      axios.delete.mockResolvedValue({ status: 204 });

      await rolesService.destroy('1');

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/roles/1'),
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

      await expect(rolesService.list({})).rejects.toThrow('Network error');
    });

    it('propagates errors from get', async () => {
      const error = new Error('Not found');
      axios.get.mockRejectedValue(error);

      await expect(rolesService.get('999')).rejects.toThrow('Not found');
    });

    it('propagates errors from add', async () => {
      const error = new Error('Validation error');
      axios.post.mockRejectedValue(error);

      await expect(rolesService.add({ type: 'roles', name: '' })).rejects.toThrow('Validation error');
    });

    it('propagates errors from update', async () => {
      const error = new Error('Update failed');
      axios.patch.mockRejectedValue(error);

      await expect(rolesService.update({ type: 'roles', id: '1' })).rejects.toThrow('Update failed');
    });

    it('propagates errors from destroy', async () => {
      const error = new Error('Delete failed');
      axios.delete.mockRejectedValue(error);

      await expect(rolesService.destroy('1')).rejects.toThrow('Delete failed');
    });
  });
});
