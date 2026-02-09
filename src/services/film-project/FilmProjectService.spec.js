import { describe, it, expect, beforeEach, vi } from 'vitest';
import FilmProjectService from './FilmProjectService';
import requestService from '@/services/request-service/ApiRequestService';

vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('FilmProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Projects ──────────────────────────────────────────────────────

  describe('getProjects', () => {
    it('fetches all projects', async () => {
      const projects = [{ id: 1, name: 'Project A' }, { id: 2, name: 'Project B' }];
      requestService.get.mockResolvedValue({ data: { data: projects } });

      const result = await FilmProjectService.getProjects();

      expect(requestService.get).toHaveBeenCalledWith('/film-projects');
      expect(result).toEqual(projects);
    });

    it('returns empty array when response has no data wrapper', async () => {
      requestService.get.mockResolvedValue({ data: [] });

      const result = await FilmProjectService.getProjects();
      expect(result).toEqual([]);
    });

    it('propagates errors', async () => {
      requestService.get.mockRejectedValue(new Error('Network error'));
      await expect(FilmProjectService.getProjects()).rejects.toThrow('Network error');
    });
  });

  describe('getProjectById', () => {
    it('fetches a single project by id', async () => {
      const project = { id: 42, name: 'My Film' };
      requestService.get.mockResolvedValue({ data: { data: project } });

      const result = await FilmProjectService.getProjectById(42);

      expect(requestService.get).toHaveBeenCalledWith('/film-projects/42');
      expect(result).toEqual(project);
    });

    it('handles raw data response', async () => {
      const project = { id: 1, name: 'Raw' };
      requestService.get.mockResolvedValue({ data: project });

      const result = await FilmProjectService.getProjectById(1);
      expect(result).toEqual(project);
    });
  });

  describe('createProject', () => {
    it('creates a project and returns it', async () => {
      const payload = { name: 'New Project', status: 'draft' };
      const created = { id: 10, ...payload };
      requestService.post.mockResolvedValue({ data: { data: created } });

      const result = await FilmProjectService.createProject(payload);

      expect(requestService.post).toHaveBeenCalledWith('/film-projects', payload);
      expect(result).toEqual(created);
    });

    it('propagates validation errors', async () => {
      requestService.post.mockRejectedValue(new Error('Validation failed'));
      await expect(FilmProjectService.createProject({})).rejects.toThrow('Validation failed');
    });
  });

  describe('updateProject', () => {
    it('updates a project', async () => {
      const payload = { name: 'Updated' };
      const updated = { id: 5, name: 'Updated' };
      requestService.put.mockResolvedValue({ data: { data: updated } });

      const result = await FilmProjectService.updateProject(5, payload);

      expect(requestService.put).toHaveBeenCalledWith('/film-projects/5', payload);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteProject', () => {
    it('deletes a project', async () => {
      requestService.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      const result = await FilmProjectService.deleteProject(3);

      expect(requestService.delete).toHaveBeenCalledWith('/film-projects/3');
      expect(result).toEqual({ message: 'Deleted' });
    });
  });

  // ── Sequences ─────────────────────────────────────────────────────

  describe('getSequences', () => {
    it('fetches sequences for a project', async () => {
      const sequences = [{ id: 1, name: 'Act 1' }];
      requestService.get.mockResolvedValue({ data: { data: sequences } });

      const result = await FilmProjectService.getSequences(10);

      expect(requestService.get).toHaveBeenCalledWith('/film-projects/10/sequences');
      expect(result).toEqual(sequences);
    });

    it('returns empty array for no sequences', async () => {
      requestService.get.mockResolvedValue({ data: [] });
      const result = await FilmProjectService.getSequences(10);
      expect(result).toEqual([]);
    });
  });

  describe('getSequenceById', () => {
    it('fetches a single sequence', async () => {
      const seq = { id: 2, name: 'Act 2', projectId: 10 };
      requestService.get.mockResolvedValue({ data: { data: seq } });

      const result = await FilmProjectService.getSequenceById(10, 2);

      expect(requestService.get).toHaveBeenCalledWith('/film-projects/10/sequences/2');
      expect(result).toEqual(seq);
    });
  });

  describe('createSequence', () => {
    it('creates a sequence', async () => {
      const payload = { name: 'New Sequence', order: 1 };
      const created = { id: 5, ...payload, projectId: 10 };
      requestService.post.mockResolvedValue({ data: { data: created } });

      const result = await FilmProjectService.createSequence(10, payload);

      expect(requestService.post).toHaveBeenCalledWith('/film-projects/10/sequences', payload);
      expect(result).toEqual(created);
    });
  });

  describe('updateSequence', () => {
    it('updates a sequence', async () => {
      const payload = { name: 'Updated Sequence' };
      const updated = { id: 2, ...payload };
      requestService.put.mockResolvedValue({ data: { data: updated } });

      const result = await FilmProjectService.updateSequence(10, 2, payload);

      expect(requestService.put).toHaveBeenCalledWith('/film-projects/10/sequences/2', payload);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteSequence', () => {
    it('deletes a sequence', async () => {
      requestService.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      const result = await FilmProjectService.deleteSequence(10, 2);

      expect(requestService.delete).toHaveBeenCalledWith('/film-projects/10/sequences/2');
      expect(result).toEqual({ message: 'Deleted' });
    });
  });

  // ── Shots ─────────────────────────────────────────────────────────

  describe('getShots', () => {
    it('fetches shots for a sequence', async () => {
      const shots = [{ id: 1, name: 'Wide shot' }, { id: 2, name: 'Close-up' }];
      requestService.get.mockResolvedValue({ data: { data: shots } });

      const result = await FilmProjectService.getShots(10, 2);

      expect(requestService.get).toHaveBeenCalledWith('/film-projects/10/sequences/2/shots');
      expect(result).toEqual(shots);
    });

    it('returns empty array when no shots', async () => {
      requestService.get.mockResolvedValue({ data: [] });
      const result = await FilmProjectService.getShots(10, 2);
      expect(result).toEqual([]);
    });
  });

  describe('getShotById', () => {
    it('fetches a single shot', async () => {
      const shot = { id: 3, name: 'Hero shot', duration: 5 };
      requestService.get.mockResolvedValue({ data: { data: shot } });

      const result = await FilmProjectService.getShotById(10, 2, 3);

      expect(requestService.get).toHaveBeenCalledWith('/film-projects/10/sequences/2/shots/3');
      expect(result).toEqual(shot);
    });
  });

  describe('createShot', () => {
    it('creates a shot', async () => {
      const payload = { name: 'New Shot', duration: 3 };
      const created = { id: 7, ...payload };
      requestService.post.mockResolvedValue({ data: { data: created } });

      const result = await FilmProjectService.createShot(10, 2, payload);

      expect(requestService.post).toHaveBeenCalledWith(
        '/film-projects/10/sequences/2/shots',
        payload
      );
      expect(result).toEqual(created);
    });
  });

  describe('updateShot', () => {
    it('updates a shot', async () => {
      const payload = { name: 'Updated Shot' };
      const updated = { id: 3, ...payload };
      requestService.put.mockResolvedValue({ data: { data: updated } });

      const result = await FilmProjectService.updateShot(10, 2, 3, payload);

      expect(requestService.put).toHaveBeenCalledWith(
        '/film-projects/10/sequences/2/shots/3',
        payload
      );
      expect(result).toEqual(updated);
    });
  });

  describe('deleteShot', () => {
    it('deletes a shot', async () => {
      requestService.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      const result = await FilmProjectService.deleteShot(10, 2, 3);

      expect(requestService.delete).toHaveBeenCalledWith('/film-projects/10/sequences/2/shots/3');
      expect(result).toEqual({ message: 'Deleted' });
    });
  });

  // ── AI Generation ─────────────────────────────────────────────────

  describe('generateScript', () => {
    it('sends script generation request', async () => {
      const result = { script: 'INT. OFFICE — DAY' };
      requestService.post.mockResolvedValue({ data: { data: result } });

      const res = await FilmProjectService.generateScript(10, 'A thriller', { style: 'screenplay' });

      expect(requestService.post).toHaveBeenCalledWith(
        '/film-projects/10/generate/script',
        { prompt: 'A thriller', style: 'screenplay' }
      );
      expect(res).toEqual(result);
    });

    it('uses default options when none provided', async () => {
      requestService.post.mockResolvedValue({ data: { data: {} } });

      await FilmProjectService.generateScript(1, 'prompt');

      expect(requestService.post).toHaveBeenCalledWith(
        '/film-projects/1/generate/script',
        { prompt: 'prompt' }
      );
    });
  });

  describe('generateScene', () => {
    it('sends scene generation request', async () => {
      const result = { sceneData: { videoUrl: '/v/123.mp4' } };
      requestService.post.mockResolvedValue({ data: { data: result } });

      const res = await FilmProjectService.generateScene(10, 2, 3, 'A dark alley', {
        style: 'cinematic',
        resolution: '1080p',
      });

      expect(requestService.post).toHaveBeenCalledWith(
        '/film-projects/10/sequences/2/shots/3/generate/scene',
        { prompt: 'A dark alley', style: 'cinematic', resolution: '1080p' }
      );
      expect(res).toEqual(result);
    });
  });

  describe('getAvailableModels', () => {
    it('fetches available AI models', async () => {
      const models = [{ id: 'sd-xl', name: 'Stable Diffusion XL' }];
      requestService.get.mockResolvedValue({ data: { data: models } });

      const result = await FilmProjectService.getAvailableModels();

      expect(requestService.get).toHaveBeenCalledWith('/film-projects/ai/models');
      expect(result).toEqual(models);
    });

    it('returns empty array on no models', async () => {
      requestService.get.mockResolvedValue({ data: [] });
      const result = await FilmProjectService.getAvailableModels();
      expect(result).toEqual([]);
    });
  });
});

