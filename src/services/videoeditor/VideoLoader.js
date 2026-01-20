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
      // Get file data - FileService.get returns response.data
      const response = await FileService.get(fileId);
      
      // Handle different response structures
      // FileService.get returns response.data which could be:
      // - { data: {...} } (JSON:API format)
      // - { attributes: {...} } (JSON:API format)
      // - Direct object with properties
      let videoData = response;
      
      if (response.data) {
        videoData = response.data;
      } else if (response.attributes) {
        videoData = response;
      }
      
      // Validate that we have a video URL
      const videoUrl = videoData.fullPath || videoData.url || videoData.previewUrl || 
                       videoData.attributes?.fullPath || videoData.attributes?.url;
      
      if (!videoUrl) {
        throw new Error('Video URL not found in file data');
      }
      
      // Get metadata (if available from API)
      const metadata = this.extractMetadataFromFile(videoData);
      
      // Create VideoFileAdapter
      const videoFile = new VideoFileAdapter(videoData, metadata);
      
      return videoFile;
    } catch (error) {
      console.error('Failed to load file video:', error);
      
      // Provide more helpful error message
      if (error.response?.status === 404) {
        throw new Error(`Video file with ID ${fileId} not found. Please ensure the file exists and you have access to it.`);
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please log in to access this video.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view this video.');
      }
      
      throw new Error(`Failed to load file video: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Load video from video job
   * @param {string|number} jobId - Job ID
   * @returns {Promise<VideoFileAdapter>}
   */
  async loadJobVideo(jobId) {
    try {
      // Get job data - VideoJobsService.get returns deserialized JSON:API object
      const jobData = await VideoJobsService.get(jobId);
      
      // VideoJobsService.get returns a deserialized object which could be:
      // - Direct object with attributes
      // - Object with data property
      let videoData = jobData;
      
      if (jobData.data) {
        videoData = jobData.data;
      }
      
      // Validate that we have a video URL
      const videoUrl = videoData.url || videoData.previewUrl || 
                    videoData.attributes?.url || videoData.attributes?.previewUrl;
      
      if (!videoUrl) {
        throw new Error('Video URL not found in job data');
      }
      
      // Get metadata
      const metadata = this.extractMetadataFromJob(videoData);
      
      // Create VideoFileAdapter
      const videoFile = new VideoFileAdapter(videoData, metadata);
      
      return videoFile;
    } catch (error) {
      console.error('Failed to load job video:', error);
      
      // Provide more helpful error message
      if (error.response?.status === 404) {
        throw new Error(`Video job with ID ${jobId} not found. Please ensure the job exists and you have access to it.`);
      } else if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please log in to access this video.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to view this video.');
      }
      
      throw new Error(`Failed to load job video: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Extract metadata from file data
   */
  extractMetadataFromFile(fileData) {
    // Handle JSON:API format (attributes) or direct object
    const attributes = fileData.attributes || fileData;
    
    // Get video URL for filename
    const filename = attributes.full_path || attributes.url || 
                     attributes.previewUrl || attributes.file?.url || '';
    
    return {
      format: {
        duration: attributes.duration || attributes.length || 0,
        filename: filename,
        format_name: attributes.type || attributes.format || 'mp4'
      },
      videoStream: {
        width: attributes.width || 1920,
        height: attributes.height || 1080,
        codec_name: attributes.codec || 'h264',
        bit_rate: attributes.bitrate || attributes.bit_rate || 0,
        avg_frame_rate: `${attributes.fps || attributes.frame_rate || 30}/1`
      },
      audioStream: attributes.has_audio !== false ? {} : undefined,
      hasAudio: attributes.has_audio !== false,
      isAudio: attributes.is_audio || false,
      fps: attributes.fps || attributes.frame_rate || 30,
      duration: attributes.duration || attributes.length || 0
    };
  }

  /**
   * Extract metadata from job data
   */
  extractMetadataFromJob(jobData) {
    // Handle JSON:API format (attributes) or direct object
    const attributes = jobData.attributes || jobData;
    
    // Get video URL
    const filename = attributes.url || attributes.preview_url || 
                     attributes.previewUrl || '';
    
    return {
      format: {
        duration: attributes.length || attributes.duration || 0,
        filename: filename,
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
      isAudio: false,
      fps: attributes.fps || 30,
      duration: attributes.length || attributes.duration || 0
    };
  }

  /**
   * Load video metadata using ffprobe (if backend supports it)
   * This is optional and can be implemented if the backend has a metadata endpoint
   * Currently not needed as metadata is provided by the API in file/job responses
   */
  async loadVideoMetadata(videoUrl) {
    // Optional: Implement if backend adds dedicated metadata endpoint
    // For now, metadata is extracted from file/job API responses
    return null;
  }
}

export default new VideoLoader();

