/**
 * Unit tests for apiCache utility
 * @module apiCache.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiCache } from '@/utils/apiCache';

describe('ApiCache', () => {
  let cache;

  beforeEach(() => {
    // Create a fresh cache instance for each test
    cache = new ApiCache(10, 1000); // 10 entries, 1s TTL
  });

  describe('get and set', () => {
    it('should store and retrieve cached values', () => {
      cache.set('/api/test', {}, { data: 'test' });
      const result = cache.get('/api/test', {});
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('/api/unknown', {});
      
      expect(result).toBeNull();
    });

    it('should handle different params as different keys', () => {
      cache.set('/api/test', { page: 1 }, { data: 'page1' });
      cache.set('/api/test', { page: 2 }, { data: 'page2' });
      
      expect(cache.get('/api/test', { page: 1 })).toEqual({ data: 'page1' });
      expect(cache.get('/api/test', { page: 2 })).toEqual({ data: 'page2' });
    });

    it('should expire entries after TTL', async () => {
      cache.set('/api/test', {}, { data: 'test' }, 100); // 100ms TTL
      
      expect(cache.get('/api/test', {})).toEqual({ data: 'test' });
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('/api/test', {})).toBeNull();
    });

    it('should enforce max size', () => {
      // Fill cache to max size
      for (let i = 0; i < 10; i++) {
        cache.set(`/api/test${i}`, {}, { data: i });
      }
      
      // Add one more - should evict oldest
      cache.set('/api/test10', {}, { data: 10 });
      
      // First entry should be evicted
      expect(cache.get('/api/test0', {})).toBeNull();
      // Last entry should exist
      expect(cache.get('/api/test10', {})).toEqual({ data: 10 });
    });
  });

  describe('clear and delete', () => {
    it('should clear all cache entries', () => {
      cache.set('/api/test1', {}, { data: 1 });
      cache.set('/api/test2', {}, { data: 2 });
      
      cache.clear();
      
      expect(cache.get('/api/test1', {})).toBeNull();
      expect(cache.get('/api/test2', {})).toBeNull();
    });

    it('should delete specific entries', () => {
      cache.set('/api/test1', {}, { data: 1 });
      cache.set('/api/test2', {}, { data: 2 });
      
      cache.delete('/api/test1', {});
      
      expect(cache.get('/api/test1', {})).toBeNull();
      expect(cache.get('/api/test2', {})).toEqual({ data: 2 });
    });
  });

  describe('pending requests', () => {
    it('should track pending requests', () => {
      const promise = Promise.resolve({ data: 'test' });
      
      cache.setPending('/api/test', {}, promise);
      
      expect(cache.isPending('/api/test', {})).toBe(true);
      expect(cache.getPending('/api/test', {})).toBe(promise);
    });

    it('should remove pending request after completion', async () => {
      const promise = Promise.resolve({ data: 'test' });
      
      cache.setPending('/api/test', {}, promise);
      
      await promise;
      
      // Wait a bit for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(cache.isPending('/api/test', {})).toBe(false);
      expect(cache.getPending('/api/test', {})).toBeNull();
    });

    it('should remove pending request after rejection', async () => {
      const promise = Promise.reject(new Error('Test error'));
      
      cache.setPending('/api/test', {}, promise);
      
      try {
        await promise;
      } catch (e) {
        // Expected
      }
      
      // Wait a bit for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(cache.isPending('/api/test', {})).toBe(false);
    });

    it('should return null for non-pending requests', () => {
      expect(cache.getPending('/api/unknown', {})).toBeNull();
    });
  });

  describe('key generation', () => {
    it('should generate consistent keys for same params', () => {
      const params1 = { page: 1, limit: 10 };
      const params2 = { limit: 10, page: 1 }; // Different order
      
      cache.set('/api/test', params1, { data: 'test' });
      
      // Should retrieve with different param order
      expect(cache.get('/api/test', params2)).toEqual({ data: 'test' });
    });

    it('should handle empty params', () => {
      cache.set('/api/test', {}, { data: 'test' });
      
      expect(cache.get('/api/test', {})).toEqual({ data: 'test' });
    });

    it('should handle complex params', () => {
      const params = {
        filter: { status: 'active' },
        include: ['user', 'tags'],
        page: 1
      };
      
      cache.set('/api/test', params, { data: 'test' });
      
      expect(cache.get('/api/test', params)).toEqual({ data: 'test' });
    });
  });
});

