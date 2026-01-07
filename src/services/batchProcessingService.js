/**
 * Batch Processing Service
 * Handles processing multiple video files with shared settings
 */

/**
 * Batch job status
 */
export const BatchStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  PARTIAL: 'partial',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

/**
 * Individual file status
 */
export const FileStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

/**
 * Generate unique batch ID
 * @returns {string} Batch ID
 */
export function generateBatchId() {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate batch progress
 * @param {Array} files - Array of file objects with status
 * @returns {number} Progress percentage (0-100)
 */
export function calculateBatchProgress(files) {
  if (!files || files.length === 0) return 0;
  
  const completed = files.filter(f => 
    f.status === FileStatus.COMPLETE || 
    f.status === FileStatus.ERROR
  ).length;
  
  return Math.round((completed / files.length) * 100);
}

/**
 * Get batch statistics
 * @param {Array} files - Array of file objects
 * @returns {object} Statistics object
 */
export function getBatchStatistics(files) {
  const stats = {
    total: files.length,
    pending: 0,
    uploading: 0,
    queued: 0,
    processing: 0,
    complete: 0,
    error: 0,
    cancelled: 0
  };
  
  files.forEach(file => {
    switch (file.status) {
      case FileStatus.PENDING:
        stats.pending++;
        break;
      case FileStatus.UPLOADING:
        stats.uploading++;
        break;
      case FileStatus.QUEUED:
        stats.queued++;
        break;
      case FileStatus.PROCESSING:
        stats.processing++;
        break;
      case FileStatus.COMPLETE:
        stats.complete++;
        break;
      case FileStatus.ERROR:
        stats.error++;
        break;
      case FileStatus.CANCELLED:
        stats.cancelled++;
        break;
    }
  });
  
  return stats;
}

/**
 * Validate batch settings
 * @param {object} settings - Batch settings
 * @returns {object} Validation result
 */
export function validateBatchSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { isValid: false, error: 'Invalid settings object' };
  }
  
  // Add specific validation rules as needed
  if (settings.concurrency && (settings.concurrency < 1 || settings.concurrency > 10)) {
    return { isValid: false, error: 'Concurrency must be between 1 and 10' };
  }
  
  return { isValid: true, error: null };
}

/**
 * BatchProcessingService class
 * Main service for batch processing operations
 */
export class BatchProcessingService {
  constructor() {
    this.batches = new Map();
    this.defaultConcurrency = 3;
  }
  
  /**
   * Create a new batch
   * @param {Array} files - Array of File objects
   * @param {object} sharedSettings - Settings to apply to all files
   * @returns {object} Batch object
   */
  createBatch(files, sharedSettings = {}) {
    const batchId = generateBatchId();
    
    const batch = {
      id: batchId,
      status: BatchStatus.PENDING,
      files: files.map((file, index) => ({
        id: `${batchId}_file_${index}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        status: FileStatus.PENDING,
        progress: 0,
        jobId: null,
        error: null,
        customSettings: {}
      })),
      sharedSettings,
      concurrency: this.defaultConcurrency,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };
    
    this.batches.set(batchId, batch);
    return batch;
  }
  
  /**
   * Get batch by ID
   * @param {string} batchId - Batch ID
   * @returns {object|null} Batch object or null
   */
  getBatch(batchId) {
    return this.batches.get(batchId) || null;
  }
  
  /**
   * Update file status in batch
   * @param {string} batchId - Batch ID
   * @param {string} fileId - File ID
   * @param {object} updates - Updates to apply
   */
  updateFileStatus(batchId, fileId, updates) {
    const batch = this.getBatch(batchId);
    if (!batch) return;
    
    const file = batch.files.find(f => f.id === fileId);
    if (!file) return;
    
    Object.assign(file, updates);
    
    // Update batch status
    this.updateBatchStatus(batchId);
  }
  
  /**
   * Update batch status based on file statuses
   * @param {string} batchId - Batch ID
   */
  updateBatchStatus(batchId) {
    const batch = this.getBatch(batchId);
    if (!batch) return;
    
    const stats = getBatchStatistics(batch.files);
    
    if (stats.processing > 0 || stats.uploading > 0) {
      batch.status = BatchStatus.PROCESSING;
      if (!batch.startedAt) {
        batch.startedAt = new Date().toISOString();
      }
    } else if (stats.complete === stats.total) {
      batch.status = BatchStatus.COMPLETE;
      batch.completedAt = new Date().toISOString();
    } else if (stats.complete > 0 && stats.error > 0) {
      batch.status = BatchStatus.PARTIAL;
      batch.completedAt = new Date().toISOString();
    } else if (stats.error === stats.total) {
      batch.status = BatchStatus.ERROR;
      batch.completedAt = new Date().toISOString();
    } else if (stats.cancelled > 0) {
      batch.status = BatchStatus.CANCELLED;
      batch.completedAt = new Date().toISOString();
    } else if (stats.queued > 0) {
      batch.status = BatchStatus.QUEUED;
    }
  }
  
  /**
   * Get files ready to process (respecting concurrency)
   * @param {string} batchId - Batch ID
   * @returns {Array} Files ready to process
   */
  getFilesToProcess(batchId) {
    const batch = this.getBatch(batchId);
    if (!batch) return [];
    
    const stats = getBatchStatistics(batch.files);
    const slotsAvailable = batch.concurrency - stats.processing;
    
    if (slotsAvailable <= 0) return [];
    
    return batch.files
      .filter(f => f.status === FileStatus.PENDING || f.status === FileStatus.QUEUED)
      .slice(0, slotsAvailable);
  }
  
  /**
   * Cancel batch processing
   * @param {string} batchId - Batch ID
   */
  cancelBatch(batchId) {
    const batch = this.getBatch(batchId);
    if (!batch) return;
    
    batch.files.forEach(file => {
      if (file.status === FileStatus.PENDING || file.status === FileStatus.QUEUED) {
        file.status = FileStatus.CANCELLED;
      }
    });
    
    batch.status = BatchStatus.CANCELLED;
    batch.completedAt = new Date().toISOString();
  }
  
  /**
   * Remove file from batch
   * @param {string} batchId - Batch ID
   * @param {string} fileId - File ID
   * @returns {boolean} Success flag
   */
  removeFile(batchId, fileId) {
    const batch = this.getBatch(batchId);
    if (!batch) return false;
    
    const index = batch.files.findIndex(f => f.id === fileId);
    if (index === -1) return false;
    
    // Don't allow removal of processing files
    if (batch.files[index].status === FileStatus.PROCESSING) {
      return false;
    }
    
    batch.files.splice(index, 1);
    this.updateBatchStatus(batchId);
    return true;
  }
  
  /**
   * Get batch progress percentage
   * @param {string} batchId - Batch ID
   * @returns {number} Progress percentage
   */
  getProgress(batchId) {
    const batch = this.getBatch(batchId);
    if (!batch) return 0;
    
    return calculateBatchProgress(batch.files);
  }
  
  /**
   * Get batch statistics
   * @param {string} batchId - Batch ID
   * @returns {object} Statistics
   */
  getStatistics(batchId) {
    const batch = this.getBatch(batchId);
    if (!batch) return null;
    
    return getBatchStatistics(batch.files);
  }
  
  /**
   * Delete batch
   * @param {string} batchId - Batch ID
   */
  deleteBatch(batchId) {
    this.batches.delete(batchId);
  }
  
  /**
   * Get all batches
   * @returns {Array} Array of batch objects
   */
  getAllBatches() {
    return Array.from(this.batches.values());
  }
}

/**
 * Create batch processing service instance
 * @returns {BatchProcessingService} Service instance
 */
export function useBatchProcessingService() {
  return new BatchProcessingService();
}

export default {
  BatchStatus,
  FileStatus,
  generateBatchId,
  calculateBatchProgress,
  getBatchStatistics,
  validateBatchSettings,
  BatchProcessingService,
  useBatchProcessingService
};
