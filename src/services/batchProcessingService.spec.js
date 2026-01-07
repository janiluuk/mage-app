import { describe, it, expect, beforeEach } from 'vitest';
import {
  BatchStatus,
  FileStatus,
  generateBatchId,
  calculateBatchProgress,
  getBatchStatistics,
  validateBatchSettings,
  BatchProcessingService
} from './batchProcessingService';

describe('batchProcessingService', () => {
  describe('generateBatchId', () => {
    it('generates unique batch IDs', () => {
      const id1 = generateBatchId();
      const id2 = generateBatchId();
      
      expect(id1).toMatch(/^batch_/);
      expect(id2).toMatch(/^batch_/);
      expect(id1).not.toBe(id2);
    });
  });
  
  describe('calculateBatchProgress', () => {
    it('calculates progress correctly', () => {
      const files = [
        { status: FileStatus.COMPLETE },
        { status: FileStatus.COMPLETE },
        { status: FileStatus.PROCESSING },
        { status: FileStatus.PENDING }
      ];
      
      const progress = calculateBatchProgress(files);
      expect(progress).toBe(50); // 2 out of 4 complete
    });
    
    it('returns 0 for empty array', () => {
      expect(calculateBatchProgress([])).toBe(0);
    });
    
    it('returns 100 for all complete', () => {
      const files = [
        { status: FileStatus.COMPLETE },
        { status: FileStatus.COMPLETE }
      ];
      
      expect(calculateBatchProgress(files)).toBe(100);
    });
    
    it('counts errors as complete', () => {
      const files = [
        { status: FileStatus.COMPLETE },
        { status: FileStatus.ERROR }
      ];
      
      expect(calculateBatchProgress(files)).toBe(100);
    });
  });
  
  describe('getBatchStatistics', () => {
    it('returns correct statistics', () => {
      const files = [
        { status: FileStatus.PENDING },
        { status: FileStatus.PROCESSING },
        { status: FileStatus.PROCESSING },
        { status: FileStatus.COMPLETE },
        { status: FileStatus.ERROR }
      ];
      
      const stats = getBatchStatistics(files);
      
      expect(stats.total).toBe(5);
      expect(stats.pending).toBe(1);
      expect(stats.processing).toBe(2);
      expect(stats.complete).toBe(1);
      expect(stats.error).toBe(1);
    });
  });
  
  describe('validateBatchSettings', () => {
    it('validates correct settings', () => {
      const settings = { concurrency: 3 };
      const result = validateBatchSettings(settings);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('rejects invalid concurrency', () => {
      const settings = { concurrency: 15 };
      const result = validateBatchSettings(settings);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('concurrency');
    });
    
    it('rejects invalid settings object', () => {
      const result = validateBatchSettings(null);
      
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('BatchProcessingService', () => {
    let service;
    let mockFiles;
    
    beforeEach(() => {
      service = new BatchProcessingService();
      mockFiles = [
        new File(['content1'], 'video1.mp4'),
        new File(['content2'], 'video2.mp4'),
        new File(['content3'], 'video3.mp4')
      ];
    });
    
    describe('createBatch', () => {
      it('creates a batch with correct structure', () => {
        const sharedSettings = { prompt: 'test' };
        const batch = service.createBatch(mockFiles, sharedSettings);
        
        expect(batch.id).toMatch(/^batch_/);
        expect(batch.status).toBe(BatchStatus.PENDING);
        expect(batch.files).toHaveLength(3);
        expect(batch.sharedSettings).toEqual(sharedSettings);
        expect(batch.concurrency).toBe(3);
      });
      
      it('assigns file IDs correctly', () => {
        const batch = service.createBatch(mockFiles);
        
        batch.files.forEach((file, index) => {
          expect(file.id).toContain(batch.id);
          expect(file.fileName).toBe(mockFiles[index].name);
          expect(file.status).toBe(FileStatus.PENDING);
        });
      });
    });
    
    describe('getBatch', () => {
      it('retrieves existing batch', () => {
        const batch = service.createBatch(mockFiles);
        const retrieved = service.getBatch(batch.id);
        
        expect(retrieved).toBe(batch);
      });
      
      it('returns null for non-existent batch', () => {
        const retrieved = service.getBatch('non_existent');
        expect(retrieved).toBeNull();
      });
    });
    
    describe('updateFileStatus', () => {
      it('updates file status', () => {
        const batch = service.createBatch(mockFiles);
        const fileId = batch.files[0].id;
        
        service.updateFileStatus(batch.id, fileId, {
          status: FileStatus.PROCESSING,
          progress: 50
        });
        
        const updated = service.getBatch(batch.id);
        expect(updated.files[0].status).toBe(FileStatus.PROCESSING);
        expect(updated.files[0].progress).toBe(50);
      });
      
      it('updates batch status when file completes', () => {
        const batch = service.createBatch(mockFiles);
        
        batch.files.forEach((file, index) => {
          service.updateFileStatus(batch.id, file.id, {
            status: FileStatus.COMPLETE
          });
        });
        
        const updated = service.getBatch(batch.id);
        expect(updated.status).toBe(BatchStatus.COMPLETE);
        expect(updated.completedAt).toBeDefined();
      });
    });
    
    describe('getFilesToProcess', () => {
      it('returns files respecting concurrency', () => {
        const batch = service.createBatch(mockFiles);
        batch.concurrency = 2;
        
        const toProcess = service.getFilesToProcess(batch.id);
        expect(toProcess).toHaveLength(2);
      });
      
      it('returns empty when concurrency limit reached', () => {
        const batch = service.createBatch(mockFiles);
        batch.concurrency = 2;
        
        // Mark 2 files as processing
        service.updateFileStatus(batch.id, batch.files[0].id, {
          status: FileStatus.PROCESSING
        });
        service.updateFileStatus(batch.id, batch.files[1].id, {
          status: FileStatus.PROCESSING
        });
        
        const toProcess = service.getFilesToProcess(batch.id);
        expect(toProcess).toHaveLength(0);
      });
    });
    
    describe('cancelBatch', () => {
      it('cancels pending files', () => {
        const batch = service.createBatch(mockFiles);
        service.cancelBatch(batch.id);
        
        const cancelled = service.getBatch(batch.id);
        expect(cancelled.status).toBe(BatchStatus.CANCELLED);
        expect(cancelled.files.every(f => f.status === FileStatus.CANCELLED)).toBe(true);
      });
    });
    
    describe('removeFile', () => {
      it('removes pending file', () => {
        const batch = service.createBatch(mockFiles);
        const fileId = batch.files[0].id;
        
        const success = service.removeFile(batch.id, fileId);
        
        expect(success).toBe(true);
        const updated = service.getBatch(batch.id);
        expect(updated.files).toHaveLength(2);
      });
      
      it('prevents removing processing file', () => {
        const batch = service.createBatch(mockFiles);
        const fileId = batch.files[0].id;
        
        service.updateFileStatus(batch.id, fileId, {
          status: FileStatus.PROCESSING
        });
        
        const success = service.removeFile(batch.id, fileId);
        expect(success).toBe(false);
      });
    });
    
    describe('getProgress', () => {
      it('returns batch progress', () => {
        const batch = service.createBatch(mockFiles);
        
        service.updateFileStatus(batch.id, batch.files[0].id, {
          status: FileStatus.COMPLETE
        });
        
        const progress = service.getProgress(batch.id);
        expect(progress).toBeCloseTo(33, 0);
      });
    });
    
    describe('getStatistics', () => {
      it('returns batch statistics', () => {
        const batch = service.createBatch(mockFiles);
        const stats = service.getStatistics(batch.id);
        
        expect(stats.total).toBe(3);
        expect(stats.pending).toBe(3);
      });
    });
    
    describe('deleteBatch', () => {
      it('deletes batch', () => {
        const batch = service.createBatch(mockFiles);
        service.deleteBatch(batch.id);
        
        const deleted = service.getBatch(batch.id);
        expect(deleted).toBeNull();
      });
    });
    
    describe('getAllBatches', () => {
      it('returns all batches', () => {
        service.createBatch(mockFiles);
        service.createBatch(mockFiles);
        
        const all = service.getAllBatches();
        expect(all).toHaveLength(2);
      });
    });
  });
});
