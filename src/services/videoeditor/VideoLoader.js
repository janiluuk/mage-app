/**
 * VideoLoader - Service to load videos from mage-app API
 * Handles both video jobs and file-based videos
 */

import VideoFileAdapter from './VideoFileAdapter';
import FileService from '@/services/file.service';
import VideoJobsService from '@/services/videojobs.service';

class VideoLoader {

  /**
   * Load video by type and ID
   * @param {string} type - 'file' or 'job'
   * @param {string|number} id - Video ID
   * @returns {Promise<VideoFileAdapter>}
   */
  async loadVideo(type, id) {
    try {
      if (type === 'file') {
        return await this.loadFileVideo(id);
      } else if (type === 'job') {
        return await this.loadJobVideo(id);
      } else {
        throw new Error(`Unknown video type: ${type}`);
      }
    } catch (error) {
      console.error('Failed to load video:', error);
      throw error;
    }
  }

  /**
   * Load video from file
   * @param {string|number} fileId - File ID
   * @returns {Promise<VideoFileAdapter>}
   */
  async loadFileVideo(fileId) {
    try {
      // Get file data - FileService.get returns the file object
      const fileData = await FileService.get(fileId);
      
      // Extract video data - handle both direct response and wrapped response
      const videoData = fileData.data || fileData;
      
      // Get metadata (if available from API)
      const metadata = this.extractMetadataFromFile(videoData);
      
      // Create VideoFileAdapter
      const videoFile = new VideoFileAdapter(videoData, metadata);
      
      return videoFile;
    } catch (error) {
      console.error('Failed to load file video:', error);
      throw new Error(`Failed to load file video: ${error.message}`);
    }
  }

  /**
   * Load video from video job
   * @param {string|number} jobId - Job ID
   * @returns {Promise<VideoFileAdapter>}
   */
  async loadJobVideo(jobId) {
    try {
      // Get job data - VideoJobsService.get returns the job object
      const jobData = await VideoJobsService.get(jobId);
      
      // Extract video data - handle both direct response and wrapped response
      const videoData = jobData.data || jobData;
      
      // Get metadata
      const metadata = this.extractMetadataFromJob(videoData);
      
      // Create VideoFileAdapter
      const videoFile = new VideoFileAdapter(videoData, metadata);
      
      return videoFile;
    } catch (error) {
      console.error('Failed to load job video:', error);
      throw new Error(`Failed to load job video: ${error.message}`);
    }
  }

  /**
   * Extract metadata from file data
   */
  extractMetadataFromFile(fileData) {
    const attributes = fileData.attributes || fileData;
    
    return {
      format: {
        duration: attributes.duration || 0,
        filename: attributes.full_path || attributes.url || '',
        format_name: attributes.type || 'mp4'
      },
      videoStream: {
        width: attributes.width || 1920,
        height: attributes.height || 1080,
        codec_name: attributes.codec || 'h264',
        bit_rate: attributes.bitrate || 0,
        avg_frame_rate: `${attributes.fps || 30}/1`
      },
      audioStream: attributes.has_audio !== false ? {} : undefined,
      hasAudio: attributes.has_audio !== false,
      fps: attributes.fps || 30,
      duration: attributes.duration || 0
    };
  }

  /**
   * Extract metadata from job data
   */
  extractMetadataFromJob(jobData) {
    const attributes = jobData.attributes || jobData;
    
    return {
      format: {
        duration: attributes.length || 0,
        filename: attributes.url || attributes.preview_url || '',
        format_name: 'mp4'
      },
      videoStream: {
        width: attributes.width || 1920,
        height: attributes.height || 1080,
        codec_name: 'h264',
        bit_rate: 0,
        avg_frame_rate: `${attributes.fps || 30}/1`
      },
      audioStream: {},
      hasAudio: true,
      fps: attributes.fps || 30,
      duration: attributes.length || 0
    };
  }

  /**
   * Load video metadata using ffprobe (if backend supports it)
   * This is optional and can be implemented if the backend has a metadata endpoint
   */
  async loadVideoMetadata(videoUrl) {
    // TODO: Implement if backend has metadata endpoint
    // For now, we'll use basic metadata from the file/job data
    return null;
  }
}

export default new VideoLoader();

